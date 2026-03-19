// src/stores/procurementStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const useProcurementStore = create((set, get) => ({
	// State
	marketList: [],
	vendors: [],
	inventoryItems: [],
	loading: false,
	error: null,
	pendingUpdates: {}, // Store itemID -> newQuantity
	syncTimeout: null,

	// Procurement Order Status
	procurementOrders: [],
	selectedOrder: null,

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
			showToast.error("Failed to load vendors");
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
			showToast.error("Failed to load inventory items");
		}
	},

	// Fetch market list (items to buy)
	fetchMarketList: async (silent = false) => {
		if (!silent) set({ loading: true });
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
			
			// If we have pending updates, merge them with the fetched data
			const { pendingUpdates } = get();
			const fetchedItems = data || [];
			const mergedItems = fetchedItems.map(item => ({
				...item,
				quantity: pendingUpdates[item.id] !== undefined ? pendingUpdates[item.id] : item.quantity
			}));

			set({ marketList: mergedItems, error: null });
		} catch (error) {
			console.error("Error fetching market list:", error);
			set({ error: error.message });
		} finally {
			if (!silent) set({ loading: false });
		}
	},

	// Add item to market list (from inventory)
	addToMarketList: async (item) => {
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
			await get().fetchMarketList(true);
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
					vendor_id: itemData.vendor_id || null,
					quantity: itemData.quantity,
					unit: itemData.unit,
					notes: itemData.notes || "",
				},
			]);

			if (error) throw error;

			// Refresh list
			await get().fetchMarketList(true);
			return { success: true };
		} catch (error) {
			console.error("Error adding custom item:", error);
			return { error: error.message };
		}
	},

	// Update market list item (General purpose, e.g. for notes)
	updateMarketListItem: async (id, updates) => {
		const previousList = get().marketList;
		try {
			// Optimistically update local state
			set((state) => ({
				marketList: state.marketList.map((item) =>
					item.id === id ? { ...item, ...updates } : item
				),
			}));

			const { error } = await supabase
				.from("market_list")
				.update({
					...updates,
					updated_at: new Date(),
				})
				.eq("id", id);

			if (error) throw error;

			// Silently refresh list
			get().fetchMarketList(true);
			return { success: true };
		} catch (error) {
			console.error("Error updating market list item:", error);
			// Rollback on error
			set({ marketList: previousList });
			return { error: error.message };
		}
	},

	// Debounced background sync for quantity updates
	updateMarketListQuantity: (id, newQuantity) => {
		// 1. Optimistically update local state
		set((state) => ({
			marketList: state.marketList.map((item) =>
				item.id === id ? { ...item, quantity: newQuantity } : item
			),
			// 2. Add to pending updates
			pendingUpdates: {
				...state.pendingUpdates,
				[id]: newQuantity
			}
		}));

		// 3. Debounce the sync
		const { syncTimeout } = get();
		if (syncTimeout) clearTimeout(syncTimeout);

		const timeout = setTimeout(() => {
			get().syncPendingUpdates();
		}, 3000); // Wait 3 seconds of inactivity before syncing

		set({ syncTimeout: timeout });
	},

	// Background Sync for Market List
	syncPendingUpdates: async () => {
		const { pendingUpdates } = get();
		const updateEntries = Object.entries(pendingUpdates);
		
		if (updateEntries.length === 0) return;

		// Snapshot
		const snapshot = { ...pendingUpdates };
		
		// Clear immediately
		set({ pendingUpdates: {}, syncTimeout: null });

		try {
			const promises = updateEntries.map(([id, quantity]) => 
				supabase
					.from("market_list")
					.update({ 
						quantity,
						updated_at: new Date()
					})
					.eq("id", id)
			);

			await Promise.all(promises);
			
			// Silently refresh to stay in sync
			get().fetchMarketList(true);
		} catch (error) {
			console.error("Error syncing market list updates:", error);
		}
	},

	// Remove from market list
	removeFromMarketList: async (id) => {
		try {
			const { error } = await supabase
				.from("market_list")
				.delete()
				.eq("id", id);

			if (error) throw error;

			await get().fetchMarketList(true);
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
			// Make sure we only include items that are not ordered
			if (!item.is_ordered) {
				if (item.vendor_id && vendorMap.has(item.vendor_id)) {
					vendorMap.get(item.vendor_id).items.push(item);
				} else {
					vendorMap.get("tbd").items.push(item);
				}
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

	// Confirm order (move from market list to orders)
	confirmOrder: async (vendorId, items, estimatedArrival, notes = "") => {
		try {
			set({ loading: true });

			// Create order
			const { data: order, error: orderError } = await supabase
				.from("procurement_orders")
				.insert([
					{
						vendor_id: vendorId,
						status: "ordered",
						estimated_arrival: estimatedArrival,
						notes,
						total_items: items.length,
					},
				])
				.select()
				.single();

			if (orderError) throw orderError;

			// Create order items
			const orderItems = items.map((item) => ({
				order_id: order.id,
				market_list_item_id: item.id,
				inventory_item_id: item.inventory_item_id,
				custom_item_name: item.custom_item_name,
				vendor_id: vendorId,
				quantity: item.quantity,
				unit: item.unit,
				notes: item.notes,
				received: false,
				is_missed: false,
			}));

			const { error: itemsError } = await supabase
				.from("procurement_order_items")
				.insert(orderItems);

			if (itemsError) throw itemsError;

			const failedUpdates = [];
			for (const item of items) {
				const { error: updateError } = await supabase
					.from("market_list")
					.update({ is_ordered: true })
					.eq("id", item.id);

				if (updateError) {
					console.warn(`Failed to update item ${item.id}:`, updateError);
					failedUpdates.push(item.inventory_item?.name || item.custom_item_name);
				}
			}

			if (failedUpdates.length > 0) {
				showToast.warning(`Order confirmed, but ${failedUpdates.length} items failed to update in market list.`);
			}

			// Refresh data
			await get().fetchMarketList(true);
			await get().fetchProcurementOrders();

			showToast.success(`Order confirmed for ${vendorId}`);
			return { success: true, order };
		} catch (error) {
			console.error("Error confirming order:", error);
			showToast.error("Failed to confirm order");
			return { error: error.message };
		} finally {
			set({ loading: false });
		}
	},

	// Fetch procurement orders
	fetchProcurementOrders: async () => {
		try {
			const { data, error } = await supabase
				.from("procurement_orders")
				.select(
					`
          *,
          vendor:vendor_id (
            id,
            name,
            line_id
          ),
          items:procurement_order_items (
            id,
            inventory_item_id,
            custom_item_name,
            quantity,
            unit,
            notes,
            received,
            received_quantity,
            is_missed,
            inventory_item:inventory_item_id (
              id,
              name,
              image_url,
              unit
            )
          )
        `
				)
				.order("created_at", { ascending: false });

			if (error) throw error;
			set({ procurementOrders: data || [] });
		} catch (error) {
			console.error("Error fetching orders:", error);
			showToast.error("Failed to load procurement orders");
		}
	},

	// Update order status (arrived with received/missed items)
	updateOrderStatus: async (
		orderId,
		status,
		receivedItems,
		missedItems,
		notes = ""
	) => {
		try {
			set({ loading: true });

			// Update order
			const { error: orderError } = await supabase
				.from("procurement_orders")
				.update({
					status,
					arrived_at: status === "arrived" ? new Date() : null,
					notes,
				})
				.eq("id", orderId);

			if (orderError) throw orderError;

			// Update received status for items
			for (const item of receivedItems) {
				await supabase
					.from("procurement_order_items")
					.update({
						received: true,
						received_quantity: item.quantity,
						is_missed: false,
					})
					.eq("id", item.id);
			}

			// Handle missed items - ADD BACK TO MARKET LIST WITH CORRECT VENDOR
			for (const item of missedItems) {
				// Update the order item to mark as missed
				await supabase
					.from("procurement_order_items")
					.update({
						received: false,
						received_quantity: 0,
						is_missed: true,
					})
					.eq("id", item.id);

				// Add missed items back to market list with the ORIGINAL vendor
				const { error: insertError } = await supabase
					.from("market_list")
					.insert([
						{
							inventory_item_id: item.inventory_item_id,
							custom_item_name: item.custom_item_name,
							vendor_id: item.vendor_id, // Use the original vendor_id from the order item
							quantity: item.quantity,
							unit: item.unit,
							notes: item.notes
								? `Missed from order - ${item.notes}`
								: "Missed from order",
							is_ordered: false,
						},
					]);

				if (insertError) {
					console.error(
						"Failed to add missed item back to market list:",
						insertError
					);
				}
			}

			// Refresh data
			await get().fetchProcurementOrders();
			await get().fetchMarketList(true);

			if (missedItems.length > 0) {
				showToast.warning(
					`${missedItems.length} missed items added back to market list`
				);
			} else {
				showToast.success("Order marked as arrived");
			}

			return { success: true };
		} catch (error) {
			console.error("Error updating order:", error);
			showToast.error("Failed to update order");
			return { error: error.message };
		} finally {
			set({ loading: false });
		}
	},
	// Set selected order for modal
	setSelectedOrder: (order) => set({ selectedOrder: order }),

	// Get orders by status
	getOrdersByStatus: (status) => {
		const orders = get().procurementOrders;
		if (status === "all") return orders;
		return orders.filter((order) => order.status === status);
	},
}));

export default useProcurementStore;
