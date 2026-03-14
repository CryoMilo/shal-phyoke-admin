// src/stores/inventoryStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";

const useInventoryStore = create((set, get) => ({
	// State
	inventoryItems: [],
	vendors: [],
	loading: false,
	error: null,

	// Filter states
	searchQuery: "",
	selectedVendors: [],
	showRegularOnly: false,

	// Fetch all inventory items
	fetchInventoryItems: async () => {
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
			set({ inventoryItems: data || [], error: null });
		} catch (error) {
			console.error("Error fetching inventory items:", error);
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
					get().fetchInventoryItems(); // Refetch on any change
				}
			)
			.subscribe();

		return subscription;
	},

	// Update quantity
	updateQuantity: async (id, newQuantity) => {
		try {
			const { error } = await supabase
				.from("inventory_items")
				.update({ quantity: newQuantity })
				.eq("id", id);

			if (error) throw error;

			// Optimistic update
			set((state) => ({
				inventoryItems: state.inventoryItems.map((item) =>
					item.id === id ? { ...item, quantity: newQuantity } : item
				),
			}));

			return { success: true };
		} catch (error) {
			console.error("Error updating quantity:", error);
			return { error: error.message };
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

			return { success: true };
		} catch (error) {
			console.error("Error updating threshold:", error);
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
			return { success: true };
		} catch (error) {
			console.error("Error creating inventory item:", error);
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
			return { success: true };
		} catch (error) {
			console.error("Error updating inventory item:", error);
			return { error: error.message };
		}
	},
}));

export default useInventoryStore;
