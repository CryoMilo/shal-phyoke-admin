// /stores/orderCreationStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

const useOrderCreationStore = create(
	persist(
		(set, get) => ({
			orders: [], // holds fetched orders
			loadingOrders: false,

			todayMenuItems: [],
			tomorrowMenuItems: [],
			selectedSubscriber: null,
			selectedDay: null,

			// Selection
			selectedMenuItems: [],
			availableSelections: { main_dish: 0, side_dish: 0, total: 0 },
			usedSelections: { main_dish: 0, side_dish: 0, total: 0 },

			loading: false,
			isAfter6PM: false,

			setTodayMenuItems: (items) => set({ todayMenuItems: items }),
			setTomorrowMenuItems: (items) => set({ tomorrowMenuItems: items }),

			setSelectedSubscriber: (subscriber) => {
				const main = subscriber?.subscription_plans?.main_dish_choice || 0;
				const side = subscriber?.subscription_plans?.side_dish_choice || 0;
				set({
					selectedSubscriber: subscriber,
					selectedDay: null,
					selectedMenuItems: [],
					availableSelections: {
						main_dish: main,
						side_dish: side,
						total: main + side,
					},
					usedSelections: { main_dish: 0, side_dish: 0, total: 0 },
				});
			},

			setSelectedDay: (day) =>
				set({
					selectedDay: day,
					selectedMenuItems: [],
					usedSelections: { main_dish: 0, side_dish: 0, total: 0 },
				}),

			setLoading: (loading) => set({ loading }),
			checkTimeRestriction: () => {
				const hour = new Date().getHours();
				set({ isAfter6PM: hour >= 18 });
			},

			// Fetch all subscription orders
			async fetchSubscriberOrders() {
				set({ loadingOrders: true });
				try {
					const { data, error } = await supabase
						.from("subscription_orders")
						.select("*")
						.order("created_at", { ascending: false });

					if (error) throw error;

					set({ orders: data || [] });
				} catch (err) {
					console.error("fetchSubscriberOrders error:", err.message);
				} finally {
					set({ loadingOrders: false });
				}
			},

			// Update order status
			async updateOrderStatus(orderId, newStatus) {
				try {
					const { error } = await supabase
						.from("subscription_orders")
						.update({ status: newStatus })
						.eq("id", orderId);

					if (error) throw error;

					// Update local state
					set((state) => ({
						orders: state.orders.map((order) =>
							order.id === orderId ? { ...order, status: newStatus } : order
						),
					}));

					return { error: null };
				} catch (error) {
					console.error("Error updating order status:", error);
					throw error;
				}
			},

			// Delete order
			async deleteOrder(orderId) {
				try {
					const { error } = await supabase
						.from("subscription_orders")
						.delete()
						.eq("id", orderId);

					if (error) throw error;

					// Update local state
					set((state) => ({
						orders: state.orders.filter((order) => order.id !== orderId),
					}));

					return { error: null };
				} catch (error) {
					console.error("Error deleting order:", error);
					throw error;
				}
			},

			// Update order (for edit functionality)
			async updateOrder(orderId, orderData) {
				try {
					const { data, error } = await supabase
						.from("subscription_orders")
						.update(orderData)
						.eq("id", orderId)
						.select()
						.single();

					if (error) throw error;

					// Update local state
					set((state) => ({
						orders: state.orders.map((order) =>
							order.id === orderId ? { ...order, ...data } : order
						),
					}));

					return { data, error: null };
				} catch (error) {
					console.error("Error updating order:", error);
					throw error;
				}
			},

			// Get single order by ID
			async getOrderById(orderId) {
				try {
					const { data, error } = await supabase
						.from("subscription_orders")
						.select("*")
						.eq("id", orderId)
						.single();

					if (error) throw error;
					return { data, error: null };
				} catch (error) {
					console.error("Error fetching order:", error);
					return { data: null, error };
				}
			},

			/**
			 * Toggle selection:
			 * 1st click -> Main (if any slot)
			 * 2nd click -> Side (if any slot)
			 * deselect -> free slot
			 */
			toggleMenuItemSelection: (menuItem) => {
				const s = get();
				const already = s.selectedMenuItems.find((m) => m.id === menuItem.id);

				if (already) {
					// --- Deselect ---
					set({
						selectedMenuItems: s.selectedMenuItems.filter(
							(m) => m.id !== menuItem.id
						),
						usedSelections: {
							...s.usedSelections,
							[already.type]: s.usedSelections[already.type] - 1,
							total: s.usedSelections.total - 1,
						},
					});
					return;
				}

				// --- Add new ---
				if (s.usedSelections.total >= s.availableSelections.total) return;

				// Decide tag: main first, then side
				let type = "side_dish";
				if (
					s.usedSelections.main_dish < s.availableSelections.main_dish &&
					(s.usedSelections.main_dish <= s.usedSelections.side_dish ||
						s.availableSelections.side_dish === 0)
				) {
					type = "main_dish";
				} else if (
					s.usedSelections.side_dish < s.availableSelections.side_dish
				) {
					type = "side_dish";
				} else {
					// no slot
					return;
				}

				set({
					selectedMenuItems: [...s.selectedMenuItems, { ...menuItem, type }],
					usedSelections: {
						...s.usedSelections,
						[type]: s.usedSelections[type] + 1,
						total: s.usedSelections.total + 1,
					},
				});
			},

			canSelectMenuItem: (menuItem) => {
				const s = get();
				const isSelected = s.selectedMenuItems.some(
					(m) => m.id === menuItem.id
				);
				return (
					isSelected || s.usedSelections.total < s.availableSelections.total
				);
			},

			fetchAvailableMenuItems: async () => {
				set({ loading: true });
				try {
					const today = new Date();
					const tomorrow = new Date(today);
					tomorrow.setDate(tomorrow.getDate() + 1);
					const days = [
						"Sunday",
						"Monday",
						"Tuesday",
						"Wednesday",
						"Thursday",
						"Friday",
						"Saturday",
					];
					const todayName = days[today.getDay()];
					const tomorrowName = days[tomorrow.getDay()];

					const { data: published, error } = await supabase
						.from("weekly_menu")
						.select("id")
						.eq("status", "Published")
						.single();
					if (error || !published) throw error || new Error("No menu");

					const [todayRes, tomorrowRes] = await Promise.all([
						supabase
							.from("weekly_menu_items")
							.select(
								"id,status,menu_items(id,name_burmese,name_english,category,price,class)"
							)
							.eq("weekly_menu_id", published.id)
							.eq("weekday", todayName)
							.in("status", ["Cooking", "Confirmed", "Available"]),
						supabase
							.from("weekly_menu_items")
							.select(
								"id,status,menu_items(id,name_burmese,name_english,category,price,class)"
							)
							.eq("weekly_menu_id", published.id)
							.eq("weekday", tomorrowName)
							.in("status", ["Cooking", "Confirmed", "Available"]),
					]);

					set({
						todayMenuItems: todayRes.data || [],
						tomorrowMenuItems: tomorrowRes.data || [],
						loading: false,
					});
				} catch (err) {
					console.error(err);
					set({ loading: false });
				}
			},

			resetSelections: () =>
				set({
					selectedSubscriber: null,
					selectedDay: null,
					selectedMenuItems: [],
					availableSelections: { main_dish: 0, side_dish: 0, total: 0 },
					usedSelections: { main_dish: 0, side_dish: 0, total: 0 },
				}),

			getOrderData: () => {
				const s = get();
				if (
					!s.selectedSubscriber ||
					!s.selectedDay ||
					s.selectedMenuItems.length === 0
				)
					return null;
				return {
					subscriber_id: s.selectedSubscriber.id,
					menu_items: s.selectedMenuItems.map((i) => i.id),
					order_date:
						s.selectedDay === "today"
							? new Date().toISOString().split("T")[0]
							: new Date(Date.now() + 86400000).toISOString().split("T")[0],
					point_use: 1,
					status: "Cooking",
				};
			},

			isValidSelection: () => {
				const s = get();
				if (!s.selectedSubscriber || !s.selectedDay) return false;
				if (s.selectedMenuItems.length === 0) return false;
				if (s.selectedDay === "today" && s.isAfter6PM) return false;
				// Require at least one main if plan demands it
				const plan = s.selectedSubscriber.subscription_plans;
				if (plan.main_dish_choice > 0 && s.usedSelections.main_dish === 0)
					return false;
				return true;
			},
		}),
		{
			name: "order-creation-store",
			partialize: (state) => ({
				todayMenuItems: state.todayMenuItems,
				tomorrowMenuItems: state.tomorrowMenuItems,
			}),
		}
	)
);

export { useOrderCreationStore };
