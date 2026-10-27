// src/stores/procurementInsightsStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

export const useProcurementInsightsStore = create((set, get) => ({
	loading: false,
	startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
	endDate: new Date().toISOString().split("T")[0],

	salesSummary: [],
	theoreticalConsumption: {}, // itemId -> { totalUnits, totalCost, item }
	stockAudits: [],
	prepLogs: [],
	suggestedOrders: [], // Array of items with calculated suggested_order_qty grouped by vendor
	vendors: [],

	setDates: (start, end) => {
		set({ startDate: start, endDate: end });
		get().fetchInsightsData();
	},

	fetchInsightsData: async () => {
		const { startDate, endDate } = get();
		set({ loading: true });

		try {
			// 1. Fetch sales in date range (from monthly_sales or orders fallback)
			const [salesRes, recipesRes, invRes, vendorsRes, auditsRes, prepRes] = await Promise.all([
				supabase
					.from("monthly_sales")
					.select(
						`
            menu_item_id,
            menu_item_name_burmese,
            menu_item_name_english,
            quantity_sold,
            total_revenue,
            sale_date
          `
					)
					.gte("sale_date", startDate)
					.lte("sale_date", endDate),

				supabase
					.from("recipes")
					.select("id, menu_item_id, name_burmese, name_english, yield_quantity, yield_unit, recipe_type"),

				supabase
					.from("inventory_items")
					.select(
						`
            *,
            default_vendor:default_vendor_id (id, name, line_id),
            conversions:item_unit_conversions (*)
          `
					)
					.order("name_english"),

				supabase.from("vendors").select("*").order("name"),

				supabase
					.from("inventory_stock_audits")
					.select("*, inventory_item:inventory_item_id (id, name_burmese, name_english, unit)")
					.gte("audit_date", startDate)
					.lte("audit_date", endDate)
					.order("created_at", { ascending: false }),

				supabase
					.from("kitchen_prep_logs")
					.select("*, recipe:recipe_id (id, name_burmese, name_english, recipe_type)")
					.gte("log_date", startDate)
					.lte("log_date", endDate)
					.order("created_at", { ascending: false }),
			]);

			if (salesRes.error) throw salesRes.error;
			if (recipesRes.error) throw recipesRes.error;
			if (invRes.error) throw invRes.error;
			if (vendorsRes.error) throw vendorsRes.error;

			const sales = salesRes.data || [];
			const recipes = recipesRes.data || [];
			const inventoryItems = (invRes.data || []).map((item) => ({
				...item,
				name: item.name_english || item.name_burmese,
			}));
			const vendors = vendorsRes.data || [];

			// 2. Aggregate sales quantity by menu_item_id
			const salesByMenu = {};
			sales.forEach((s) => {
				if (!s.menu_item_id) return;
				salesByMenu[s.menu_item_id] =
					(salesByMenu[s.menu_item_id] || 0) + (Number(s.quantity_sold) || 0);
			});

			// 3. Explode recipes for sold menu items and compute theoretical consumption
			const menuRecipes = recipes.filter(
				(r) => r.recipe_type === "menu_prep" && r.menu_item_id
			);

			const theoreticalConsumption = {}; // itemId -> { totalUnits, totalCost, item }

			// Explode each active menu recipe
			for (const recipe of menuRecipes) {
				const soldCount = salesByMenu[recipe.menu_item_id];
				if (!soldCount || soldCount <= 0) continue;

				const { data: bomData, error: bomErr } = await supabase.rpc(
					"explode_recipe_bom",
					{ target_recipe_id: recipe.id }
				);

				if (!bomErr && bomData) {
					const recipeBatches = soldCount / (Number(recipe.yield_quantity) || 1);

					bomData.forEach((raw) => {
						const invId = raw.inventory_item_id;
						const invItem = inventoryItems.find((i) => i.id === invId);
						const unitsUsed = Number(raw.total_purchase_units_required) * recipeBatches;
						const cost = Number(raw.unit_cost) * unitsUsed;

						if (!theoreticalConsumption[invId]) {
							theoreticalConsumption[invId] = {
								inventory_item_id: invId,
								item: invItem || {
									id: invId,
									name_burmese: raw.name_burmese,
									name_english: raw.name_english,
									unit: raw.purchase_unit,
									cost_per_unit: raw.unit_cost,
								},
								total_units: 0,
								total_cost: 0,
							};
						}

						theoreticalConsumption[invId].total_units += unitsUsed;
						theoreticalConsumption[invId].total_cost += cost;
					});
				}
			}

			// 4. Calculate Smart Grocery Cycle Suggestions
			// Days span in range (default 7 days)
			const daysSpan = Math.max(
				1,
				Math.round(
					(new Date(endDate).getTime() - new Date(startDate).getTime()) /
						(1000 * 60 * 60 * 24)
				) + 1
			);

			const suggestedList = inventoryItems
				.map((item) => {
					const itemType = item.item_type || "ingredient";
					const threshold = item.threshold || 0;
					const currentQty = item.quantity || 0;
					const cycleDays = item.order_cycle_days || 1;

					let dailyAvg = 0;
					let requiredStock = 0;
					let suggestedQty = 0;

					if (itemType === "ingredient") {
						// Ingredients: Reordered based on Recipe BOMs + Sales Trends
						const consumed = theoreticalConsumption[item.id]?.total_units || 0;
						dailyAvg = consumed / daysSpan;
						requiredStock = dailyAvg * cycleDays + threshold;
						suggestedQty = Math.ceil(Math.max(0, requiredStock - currentQty));
					} else {
						// Packaging & Operational Supplies: Reordered purely on minimum safety threshold
						const targetBuffer = threshold > 0 ? threshold * 2 : 5;
						requiredStock = targetBuffer;
						suggestedQty = currentQty <= threshold ? Math.ceil(Math.max(0, targetBuffer - currentQty)) : 0;
					}

					return {
						item,
						itemType,
						dailyAvg: Math.round(dailyAvg * 100) / 100,
						cycleDays,
						currentQty,
						requiredStock: Math.round(requiredStock * 100) / 100,
						suggestedQty,
						estimatedCost: Math.round(suggestedQty * (item.cost_per_unit || 0) * 100) / 100,
						vendor_id: item.default_vendor_id || "unassigned",
						vendor: vendors.find((v) => v.id === item.default_vendor_id) || null,
					};
				})
				.filter((s) => s.suggestedQty > 0 || (s.currentQty <= (s.item.threshold || 0)));

			set({
				salesSummary: sales,
				theoreticalConsumption,
				stockAudits: auditsRes.data || [],
				prepLogs: prepRes.data || [],
				suggestedOrders: suggestedList,
				vendors,
				loading: false,
			});
		} catch (error) {
			console.error("Error fetching procurement insights:", error);
			showToast.error("Failed to calculate theoretical consumption");
			set({ loading: false });
		}
	},

	// Log Staff Physical Closing Stock Count
	logStockAudit: async (auditData) => {
		try {
			const { error } = await supabase
				.from("inventory_stock_audits")
				.insert([auditData]);

			if (error) throw error;

			await get().fetchInsightsData();
			showToast.success("Stock audit logged successfully");
			return { success: true };
		} catch (error) {
			console.error("Error logging stock audit:", error);
			showToast.error("Failed to log stock audit");
			return { error: error.message };
		}
	},

	// Log Kitchen Staff Prep Batch & Waste
	logKitchenPrep: async (prepData) => {
		try {
			const { error } = await supabase
				.from("kitchen_prep_logs")
				.insert([prepData]);

			if (error) throw error;

			await get().fetchInsightsData();
			showToast.success("Kitchen prep log recorded");
			return { success: true };
		} catch (error) {
			console.error("Error recording prep log:", error);
			showToast.error("Failed to record prep log");
			return { error: error.message };
		}
	},

	// Push Suggested Quantities to Market List
	pushToMarketList: async (itemsToPush) => {
		if (!itemsToPush || itemsToPush.length === 0) {
			showToast.error("No items selected to push");
			return;
		}

		try {
			for (const entry of itemsToPush) {
				const item = entry.item;
				const qty = entry.orderQty || entry.suggestedQty;
				if (qty <= 0) continue;

				// Check existing in market_list
				const { data: existing } = await supabase
					.from("market_list")
					.select("id, quantity")
					.eq("inventory_item_id", item.id)
					.eq("is_ordered", false);

				if (existing && existing.length > 0) {
					await supabase
						.from("market_list")
						.update({
							quantity: existing[0].quantity + qty,
							updated_at: new Date().toISOString(),
						})
						.eq("id", existing[0].id);
				} else {
					await supabase.from("market_list").insert([
						{
							inventory_item_id: item.id,
							vendor_id: item.default_vendor_id,
							quantity: qty,
							unit: item.unit,
							notes: `Suggested by Smart Cycle (Stock: ${item.quantity || 0})`,
						},
					]);
				}
			}

			showToast.success(`Pushed ${itemsToPush.length} items to Market List!`);
			return { success: true };
		} catch (error) {
			console.error("Error pushing items to market list:", error);
			showToast.error("Failed to push items to market list");
			return { error: error.message };
		}
	},
}));

export default useProcurementInsightsStore;
