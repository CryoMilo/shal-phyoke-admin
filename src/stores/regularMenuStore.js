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

			fetchMenus: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("regular_menu_items")
						.select("*")
						.order("created_at", { ascending: false });

					if (error) throw error;
					set({ menus: data || [], loading: false });
				} catch (error) {
					console.error("Error fetching menus:", error);
					set({ loading: false });
				}
			},

			createMenu: async (menuData) => {
				try {
					const { data, error } = await supabase
						.from("regular_menu_items")
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
						.from("regular_menu_items")
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
						.from("regular_menu_items")
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
		}),
		{
			name: "regular-menu-store",
			partialize: (state) => ({ menus: state.menus }),
		}
	)
);
