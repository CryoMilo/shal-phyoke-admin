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
			selectedSubscriberPlan: null, // NEW: Track specific plan
			selectedDay: null,

			// Selection
			selectedMenuItems: [],
			availableSelections: { main_dish: 0, side_dish: 0, total: 0 },
			usedSelections: { main_dish: 0, side_dish: 0, total: 0 },

			loading: false,
			isAfter10AM: false,

			setTodayMenuItems: (items) => set({ todayMenuItems: items }),
			setTomorrowMenuItems: (items) => set({ tomorrowMenuItems: items }),

			// UPDATED: Now accepts both subscriber and specific plan
			setSelectedSubscriber: (subscriber, planId = null) => {
				// If planId is provided, find the specific plan
				let selectedPlan = null;
				if (planId && subscriber.active_plans) {
					selectedPlan = subscriber.active_plans.find(
						(plan) => plan.id === planId
					);
				}

				// Fallback to first active plan if no specific plan selected
				const plan = selectedPlan || subscriber.active_plans?.[0];
				const planDetails = plan?.subscription_plans;

				const main = planDetails?.main_dish_choice || 0;
				const side = planDetails?.side_dish_choice || 0;

				set({
					selectedSubscriber: subscriber,
					selectedSubscriberPlan: plan, // NEW: Store the specific plan
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

			// NEW: Method to select specific plan for a subscriber
			setSelectedSubscriberPlan: (planId) => {
				const state = get();
				if (!state.selectedSubscriber || !state.selectedSubscriber.active_plans)
					return;

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

			setSelectedDay: (day) =>
				set({
					selectedDay: day,
					selectedMenuItems: [],
					usedSelections: { main_dish: 0, side_dish: 0, total: 0 },
				}),

			setLoading: (loading) => set({ loading }),
			checkTimeRestriction: () => {
				const hour = new Date().getHours();
				set({ isAfter10AM: hour >= 10 });
			},

			// UPDATED: Fetch orders with plan information
			async fetchSubscriberOrders() {
				set({ loadingOrders: true });
				try {
					const { data, error } = await supabase
						.from("subscription_orders_with_plans") // Use the view we created
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

			// UPDATED: Fetch orders for a specific subscriber
			async fetchSubscriberOrdersBySubscriberId(subscriberId) {
				set({ loadingOrders: true });
				try {
					const { data, error } = await supabase
						.from("subscription_orders_with_plans")
						.select("*")
						.eq("subscriber_id", subscriberId)
						.order("created_at", { ascending: false });

					if (error) throw error;

					set({ orders: data || [] });
				} catch (err) {
					console.error(
						"fetchSubscriberOrdersBySubscriberId error:",
						err.message
					);
				} finally {
					set({ loadingOrders: false });
				}
			},

			// UPDATED: Fetch orders for a specific subscriber plan
			async fetchSubscriberOrdersByPlanId(planId) {
				set({ loadingOrders: true });
				try {
					const { data, error } = await supabase
						.from("subscription_orders_with_plans")
						.select("*")
						.eq("subscriber_plan_id", planId)
						.order("created_at", { ascending: false });

					if (error) throw error;

					set({ orders: data || [] });
				} catch (err) {
					console.error("fetchSubscriberOrdersByPlanId error:", err.message);
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
						.from("subscription_orders_with_plans") // Use view for detailed info
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
					selectedSubscriberPlan: null,
					selectedDay: null,
					selectedMenuItems: [],
					availableSelections: { main_dish: 0, side_dish: 0, total: 0 },
					usedSelections: { main_dish: 0, side_dish: 0, total: 0 },
				}),

			// UPDATED: Order data now includes subscriber_plan_id
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
					subscriber_plan_id: s.selectedSubscriberPlan?.id, // NEW: Include plan ID
					menu_items: s.selectedMenuItems.map((i) => i.id),
					order_date:
						s.selectedDay === "today"
							? new Date().toISOString().split("T")[0]
							: new Date(Date.now() + 86400000).toISOString().split("T")[0],
					point_use: 1,
					status: "Cooking",
				};
			},

			// UPDATED: Create order with new schema
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

					// Add to local state
					set((state) => ({
						orders: [data, ...state.orders],
					}));

					return { data, error: null };
				} catch (error) {
					console.error("Error creating order:", error);
					throw error;
				}
			},

			isValidSelection: () => {
				const s = get();
				if (!s.selectedSubscriber || !s.selectedDay) return false;
				if (s.selectedMenuItems.length === 0) return false;
				if (s.selectedDay === "today" && s.isAfter10AM) return false;

				// Require at least one main if plan demands it
				const planDetails = s.selectedSubscriberPlan?.subscription_plans;
				if (
					planDetails?.main_dish_choice > 0 &&
					s.usedSelections.main_dish === 0
				)
					return false;
				return true;
			},

			// NEW: Check if subscriber has multiple active plans
			hasMultipleActivePlans: () => {
				const s = get();
				return s.selectedSubscriber?.active_plans?.length > 1;
			},

			// NEW: Get available plans for current subscriber
			getAvailablePlans: () => {
				const s = get();
				return s.selectedSubscriber?.active_plans || [];
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
