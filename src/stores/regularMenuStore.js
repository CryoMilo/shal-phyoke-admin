import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

export const useRegularMenuStore = create(
	persist(
		(set, get) => ({
			menus: [],
			loading: false,
			setMenus: (menus) => set({ menus }),
			setLoading: (loading) => set({ loading }),
			addMenu: (menu) => set((state) => ({ menus: [...state.menus, menu] })),
			updateMenu: (id, updatedMenu) =>
				set((state) => ({
					menus: state.menus.map((menu) =>
						menu.id === id ? { ...menu, ...updatedMenu } : menu
					),
				})),
			deleteMenu: (id) =>
				set((state) => ({
					menus: state.menus.filter((menu) => menu.id !== id),
				})),

			// Get menus by specific category
			getMenusByCategory: (category) => {
				const state = get();
				return state.menus.filter((menu) => menu.category === category);
			},

			// Get all regular items (all three categories)
			getAllRegularItems: () => {
				const state = get();
				return state.menus.filter(
					(menu) =>
						menu.category === "Regular" ||
						menu.category === "Regular_Extras" ||
						menu.category === "Regular_Drinks"
				);
			},

			fetchMenus: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.in("category", ["Regular", "Regular_Extras", "Regular_Drinks"])
						.order("category", { ascending: true })
						.order("name_english", { ascending: true });

					if (error) throw error;
					set({ menus: data || [], loading: false });
				} catch (error) {
					console.error("Error fetching menus:", error);
					set({ loading: false });
				}
			},

			// Fetch by specific category
			fetchMenusByCategory: async (category) => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.eq("category", category)
						.order("name_english", { ascending: true });

					if (error) throw error;

					// Update only the specific category items in state
					const state = get();
					const otherMenus = state.menus.filter(
						(menu) => menu.category !== category
					);
					set({
						menus: [...otherMenus, ...(data || [])],
						loading: false,
					});

					return { data, error: null };
				} catch (error) {
					console.error(`Error fetching ${category} menus:`, error);
					set({ loading: false });
					return { data: null, error };
				}
			},

			createMenu: async (menuData) => {
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.insert([menuData])
						.select()
						.single();

					if (error) throw error;

					get().addMenu(data);
					return { data, error: null };
				} catch (error) {
					console.error("Error creating menu:", error);
					return { data: null, error };
				}
			},

			updateMenuById: async (id, menuData) => {
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.update(menuData)
						.eq("id", id)
						.select()
						.single();

					if (error) throw error;

					get().updateMenu(id, data);
					return { data, error: null };
				} catch (error) {
					console.error("Error updating menu:", error);
					return { data: null, error };
				}
			},

			deleteMenuById: async (id) => {
				try {
					const { error } = await supabase
						.from("menu_items")
						.delete()
						.eq("id", id);

					if (error) throw error;

					get().deleteMenu(id);
					return { error: null };
				} catch (error) {
					console.error("Error deleting menu:", error);
					return { error };
				}
			},

			// Toggle menu status (active/inactive)
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

			// Bulk operations
			bulkUpdateMenus: async (updates) => {
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.upsert(updates)
						.select();

					if (error) throw error;

					// Update local state
					const state = get();
					const updatedMenus = state.menus.map((menu) => {
						const update = updates.find((u) => u.id === menu.id);
						return update ? { ...menu, ...update } : menu;
					});

					// Add new menus that weren't in local state
					const newMenus = updates.filter(
						(update) => !state.menus.some((menu) => menu.id === update.id)
					);

					set({ menus: [...updatedMenus, ...newMenus] });
					return { data, error: null };
				} catch (error) {
					console.error("Error bulk updating menus:", error);
					return { data: null, error };
				}
			},
		}),
		{
			name: "regular-menu-store",
			partialize: (state) => ({ menus: state.menus }),
		}
	)
);
