// src/stores/inventoryStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const useInventoryStore = create((set, get) => ({
	// State
	inventoryItems: [],
	vendors: [],
	loading: false,
	error: null,
	pendingUpdates: {}, // Store itemID -> newQuantity
	syncTimeout: null,

	// Filter states
	searchQuery: "",
	selectedVendors: [],
	showRegularOnly: false,

	// Fetch all inventory items
	fetchInventoryItems: async () => {
		// If we have pending updates, we might want to be careful about refetching
		// but typically we can just refetch and then re-apply pending updates if needed.
		// For simplicity, we just fetch.
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("inventory_items")
				.select(
					`
          *,
          default_vendor:default_vendor_id (
            id,
            name,
            line_id
          )
        `
				)
				.order("category")
				.order("name");

			if (error) throw error;
			
			// If we have pending updates, merge them with the fetched data
			const { pendingUpdates } = get();
			const fetchedItems = data || [];
			const mergedItems = fetchedItems.map(item => ({
				...item,
				quantity: pendingUpdates[item.id] !== undefined ? pendingUpdates[item.id] : item.quantity
			}));

			set({ inventoryItems: mergedItems, error: null });
		} catch (error) {
			console.error("Error fetching inventory items:", error);
			showToast.error("Failed to load inventory items");
			set({ error: error.message });
		} finally {
			set({ loading: false });
		}
	},

	// Set up real-time subscription
	subscribeToInventory: () => {
		const subscription = supabase
			.channel("inventory_changes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "inventory_items" },
				(payload) => {
					console.log("Real-time update:", payload);
					// Only refetch if we don't have pending updates to avoid flickering
					// or if the update is from another source.
					const { pendingUpdates } = get();
					if (Object.keys(pendingUpdates).length === 0) {
						get().fetchInventoryItems();
					}
				}
			)
			.subscribe((status, err) => {
				if (err || status === "CHANNEL_ERROR") {
					console.error("Inventory subscription error:", err);
					showToast.error("Real-time updates disconnected. Please refresh.");
				}
			});

		return subscription;
	},

	// Update quantity (Optimistic & Debounced)
	updateQuantity: (id, newQuantity) => {
		// 1. Optimistically update local state
		set((state) => ({
			inventoryItems: state.inventoryItems.map((item) =>
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

	// Actual Background Sync
	syncPendingUpdates: async () => {
		const { pendingUpdates } = get();
		const updateEntries = Object.entries(pendingUpdates);
		
		if (updateEntries.length === 0) return;

		// Snapshot of what we're about to sync
		const snapshot = { ...pendingUpdates };
		
		// Clear pending state immediately to allow new updates to accumulate
		set({ pendingUpdates: {}, syncTimeout: null });

		try {
			// Perform updates in parallel
			const promises = updateEntries.map(([id, quantity]) => 
				supabase
					.from("inventory_items")
					.update({ quantity })
					.eq("id", id)
			);

			const results = await Promise.all(promises);
			const hasError = results.some(r => r.error);
			
			if (hasError) {
				console.error("Some inventory updates failed", results.map(r => r.error).filter(Boolean));
				showToast.error("Some stock updates failed to save. Please refresh.");
				// Optional: restore snapshot to pendingUpdates if we want to retry
			}
		} catch (error) {
			console.error("Error syncing inventory updates:", error);
			showToast.error("Failed to sync inventory updates");
		}
	},

	// Update threshold
	updateThreshold: async (id, newThreshold) => {
		try {
			const { error } = await supabase
				.from("inventory_items")
				.update({ threshold: newThreshold })
				.eq("id", id);

			if (error) throw error;

			set((state) => ({
				inventoryItems: state.inventoryItems.map((item) =>
					item.id === id ? { ...item, threshold: newThreshold } : item
				),
			}));

			showToast.success("Threshold updated");
			return { success: true };
		} catch (error) {
			console.error("Error updating threshold:", error);
			showToast.error("Failed to update threshold");
			return { error: error.message };
		}
	},

	// Fetch vendors for filters
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

	// Filter actions
	setSearchQuery: (query) => set({ searchQuery: query }),

	toggleVendorFilter: (vendorId) => {
		set((state) => {
			const isSelected = state.selectedVendors.includes(vendorId);
			return {
				selectedVendors: isSelected
					? state.selectedVendors.filter((id) => id !== vendorId)
					: [...state.selectedVendors, vendorId],
			};
		});
	},

	setShowRegularOnly: (show) => set({ showRegularOnly: show }),

	// Reset filters
	resetFilters: () =>
		set({
			searchQuery: "",
			selectedVendors: [],
			showRegularOnly: false,
		}),

	// Get all unique categories
	getAllCategories: () => {
		const items = get().inventoryItems;
		return [...new Set(items.map((item) => item.category))].sort();
	},

	// Get all unique vendors with counts
	getVendorsWithCounts: () => {
		const items = get().inventoryItems;
		const vendors = get().vendors;

		return vendors.map((vendor) => ({
			...vendor,
			count: items.filter((item) => item.default_vendor_id === vendor.id)
				.length,
		}));
	},

	// Filtered items
	getFilteredItems: () => {
		const items = get().inventoryItems;
		const { searchQuery, selectedVendors, showRegularOnly } = get();

		return items.filter((item) => {
			// Search filter
			const matchesSearch =
				searchQuery === "" ||
				item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.category?.toLowerCase().includes(searchQuery.toLowerCase());

			// Vendor filter - if no vendors selected, show all
			const matchesVendor =
				selectedVendors.length === 0 ||
				(item.default_vendor_id &&
					selectedVendors.includes(item.default_vendor_id));

			// Regular only filter
			const matchesRegular = !showRegularOnly || item.is_regular === true;

			return matchesSearch && matchesVendor && matchesRegular;
		});
	},

	// Get low stock items (quantity <= threshold)
	getLowStockItems: () => {
		const items = get().inventoryItems;
		return items.filter(
			(item) => item.quantity <= item.threshold && item.threshold > 0
		);
	},

	createInventoryItem: async (itemData) => {
		try {
			const { error } = await supabase
				.from("inventory_items")
				.insert([itemData]);

			if (error) throw error;

			await get().fetchInventoryItems();
			showToast.success("Inventory item created");
			return { success: true };
		} catch (error) {
			console.error("Error creating inventory item:", error);
			showToast.error("Failed to create inventory item");
			return { error: error.message };
		}
	},

	updateInventoryItem: async (id, itemData) => {
		try {
			const { error } = await supabase
				.from("inventory_items")
				.update(itemData)
				.eq("id", id);

			if (error) throw error;

			// Refetch to get updated data with vendor relations
			await get().fetchInventoryItems();
			showToast.success("Inventory item updated");
			return { success: true };
		} catch (error) {
			console.error("Error updating inventory item:", error);
			showToast.error("Failed to update inventory item");
			return { error: error.message };
		}
	},
}));

export default useInventoryStore;
