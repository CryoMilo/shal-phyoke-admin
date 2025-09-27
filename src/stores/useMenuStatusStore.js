import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

// Zustand Store for Menu Status Management
export const useMenuStatusStore = create(
	persist(
		(set, get) => ({
			todayItems: [],
			tomorrowItems: [],
			loading: false,
			publishedWeeklyMenu: null,
			setTodayItems: (items) => set({ todayItems: items }),
			setTomorrowItems: (items) => set({ tomorrowItems: items }),
			setLoading: (loading) => set({ loading }),
			setPublishedWeeklyMenu: (menu) => set({ publishedWeeklyMenu: menu }),

			fetchMenuStatus: async () => {
				set({ loading: true });
				try {
					// Get the published weekly menu
					const { data: publishedMenu, error: menuError } = await supabase
						.from("weekly_menu")
						.select("*")
						.eq("status", "Published")
						.single();

					if (menuError || !publishedMenu) {
						console.error("No published weekly menu found:", menuError);
						set({ todayItems: [], tomorrowItems: [], loading: false });
						return;
					}

					set({ publishedWeeklyMenu: publishedMenu });

					// Get current and next day
					const today = new Date();
					const tomorrow = new Date(today);
					tomorrow.setDate(tomorrow.getDate() + 1);

					const dayNames = [
						"Sunday",
						"Monday",
						"Tuesday",
						"Wednesday",
						"Thursday",
						"Friday",
						"Saturday",
					];
					const todayName = dayNames[today.getDay()];
					const tomorrowName = dayNames[tomorrow.getDay()];

					// Fetch today's items
					const { data: todayData, error: todayError } = await supabase
						.from("weekly_menu_items")
						.select(
							`
              id,
              status,
              menu_items (
                id,
                name_burmese,
                name_english,
                category,
                price
              )
            `
						)
						.eq("weekly_menu_id", publishedMenu.id)
						.eq("weekday", todayName);

					// Fetch tomorrow's items
					const { data: tomorrowData, error: tomorrowError } = await supabase
						.from("weekly_menu_items")
						.select(
							`
              id,
              status,
              menu_items (
                id,
                name_burmese,
                name_english,
                category,
                price
              )
            `
						)
						.eq("weekly_menu_id", publishedMenu.id)
						.eq("weekday", tomorrowName);

					if (todayError)
						console.error("Error fetching today items:", todayError);
					if (tomorrowError)
						console.error("Error fetching tomorrow items:", tomorrowError);

					set({
						todayItems: todayData || [],
						tomorrowItems: tomorrowData || [],
						loading: false,
					});
				} catch (error) {
					console.error("Error fetching menu status:", error);
					set({ loading: false });
				}
			},

			updateItemStatus: async (weeklyMenuItemId, newStatus) => {
				try {
					const { error } = await supabase
						.from("weekly_menu_items")
						.update({ status: newStatus })
						.eq("id", weeklyMenuItemId);

					if (error) throw error;

					// Update local state
					const updateItemInList = (items) =>
						items.map((item) =>
							item.id === weeklyMenuItemId
								? { ...item, status: newStatus }
								: item
						);

					set((state) => ({
						todayItems: updateItemInList(state.todayItems),
						tomorrowItems: updateItemInList(state.tomorrowItems),
					}));

					return { error: null };
				} catch (error) {
					console.error("Error updating item status:", error);
					return { error };
				}
			},
		}),
		{
			name: "menu-status-store",
			partialize: (state) => ({
				todayItems: state.todayItems,
				tomorrowItems: state.tomorrowItems,
			}),
		}
	)
);
