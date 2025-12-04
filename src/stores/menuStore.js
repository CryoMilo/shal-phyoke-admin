// stores/menuStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

const useMenuStore = create(
	persist(
		(set, get) => ({
			// State
			allMenuItems: [],
			loading: false,
			searchQuery: "",
			activeCategory: "all",
			showActiveOnly: true,
			filteredMenus: [],
			showRegularOnly: false, // New filter for regular vs rotating

			// ===== SETTERS =====
			setAllMenuItems: (items) => set({ allMenuItems: items }),
			setLoading: (loading) => set({ loading }),

			setSearchQuery: (query) => {
				set({ searchQuery: query });
				get().applyFilters();
			},

			setActiveCategory: (category) => {
				set({ activeCategory: category });
				get().applyFilters();
			},

			setShowActiveOnly: (showActiveOnly) => {
				set({ showActiveOnly });
				get().applyFilters();
			},

			setShowRegularOnly: (showRegularOnly) => {
				set({ showRegularOnly });
				get().applyFilters();
			},

			// ===== FILTERS =====
			applyFilters: () => {
				const {
					allMenuItems,
					searchQuery,
					activeCategory,
					showActiveOnly,
					showRegularOnly,
				} = get();

				let filtered = allMenuItems;

				// Apply search filter
				if (searchQuery.trim()) {
					const query = searchQuery.toLowerCase();
					filtered = filtered.filter(
						(menu) =>
							menu.name_english?.toLowerCase().includes(query) ||
							menu.name_burmese?.toLowerCase().includes(query) ||
							menu.name_thai?.toLowerCase().includes(query) ||
							menu.description?.toLowerCase().includes(query)
					);
				}

				// Apply category filter
				if (activeCategory !== "all") {
					filtered = filtered.filter(
						(menu) => menu.category === activeCategory
					);
				}

				// Apply regular/rotating filter
				if (showRegularOnly) {
					filtered = filtered.filter((menu) => menu.is_regular);
				}

				// Apply active status filter
				if (showActiveOnly) {
					filtered = filtered.filter((menu) => menu.is_active);
				}

				set({ filteredMenus: filtered });
			},

			// Quick filter helpers
			showOnlyRegularItems: () => {
				set({
					showRegularOnly: true,
					activeCategory: "all",
				});
				get().applyFilters();
			},

			showOnlyRotatingItems: () => {
				set({
					showRegularOnly: false,
					activeCategory: "all",
				});
				get().applyFilters();
			},

			resetFilters: () => {
				set({
					searchQuery: "",
					activeCategory: "all",
					showActiveOnly: true,
					showRegularOnly: false,
					filteredMenus: get().allMenuItems,
				});
			},

			// ===== GETTERS =====
			getAllRegularItems: () => {
				const state = get();
				return state.allMenuItems.filter(
					(item) => item.is_regular && item.is_active
				);
			},

			getAllRotatingItems: () => {
				const state = get();
				return state.allMenuItems.filter(
					(item) => !item.is_regular && item.is_active
				);
			},

			getItemsByCategory: (category) => {
				const state = get();
				return state.allMenuItems.filter(
					(item) => item.category === category && item.is_active
				);
			},

			getRegularItemsByCategory: (category) => {
				const state = get();
				return state.allMenuItems.filter(
					(item) =>
						item.is_regular && item.category === category && item.is_active
				);
			},

			getRotatingItemsByCategory: (category) => {
				const state = get();
				return state.allMenuItems.filter(
					(item) =>
						!item.is_regular && item.category === category && item.is_active
				);
			},

			// Get unique categories (with type info)
			getAllCategories: () => {
				const state = get();
				const categories = [
					...new Set(state.allMenuItems.map((item) => item.category)),
				];
				return categories.sort();
			},

			getRegularCategories: () => {
				const state = get();
				const categories = [
					...new Set(
						state.allMenuItems
							.filter((item) => item.is_regular)
							.map((item) => item.category)
					),
				];
				return categories.sort();
			},

			getRotatingCategories: () => {
				const state = get();
				const categories = [
					...new Set(
						state.allMenuItems
							.filter((item) => !item.is_regular)
							.map((item) => item.category)
					),
				];
				return categories.sort();
			},

			// ===== CRUD OPERATIONS =====
			addMenuItem: (menu) => {
				set((state) => ({
					allMenuItems: [...state.allMenuItems, menu],
					filteredMenus: [...state.filteredMenus, menu],
				}));
			},

			updateMenuItem: (id, updatedMenu) => {
				set((state) => {
					const updatedMenus = state.allMenuItems.map((menu) =>
						menu.id === id ? { ...menu, ...updatedMenu } : menu
					);

					return {
						allMenuItems: updatedMenus,
						filteredMenus: updatedMenus,
					};
				});
				get().applyFilters();
			},

			deleteMenuItem: (id) => {
				set((state) => ({
					allMenuItems: state.allMenuItems.filter((menu) => menu.id !== id),
					filteredMenus: state.filteredMenus.filter((menu) => menu.id !== id),
				}));
			},

			// ===== DATABASE OPERATIONS =====
			fetchAllMenuItems: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.order("is_regular", { ascending: false }) // Regular items first
						.order("category")
						.order("name_burmese");

					if (error) throw error;

					set({
						allMenuItems: data || [],
						filteredMenus: data || [],
						loading: false,
					});
				} catch (error) {
					console.error("Error fetching menus:", error);
					set({ loading: false });
				}
			},

			fetchRegularMenuItems: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.eq("is_regular", true)
						.order("category")
						.order("name_burmese");

					if (error) throw error;

					set({
						allMenuItems: data || [],
						filteredMenus: data || [],
						loading: false,
					});
				} catch (error) {
					console.error("Error fetching regular menus:", error);
					set({ loading: false });
				}
			},

			fetchRotatingMenuItems: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.eq("is_regular", false)
						.order("category")
						.order("name_burmese");

					if (error) throw error;

					set({
						allMenuItems: data || [],
						filteredMenus: data || [],
						loading: false,
					});
				} catch (error) {
					console.error("Error fetching rotating menus:", error);
					set({ loading: false });
				}
			},

			fetchMenuItemById: async (id) => {
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.eq("id", id)
						.single();

					if (error) throw error;
					return { data, error: null };
				} catch (error) {
					console.error("Error fetching menu by id:", error);
					return { data: null, error };
				}
			},

			createMenuItem: async (menuData) => {
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.insert([menuData])
						.select()
						.single();

					if (error) throw error;

					get().addMenuItem(data);
					return { data, error: null };
				} catch (error) {
					console.error("Error creating menu:", error);
					return { data: null, error };
				}
			},

			updateMenuItemById: async (id, menuData) => {
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.update(menuData)
						.eq("id", id)
						.select()
						.single();

					if (error) throw error;

					get().updateMenuItem(id, data);
					return { data, error: null };
				} catch (error) {
					console.error("Error updating menu:", error);
					return { data: null, error };
				}
			},

			deleteMenuItemById: async (id) => {
				try {
					const { error } = await supabase
						.from("menu_items")
						.delete()
						.eq("id", id);

					if (error) throw error;

					get().deleteMenuItem(id);
					return { error: null };
				} catch (error) {
					console.error("Error deleting menu:", error);
					return { error };
				}
			},

			toggleMenuStatus: async (id) => {
				try {
					const menu = get().allMenuItems.find((m) => m.id === id);
					if (!menu) throw new Error("Menu not found");

					const newStatus = !menu.is_active;
					const { error } = await supabase
						.from("menu_items")
						.update({ is_active: newStatus })
						.eq("id", id);

					if (error) throw error;

					get().updateMenuItem(id, { is_active: newStatus });
					return { success: true };
				} catch (error) {
					console.error("Error toggling menu status:", error);
					return { success: false, error };
				}
			},

			// For compatibility with existing code
			getMenusByCategory: (category) => {
				return get().getItemsByCategory(category);
			},

			fetchMenus: async () => {
				return get().fetchAllMenuItems();
			},

			fetchMenusByCategory: async (category) => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.eq("category", category)
						.order("name_burmese");

					if (error) throw error;

					// Update state with these items
					const state = get();
					const otherItems = state.allMenuItems.filter(
						(item) => item.category !== category
					);
					set({
						allMenuItems: [...otherItems, ...(data || [])],
						loading: false,
					});

					return { data, error: null };
				} catch (error) {
					console.error(`Error fetching ${category} menus:`, error);
					set({ loading: false });
					return { data: null, error };
				}
			},
		}),
		{
			name: "menu-store",
			partialize: (state) => ({
				allMenuItems: state.allMenuItems,
				// Don't persist filter states
			}),
		}
	)
);

export default useMenuStore;
