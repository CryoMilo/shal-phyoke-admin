// /stores/orderCreationStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";
import { useRegularMenuStore } from "./regularMenuStore";

const useOrderCreationStore = create(
	persist(
		(set, get) => ({
			// State
			orders: [],
			loadingOrders: false,
			loading: false,

			// Menu Items
			todayMenuItems: [],
			tomorrowMenuItems: [],

			// Selection State
			selectedSubscriber: null,
			selectedSubscriberPlan: null,
			selectedDay: null,
			selectedMenuItems: [],
			selectedAddOns: [],
			addOnStep: false,

			// Selection Counters
			availableSelections: { main_dish: 0, side_dish: 0, total: 0 },
			usedSelections: { main_dish: 0, side_dish: 0, total: 0 },

			// Time Restrictions
			isAfter10AM: false,

			// ===== SETTERS =====
			setLoading: (loading) => set({ loading }),
			setTodayMenuItems: (items) => set({ todayMenuItems: items }),
			setTomorrowMenuItems: (items) => set({ tomorrowMenuItems: items }),
			setAddOnStep: (show) => set({ addOnStep: show }),

			setSelectedDay: (day) =>
				set({
					selectedDay: day,
					selectedMenuItems: [],
					usedSelections: { main_dish: 0, side_dish: 0, total: 0 },
				}),

			setSelectedSubscriber: (subscriber) => {
				const plan = subscriber.active_plans?.[0];
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

			// ===== ADD-ONS =====
			updateAddOnQuantity: (menuItemId, change) => {
				const state = get();
				const existingIndex = state.selectedAddOns.findIndex(
					(item) => item.id === menuItemId
				);

				if (existingIndex >= 0) {
					const updatedAddOns = [...state.selectedAddOns];
					const newQuantity = updatedAddOns[existingIndex].quantity + change;

					if (newQuantity <= 0) {
						updatedAddOns.splice(existingIndex, 1);
					} else {
						updatedAddOns[existingIndex] = {
							...updatedAddOns[existingIndex],
							quantity: newQuantity,
						};
					}

					set({ selectedAddOns: updatedAddOns });
				} else if (change > 0) {
					const menuItem = state
						.getAvailableAddOnItems()
						.find((item) => item.id === menuItemId);
					if (menuItem) {
						set({
							selectedAddOns: [
								...state.selectedAddOns,
								{ id: menuItemId, quantity: 1, menu_item: menuItem },
							],
						});
					}
				}
			},

			toggleAllAddOnsPaid: (paidStatus) => {
				set((state) => ({
					selectedAddOns: state.selectedAddOns.map((addOn) => ({
						...addOn,
						addons_paid: paidStatus,
					})),
				}));
			},

			getAllAddOnsPaidStatus: () => {
				const state = get();
				if (state.selectedAddOns.length === 0) return false;
				return state.selectedAddOns.every((addOn) => addOn.addons_paid);
			},

			getAvailableAddOnItems: () => {
				const state = get();
				if (!state.selectedDay) return [];

				// Get rotating menu items for selected day
				const rotatingMenuItems = (
					state.selectedDay === "today"
						? state.todayMenuItems
						: state.tomorrowMenuItems
				)
					.map((item) => item.menu_items)
					.filter(Boolean);

				// Get regular menu items
				const regularMenuItems = useRegularMenuStore
					.getState()
					.getAllRegularItems();

				// Combine and remove duplicates
				const allItems = [...rotatingMenuItems, ...regularMenuItems];
				return allItems.filter(
					(item, index, self) =>
						index === self.findIndex((i) => i.id === item.id)
				);
			},

			// ===== MENU ITEM SELECTION =====
			toggleMenuItemSelection: (menuItem) => {
				const s = get();
				const existingItem = s.selectedMenuItems.find(
					(m) => m.id === menuItem.id
				);

				if (existingItem) {
					// Deselect
					set({
						selectedMenuItems: s.selectedMenuItems.filter(
							(m) => m.id !== menuItem.id
						),
						usedSelections: {
							...s.usedSelections,
							[existingItem.type]: s.usedSelections[existingItem.type] - 1,
							total: s.usedSelections.total - 1,
						},
					});
				} else {
					// Add new - check limits
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
				}
			},

			updateMenuItemQuantity: (menuItem, type, change) => {
				const state = get();
				const matchingItems = state.selectedMenuItems.filter(
					(item) => item.id === menuItem.id && item.type === type
				);

				if (change > 0) {
					// Add items
					const newItems = Array(change)
						.fill()
						.map(() => ({ ...menuItem, type }));
					set({
						selectedMenuItems: [...state.selectedMenuItems, ...newItems],
						usedSelections: {
							...state.usedSelections,
							[type]: state.usedSelections[type] + change,
							total: state.usedSelections.total + change,
						},
					});
				} else if (change < 0) {
					// Remove items
					const itemsToRemove = Math.min(
						matchingItems.length,
						Math.abs(change)
					);
					let removed = 0;
					const itemsToKeep = state.selectedMenuItems.filter((item) => {
						const isMatch = item.id === menuItem.id && item.type === type;
						if (isMatch && removed < itemsToRemove) {
							removed++;
							return false;
						}
						return true;
					});

					set({
						selectedMenuItems: itemsToKeep,
						usedSelections: {
							...state.usedSelections,
							[type]: state.usedSelections[type] - itemsToRemove,
							total: state.usedSelections.total - itemsToRemove,
						},
					});
				}
			},

			// ===== ORDER OPERATIONS =====
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

			// ===== ORDER OPERATIONS =====
			async updateOrderStatus(orderId, newStatus) {
				const previousOrders = get().orders; // Store current state for rollback

				try {
					// Optimistically update local state
					set((state) => ({
						orders: state.orders.map((order) =>
							order.id === orderId ? { ...order, status: newStatus } : order
						),
					}));

					// Update in database
					const { error } = await supabase
						.from("subscription_orders")
						.update({ status: newStatus })
						.eq("id", orderId);

					if (error) throw error;

					return { error: null };
				} catch (error) {
					// Revert on error
					set({ orders: previousOrders });
					console.error("Error updating order status:", error);
					throw error;
				}
			},

			async deleteOrder(orderId) {
				const previousOrders = get().orders;

				try {
					// Optimistically remove from local state
					set((state) => ({
						orders: state.orders.filter((order) => order.id !== orderId),
					}));

					const { error } = await supabase
						.from("subscription_orders")
						.delete()
						.eq("id", orderId);

					if (error) throw error;

					return { error: null };
				} catch (error) {
					// Revert on error
					set({ orders: previousOrders });
					console.error("Error deleting order:", error);
					throw error;
				}
			},
			// ===== MENU DATA =====
			async fetchAvailableMenuItems() {
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

					// Get published weekly menu
					const { data: published, error: menuError } = await supabase
						.from("weekly_menu")
						.select("id")
						.eq("status", "Published")
						.single();

					if (menuError || !published)
						throw new Error("No published weekly menu found");

					// Fetch menu items for both days
					const [todayRes, tomorrowRes] = await Promise.all([
						supabase
							.from("weekly_menu_items")
							.select(`id, status, weekday, menu_items (*)`)
							.eq("weekly_menu_id", published.id)
							.eq("weekday", todayName)
							.in("status", ["Cooking", "Confirmed", "Available"]),
						supabase
							.from("weekly_menu_items")
							.select(`id, status, weekday, menu_items (*)`)
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
					console.error("Error fetching menu items:", err);
					set({ todayMenuItems: [], tomorrowMenuItems: [], loading: false });
				}
			},

			// ===== ORDER CREATION =====
			getOrderData: () => {
				const s = get();
				if (
					!s.selectedSubscriber ||
					!s.selectedDay ||
					s.selectedMenuItems.length === 0
				)
					return null;

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
				if (!orderData) throw new Error("Invalid order data");

				try {
					// Create main order
					const { data: order, error } = await supabase
						.from("subscription_orders")
						.insert([orderData])
						.select()
						.single();

					if (error) throw error;

					// Create add-ons if any
					if (s.selectedAddOns.length > 0) {
						const addOnsData = s.selectedAddOns.map((addOn) => ({
							subscription_order_id: order.id,
							menu_item_id: addOn.id,
							quantity: addOn.quantity,
						}));

						const { error: addOnsError } = await supabase
							.from("subscription_order_add_ons")
							.insert(addOnsData);

						if (addOnsError) throw addOnsError;
					}

					await get().fetchSubscriberOrders();
					return { data: order, error: null };
				} catch (error) {
					console.error("Error creating order:", error);
					throw error;
				}
			},

			// ===== VALIDATION & HELPERS =====
			checkTimeRestriction: () => {
				const hour = new Date().getHours();
				set({ isAfter10AM: hour >= 10 });
			},

			// Replace isValidSelection with more comprehensive validation:
			isValidSelection: () => {
				const s = get();

				// Basic requirements
				if (!s.selectedSubscriber || !s.selectedDay) return false;
				if (s.selectedMenuItems.length === 0) return false;

				// Time restriction
				if (s.selectedDay === "today" && s.isAfter10AM) {
					return {
						isValid: false,
						reason: "Cannot create today's orders after 10 AM",
					};
				}

				// Plan validation
				const planDetails = s.selectedSubscriberPlan?.subscription_plans;
				if (
					planDetails?.main_dish_choice > 0 &&
					s.usedSelections.main_dish === 0
				) {
					return {
						isValid: false,
						reason: "Must select at least one main dish for this plan",
					};
				}

				// Check if selections match plan limits exactly
				const mainOk =
					s.usedSelections.main_dish <= s.availableSelections.main_dish;
				const sideOk =
					s.usedSelections.side_dish <= s.availableSelections.side_dish;

				if (!mainOk || !sideOk) {
					return {
						isValid: false,
						reason: "Selection exceeds plan limits",
					};
				}

				return { isValid: true };
			},

			hasMultipleActivePlans: () => {
				const s = get();
				return s.selectedSubscriber?.active_plans?.length > 1;
			},

			getAvailablePlans: () => {
				const s = get();
				return s.selectedSubscriber?.active_plans || [];
			},

			// ===== RESET METHODS =====
			resetAddOns: () => set({ selectedAddOns: [], addOnStep: false }),

			resetSelections: () =>
				set({
					selectedSubscriber: null,
					selectedSubscriberPlan: null,
					selectedDay: null,
					selectedMenuItems: [],
					selectedAddOns: [],
					addOnStep: false,
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
