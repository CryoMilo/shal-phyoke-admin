import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

const useMenuStore = create(
	persist(
		(set, get) => ({
			menus: [],
			loading: false,
			searchQuery: "",
			activeCategory: "all",
			showActiveOnly: true,
			filteredMenus: [],

			// Actions
			setMenus: (menus) => set({ menus }),
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

			applyFilters: () => {
				const { menus, searchQuery, activeCategory, showActiveOnly } = get();

				let filtered = menus;

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

				// Apply active status filter
				if (showActiveOnly) {
					filtered = filtered.filter((menu) => menu.is_active);
				}

				set({ filteredMenus: filtered });
			},

			quickFilterRegularItems: () => {
				set({ activeCategory: "Regular" });
				get().applyFilters();
			},

			resetFilters: () => {
				set({
					searchQuery: "",
					activeCategory: "all",
					showActiveOnly: true,
					filteredMenus: get().menus,
				});
			},

			addMenu: (menu) => {
				set((state) => ({
					menus: [...state.menus, menu],
					filteredMenus: [...state.filteredMenus, menu],
				}));
			},

			updateMenu: (id, updatedMenu) => {
				set((state) => {
					const updatedMenus = state.menus.map((menu) =>
						menu.id === id ? { ...menu, ...updatedMenu } : menu
					);

					return {
						menus: updatedMenus,
						filteredMenus: updatedMenus, // Will be re-filtered in applyFilters
					};
				});
				get().applyFilters();
			},

			deleteMenu: (id) => {
				set((state) => ({
					menus: state.menus.filter((menu) => menu.id !== id),
					filteredMenus: state.filteredMenus.filter((menu) => menu.id !== id),
				}));
			},

			fetchMenus: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.order("created_at", { ascending: false });

					if (error) throw error;

					set({
						menus: data || [],
						filteredMenus: data || [],
						loading: false,
					});
				} catch (error) {
					console.error("Error fetching menus:", error);
					set({ loading: false });
				}
			},

			fetchMenuWithId: async (id) => {
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

			toggleMenuStatus: async (id) => {
				try {
					const menu = get().menus.find((m) => m.id === id);
					if (!menu) throw new Error("Menu not found");

					const newStatus = !menu.is_active;
					const { error } = await supabase
						.from("menu_items")
						.update({ is_active: newStatus })
						.eq("id", id);

					if (error) throw error;

					get().updateMenu(id, { is_active: newStatus });
					return { success: true };
				} catch (error) {
					console.error("Error toggling menu status:", error);
					return { success: false, error };
				}
			},
		}),
		{
			name: "menu-store",
			partialize: (state) => ({ menus: state.menus }),
		}
	)
);

export default useMenuStore;
