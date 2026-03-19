import { create } from "zustand";
import { supabase } from "../services/supabase";
import { persist } from "zustand/middleware";
import { showToast } from "../utils/toastUtils";

export const useWeeklyMenuStore = create(
	persist(
		// eslint-disable-next-line no-unused-vars
		(set, get) => ({
			weeklyMenus: [],
			weeklyMenusLoading: false,
			currentWeeklyMenu: null,
			currentWeeklyMenuLoading: false,

			// ✅ New: fetch latest created weekly menu
			fetchLatestWeeklyMenu: async () => {
				try {
					const { data, error } = await supabase
						.from("weekly_menu")
						.select("*")
						.order("created_at", { ascending: false }) // newest first
						.limit(1)
						.maybeSingle();

					if (error) throw error;
					set({ currentWeeklyMenu: data });
					return { data };
				} catch (e) {
					console.error("Error fetching latest weekly menu:", e);
					showToast.error("Failed to load latest weekly menu");
					return { data: null, error: e };
				}
			},

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
					showToast.error("Failed to load weekly menus");
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
					showToast.error("Failed to load weekly menu items");
					return { data: null, error: e };
				} finally {
					set({ currentWeeklyMenuLoading: false });
				}
			},

			fetchWeeklyMenuStatus: async (id) => {
				try {
					const { data, error } = await supabase
						.from("weekly_menu")
						.select("status")
						.eq("id", id)
						.single();
					if (error) throw error;

					// Update in-memory currentWeeklyMenu if it matches
					set((state) => ({
						currentWeeklyMenu:
							state.currentWeeklyMenu?.id === id
								? { ...state.currentWeeklyMenu, status: data.status }
								: state.currentWeeklyMenu,
					}));

					return data.status;
				} catch (e) {
					console.error("Error fetching weekly menu status:", e);
					showToast.error("Failed to load weekly menu status");
					return null;
				}
			},

			updateWeeklyMenuStatus: async (id, status) => {
				try {
					const { error } = await supabase
						.from("weekly_menu")
						.update({ status })
						.eq("id", id);
					if (error) throw error;
					
					set((state) => ({
						weeklyMenus: state.weeklyMenus.map((m) =>
							m.id === id ? { ...m, status } : m
						),
					}));
					showToast.success(`Menu status updated to ${status}`);
				} catch (e) {
					console.error("Error updating weekly menu status:", e);
					showToast.error("Failed to update weekly menu status");
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
					showToast.error("Failed to load menu items for builder");
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
