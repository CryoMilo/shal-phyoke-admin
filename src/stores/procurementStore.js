// src/stores/procurementStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";

const useProcurementStore = create((set, get) => ({
	// State
	marketList: [],
	vendors: [],
	inventoryItems: [],
	loading: false,
	error: null,

	// UI states
	activeTab: "market-list",
	expandedVendors: [],

	// Fetch all vendors
	fetchVendors: async () => {
		try {
			const { data, error } = await supabase
				.from("vendors")
				.select("*")
				.order("name");

			if (error) throw error;
			set({ vendors: data || [] });
		} catch (error) {
			console.error("Error fetching vendors:", error);
		}
	},

	// Fetch inventory items
	fetchInventoryItems: async () => {
		try {
			const { data, error } = await supabase
				.from("inventory_items")
				.select(
					`
          *,
          default_vendor:default_vendor_id (
            id,
            name
          )
        `
				)
				.order("name");

			if (error) throw error;
			set({ inventoryItems: data || [] });
		} catch (error) {
			console.error("Error fetching inventory items:", error);
		}
	},

	// Fetch market list (items to buy)
	fetchMarketList: async () => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("market_list")
				.select(
					`
          *,
          inventory_item:inventory_item_id (
            id,
            name,
            image_url,
            category
          ),
          vendor:vendor_id (
            id,
            name
          )
        `
				)
				.eq("is_ordered", false)
				.order("added_at", { ascending: false });

			if (error) throw error;
			set({ marketList: data || [], error: null });
		} catch (error) {
			console.error("Error fetching market list:", error);
			set({ error: error.message });
		} finally {
			set({ loading: false });
		}
	},

	// Add item to market list (from inventory)
	addToMarketList: async (item) => {
		console.log("Adding to market list:", item);

		try {
			// Check if item already exists
			const { data: existingItems, error: checkError } = await supabase
				.from("market_list")
				.select("*")
				.eq("inventory_item_id", item.id)
				.eq("is_ordered", false);

			if (checkError) throw checkError;

			if (existingItems && existingItems.length > 0) {
				// Update quantity
				const existingItem = existingItems[0];
				const newQuantity = existingItem.quantity + item.quantity;

				const { error: updateError } = await supabase
					.from("market_list")
					.update({
						quantity: newQuantity,
						updated_at: new Date(),
					})
					.eq("id", existingItem.id);

				if (updateError) throw updateError;
			} else {
				// Insert new item
				const { error: insertError } = await supabase
					.from("market_list")
					.insert([
						{
							inventory_item_id: item.id,
							vendor_id: item.default_vendor_id,
							quantity: item.quantity,
							unit: item.unit,
							notes: item.notes || "",
						},
					]);

				if (insertError) throw insertError;
			}

			// Refresh list
			await get().fetchMarketList();
			return { success: true };
		} catch (error) {
			console.error("Error adding to market list:", error);
			return { error: error.message };
		}
	},

	// Add custom item (not in inventory)
	addCustomItem: async (itemData) => {
		try {
			const { error } = await supabase.from("market_list").insert([
				{
					custom_item_name: itemData.name,
					vendor_id: itemData.vendor_id,
					quantity: itemData.quantity,
					unit: itemData.unit,
					notes: itemData.notes || "",
				},
			]);

			if (error) throw error;

			await get().fetchMarketList();
			return { success: true };
		} catch (error) {
			console.error("Error adding custom item:", error);
			return { error: error.message };
		}
	},

	// Update market list item
	updateMarketListItem: async (id, updates) => {
		try {
			const { error } = await supabase
				.from("market_list")
				.update({
					...updates,
					updated_at: new Date(),
				})
				.eq("id", id);

			if (error) throw error;

			await get().fetchMarketList();
			return { success: true };
		} catch (error) {
			console.error("Error updating market list item:", error);
			return { error: error.message };
		}
	},

	// Remove from market list
	removeFromMarketList: async (id) => {
		try {
			// Get item name before deleting
			const { error } = await supabase
				.from("market_list")
				.delete()
				.eq("id", id);

			if (error) throw error;

			await get().fetchMarketList();
			return { success: true };
		} catch (error) {
			console.error("Error removing from market list:", error);
			return { error: error.message };
		}
	},

	// Toggle vendor accordion
	toggleVendor: (vendorId) => {
		set((state) => ({
			expandedVendors: state.expandedVendors.includes(vendorId)
				? state.expandedVendors.filter((id) => id !== vendorId)
				: [...state.expandedVendors, vendorId],
		}));
	},

	// Expand all vendors
	expandAllVendors: () => {
		const vendors = get().vendors;
		set({ expandedVendors: vendors.map((v) => v.id) });
	},

	// Collapse all vendors
	collapseAllVendors: () => {
		set({ expandedVendors: [] });
	},

	// Set active tab
	setActiveTab: (tab) => set({ activeTab: tab }),

	// Get items grouped by vendor
	getItemsByVendor: () => {
		const items = get().marketList;
		const vendors = get().vendors;

		const vendorMap = new Map();

		// Add "TBD" group
		vendorMap.set("tbd", {
			id: "tbd",
			name: "TBD - No Vendor Assigned",
			items: [],
		});

		// Initialize vendors
		vendors.forEach((vendor) => {
			vendorMap.set(vendor.id, {
				...vendor,
				items: [],
			});
		});

		// Sort items into vendors
		items.forEach((item) => {
			if (item.vendor_id && vendorMap.has(item.vendor_id)) {
				vendorMap.get(item.vendor_id).items.push(item);
			} else {
				vendorMap.get("tbd").items.push(item);
			}
		});

		// Filter out empty vendors and sort
		return Array.from(vendorMap.values())
			.filter((vendor) => vendor.items.length > 0)
			.sort((a, b) => {
				if (a.id === "tbd") return 1;
				if (b.id === "tbd") return -1;
				return a.name.localeCompare(b.name);
			});
	},
}));

export default useProcurementStore;
