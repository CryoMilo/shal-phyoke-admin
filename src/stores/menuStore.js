import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

const useMenuStore = create(
	persist(
		// eslint-disable-next-line no-unused-vars
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
						.from("menu_items")
						.select("*")
						.order("created_at", { ascending: false });

					if (error) throw error;
					set({ menus: data || [], loading: false });
				} catch (error) {
					console.error("Error fetching menus:", error);
					set({ loading: false });
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
