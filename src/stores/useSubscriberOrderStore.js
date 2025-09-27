import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

// Zustand Store for Orders
export const useSubscriberOrdersStore = create(
	persist(
		(set, get) => ({
			orders: [],
			loading: false,
			setOrders: (orders) => set({ orders }),
			setLoading: (loading) => set({ loading }),
			addOrder: (order) =>
				set((state) => ({ orders: [...state.orders, order] })),
			updateOrder: (id, updatedOrder) =>
				set((state) => ({
					orders: state.orders.map((order) =>
						order.id === id ? { ...order, ...updatedOrder } : order
					),
				})),
			deleteOrder: (id) =>
				set((state) => ({
					orders: state.orders.filter((order) => order.id !== id),
				})),

			fetchOrders: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("subscription_orders")
						.select(
							`
              *,
              subscribers (
                id,
                name,
                line_id,
                delivery_address,
                phone_number,
                subscription_plans (
                  plan_name
                )
              )
            `
						)
						.order("created_at", { ascending: false });

					if (error) throw error;
					set({ orders: data || [], loading: false });
				} catch (error) {
					console.error("Error fetching orders:", error);
					set({ loading: false });
				}
			},

			createOrder: async (orderData) => {
				try {
					const { data, error } = await supabase
						.from("subscription_orders")
						.insert([orderData])
						.select(
							`
              *,
              subscribers (
                id,
                name,
                line_id,
                delivery_address,
                phone_number,
                subscription_plans (
                  plan_name
                )
              )
            `
						)
						.single();

					if (error) throw error;

					get().addOrder(data);
					return { data, error: null };
				} catch (error) {
					console.error("Error creating order:", error);
					return { data: null, error };
				}
			},

			updateOrderById: async (id, orderData) => {
				try {
					const { data, error } = await supabase
						.from("subscription_orders")
						.update(orderData)
						.eq("id", id)
						.select(
							`
              *,
              subscribers (
                id,
                name,
                line_id,
                delivery_address,
                phone_number,
                subscription_plans (
                  plan_name
                )
              )
            `
						)
						.single();

					if (error) throw error;

					get().updateOrder(id, data);
					return { data, error: null };
				} catch (error) {
					console.error("Error updating order:", error);
					return { data: null, error };
				}
			},

			deleteOrderById: async (id) => {
				try {
					const { error } = await supabase
						.from("subscription_orders")
						.delete()
						.eq("id", id);

					if (error) throw error;

					get().deleteOrder(id);
					return { error: null };
				} catch (error) {
					console.error("Error deleting order:", error);
					return { error };
				}
			},
		}),
		{
			name: "orders-store",
			partialize: (state) => ({ orders: state.orders }),
		}
	)
);

// Zustand Store for Subscribers (for dropdown)
export const useSubscribersStore = create(() => ({
	subscribers: [],
	menuItems: [],
	loading: false,

	fetchSubscribers: async () => {
		try {
			const { data, error } = await supabase
				.from("subscribers")
				.select(
					`
          id,
          name,
          line_id,
          delivery_address,
          phone_number,
          remaining_points,
          subscription_plans (
            plan_name
          )
        `
				)
				.eq("is_active", true);

			if (error) throw error;
			return data || [];
		} catch (error) {
			console.error("Error fetching subscribers:", error);
			return [];
		}
	},

	fetchMenuItems: async () => {
		try {
			const { data, error } = await supabase
				.from("menu_items")
				.select("id, name_burmese, name_english, price, category")
				.eq("is_active", true);

			if (error) throw error;
			return data || [];
		} catch (error) {
			console.error("Error fetching menu items:", error);
			return [];
		}
	},
}));
