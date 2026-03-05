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
	activeCategory: "all",
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

	// Fetch vendors for dropdown
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

	// Create inventory item
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

	// Update inventory item
	updateInventoryItem: async (id, itemData) => {
		try {
			const { error } = await supabase
				.from("inventory_items")
				.update(itemData)
				.eq("id", id);

			if (error) throw error;

			await get().fetchInventoryItems();
			return { success: true };
		} catch (error) {
			console.error("Error updating inventory item:", error);
			return { error: error.message };
		}
	},

	// Delete inventory item
	deleteInventoryItem: async (id) => {
		try {
			const { error } = await supabase
				.from("inventory_items")
				.delete()
				.eq("id", id);

			if (error) throw error;

			await get().fetchInventoryItems();
			return { success: true };
		} catch (error) {
			console.error("Error deleting inventory item:", error);
			return { error: error.message };
		}
	},

	// Filter actions
	setSearchQuery: (query) => set({ searchQuery: query }),
	setActiveCategory: (category) => set({ activeCategory: category }),
	setShowRegularOnly: (show) => set({ showRegularOnly: show }),

	// Show only regular items
	showOnlyRegularItems: () => set({ showRegularOnly: true }),

	// Show all items
	showAllItems: () => set({ showRegularOnly: false }),

	// Reset filters
	resetFilters: () =>
		set({
			searchQuery: "",
			activeCategory: "all",
			showRegularOnly: false,
		}),

	// Get all unique categories
	getAllCategories: () => {
		const items = get().inventoryItems;
		return [...new Set(items.map((item) => item.category))].sort();
	},

	// Filtered items - this is a computed property, not a state
	getFilteredItems: () => {
		const items = get().inventoryItems;
		const { searchQuery, activeCategory, showRegularOnly } = get();

		return items.filter((item) => {
			// Search filter - check name and category
			const matchesSearch =
				searchQuery === "" ||
				(item.name &&
					item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
				(item.category &&
					item.category.toLowerCase().includes(searchQuery.toLowerCase()));

			// Category filter
			const matchesCategory =
				activeCategory === "all" || item.category === activeCategory;

			// Regular only filter
			const matchesRegular = !showRegularOnly || item.is_regular === true;

			const matches = matchesSearch && matchesCategory && matchesRegular;

			if (!matches) {
				console.log("Item filtered out:", {
					name: item.name,
					category: item.category,
					is_regular: item.is_regular,
					matchesSearch,
					matchesCategory,
					matchesRegular,
				});
			}

			return matches;
		});
	},
}));

export default useInventoryStore;
