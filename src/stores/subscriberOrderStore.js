// /stores/orderCreationStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

const useOrderCreationStore = create(
	persist(
		(set, get) => ({
			orders: [],
			loadingOrders: false,

			todayMenuItems: [],
			tomorrowMenuItems: [],
			selectedSubscriber: null,
			selectedSubscriberPlan: null,
			selectedDay: null,

			// Selection
			selectedMenuItems: [], // Stores { id, type } objects
			availableSelections: { main_dish: 0, side_dish: 0, total: 0 },
			usedSelections: { main_dish: 0, side_dish: 0, total: 0 },

			loading: false,
			isAfter10AM: false,

			// Setters
			setTodayMenuItems: (items) => set({ todayMenuItems: items }),
			setTomorrowMenuItems: (items) => set({ tomorrowMenuItems: items }),
			setLoading: (loading) => set({ loading }),
			setSelectedDay: (day) =>
				set({
					selectedDay: day,
					selectedMenuItems: [],
					usedSelections: { main_dish: 0, side_dish: 0, total: 0 },
				}),

			setSelectedSubscriber: (subscriber, planId = null) => {
				let selectedPlan = null;
				if (planId && subscriber.active_plans) {
					selectedPlan = subscriber.active_plans.find(
						(plan) => plan.id === planId
					);
				}

				const plan = selectedPlan || subscriber.active_plans?.[0];
				const planDetails = plan?.subscription_plans;

				const main = planDetails?.main_dish_choice || 0;
				const side = planDetails?.side_dish_choice || 0;

				set({
					selectedSubscriber: subscriber,
					selectedSubscriberPlan: plan,
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

			setSelectedSubscriberPlan: (planId) => {
				const state = get();
				if (!state.selectedSubscriber?.active_plans) return;

				const plan = state.selectedSubscriber.active_plans.find(
					(p) => p.id === planId
				);
				if (!plan) return;

				const planDetails = plan.subscription_plans;
				const main = planDetails?.main_dish_choice || 0;
				const side = planDetails?.side_dish_choice || 0;

				set({
					selectedSubscriberPlan: plan,
					selectedMenuItems: [],
					availableSelections: {
						main_dish: main,
						side_dish: side,
						total: main + side,
					},
					usedSelections: { main_dish: 0, side_dish: 0, total: 0 },
				});
			},

			checkTimeRestriction: () => {
				const hour = new Date().getHours();
				set({ isAfter10AM: hour >= 10 });
			},

			// Order Operations
			async fetchSubscriberOrders() {
				set({ loadingOrders: true });
				try {
					const { data, error } = await supabase
						.from("subscription_orders_with_plans")
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

			async updateOrderStatus(orderId, newStatus) {
				try {
					const { error } = await supabase
						.from("subscription_orders")
						.update({ status: newStatus })
						.eq("id", orderId);

					if (error) throw error;

					// Refetch to get updated data with menu details
					await get().fetchSubscriberOrders();
					return { error: null };
				} catch (error) {
					console.error("Error updating order status:", error);
					throw error;
				}
			},

			async deleteOrder(orderId) {
				try {
					const { error } = await supabase
						.from("subscription_orders")
						.delete()
						.eq("id", orderId);

					if (error) throw error;

					set((state) => ({
						orders: state.orders.filter((order) => order.id !== orderId),
					}));

					return { error: null };
				} catch (error) {
					console.error("Error deleting order:", error);
					throw error;
				}
			},

			// Menu Item Selection
			toggleMenuItemSelection: (menuItem) => {
				const s = get();
				const already = s.selectedMenuItems.find((m) => m.id === menuItem.id);

				if (already) {
					// Deselect
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

				// Add new
				if (s.usedSelections.total >= s.availableSelections.total) return;

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

			// Menu Data
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

			// Order Creation
			getOrderData: () => {
				const s = get();
				if (
					!s.selectedSubscriber ||
					!s.selectedDay ||
					s.selectedMenuItems.length === 0
				)
					return null;

				// Separate main and side dishes for structured data
				const mainDishes = s.selectedMenuItems
					.filter((item) => item.type === "main_dish")
					.map((item) => item.id);

				const sideDishes = s.selectedMenuItems
					.filter((item) => item.type === "side_dish")
					.map((item) => item.id);

				return {
					subscriber_id: s.selectedSubscriber.id,
					subscriber_plan_id: s.selectedSubscriberPlan?.id,
					menu_items_structured: {
						main_dish: mainDishes,
						side_dish: sideDishes,
					},
					order_date:
						s.selectedDay === "today"
							? new Date().toISOString().split("T")[0]
							: new Date(Date.now() + 86400000).toISOString().split("T")[0],
					point_use: 1,
					status: "Cooking",
				};
			},

			async createOrder() {
				const s = get();
				const orderData = s.getOrderData();

				if (!orderData) {
					throw new Error("Invalid order data");
				}

				try {
					const { data, error } = await supabase
						.from("subscription_orders")
						.insert([orderData])
						.select()
						.single();

					if (error) throw error;

					// Add to local state and refetch to get complete data with menu details
					set((state) => ({
						orders: [data, ...state.orders],
					}));

					// Refetch to get the complete order data with menu details from the view
					await get().fetchSubscriberOrders();

					return { data, error: null };
				} catch (error) {
					console.error("Error creating order:", error);
					throw error;
				}
			},

			// Validation & Helpers
			isValidSelection: () => {
				const s = get();
				if (!s.selectedSubscriber || !s.selectedDay) return false;
				if (s.selectedMenuItems.length === 0) return false;
				if (s.selectedDay === "today" && s.isAfter10AM) return false;

				const planDetails = s.selectedSubscriberPlan?.subscription_plans;
				if (
					planDetails?.main_dish_choice > 0 &&
					s.usedSelections.main_dish === 0
				)
					return false;
				return true;
			},

			hasMultipleActivePlans: () => {
				const s = get();
				return s.selectedSubscriber?.active_plans?.length > 1;
			},

			getAvailablePlans: () => {
				const s = get();
				return s.selectedSubscriber?.active_plans || [];
			},

			resetSelections: () =>
				set({
					selectedSubscriber: null,
					selectedSubscriberPlan: null,
					selectedDay: null,
					selectedMenuItems: [],
					availableSelections: { main_dish: 0, side_dish: 0, total: 0 },
					usedSelections: { main_dish: 0, side_dish: 0, total: 0 },
				}),
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
