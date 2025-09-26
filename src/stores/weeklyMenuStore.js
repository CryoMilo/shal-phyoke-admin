import { create } from "zustand";
import { supabase } from "../services/supabase";
import { persist } from "zustand/middleware";

export const useWeeklyMenuStore = create(
	persist(
		(set, get) => ({
			weeklyMenus: [],
			weeklyMenusLoading: false,
			currentWeeklyMenu: null,
			currentWeeklyMenuLoading: false,

			fetchWeeklyMenus: async () => {
				set({ weeklyMenusLoading: true });
				try {
					const { data, error } = await supabase
						.from("weekly_menu")
						.select("*")
						.order("week_from", { ascending: false });
					if (error) throw error;
					set({ weeklyMenus: data || [] });
				} catch (e) {
					console.error("Error fetching weekly menus:", e);
				} finally {
					set({ weeklyMenusLoading: false });
				}
			},

			fetchWeeklyMenuWithItems: async (id) => {
				set({ currentWeeklyMenuLoading: true });
				try {
					const { data, error } = await supabase
						.from("weekly_menu")
						.select(
							`
							*,
							weekly_menu_items (
								id,
								weekday,
								menu_item_id,
								menu_items (
									id,
									name_burmese,
									name_english,
									name_thai,
									price,
									class,
									category,
									image_url
								)
							)
						`
						)
						.eq("id", id)
						.single();
					if (error) throw error;
					set({ currentWeeklyMenu: data });
					return { data };
				} catch (e) {
					console.error("Error fetching weekly menu with items:", e);
					return { data: null, error: e };
				} finally {
					set({ currentWeeklyMenuLoading: false });
				}
			},
		}),
		{
			name: "weekly-menu-store",
			partialize: (s) => ({ weeklyMenus: s.weeklyMenus }),
		}
	)
);

export const useMenuItemsStore = create(
	persist(
		(set) => ({
			menuItems: [],
			loading: false,
			setMenuItems: (items) => set({ menuItems: items }),
			setLoading: (loading) => set({ loading }),

			fetchMenuItems: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.eq("is_active", true)
						.order("name_english");

					if (error) throw error;
					set({ menuItems: data || [], loading: false });
				} catch (error) {
					console.error("Error fetching menu items:", error);
					set({ loading: false });
				}
			},
		}),
		{
			name: "menu-items-store",
			partialize: (state) => ({ menuItems: state.menuItems }),
		}
	)
);
