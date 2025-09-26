// stores/useSubscribersStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

const useSubscribersStore = create(
	persist(
		(set, get) => ({
			subscribers: [],
			loading: false,
			setSubscribers: (subscribers) => set({ subscribers }),
			setLoading: (loading) => set({ loading }),
			addSubscriber: (subscriber) =>
				set((state) => ({ subscribers: [...state.subscribers, subscriber] })),
			updateSubscriber: (id, updatedSubscriber) =>
				set((state) => ({
					subscribers: state.subscribers.map((sub) =>
						sub.id === id ? { ...sub, ...updatedSubscriber } : sub
					),
				})),
			deleteSubscriber: (id) =>
				set((state) => ({
					subscribers: state.subscribers.filter((sub) => sub.id !== id),
				})),
			fetchSubscribers: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("subscribers")
						.select(
							`
							*,
							subscription_plan:subscription_plans(*)
						`
						)
						.order("created_at", { ascending: false });

					if (error) throw error;

					// Transform data to include user info
					const transformedData =
						data?.map((sub) => ({
							...sub,
							user_name:
								sub.auth?.users?.raw_user_meta_data?.full_name ||
								"Unknown User",
							user_email: sub.auth?.users?.email || "No Email",
							plan_name: sub.subscription_plans?.plan_name || "Unknown Plan",
						})) || [];

					set({ subscribers: transformedData, loading: false });
				} catch (error) {
					console.error("Error fetching subscribers:", error);
					set({ loading: false });
				}
			},
			createSubscriber: async (subscriberData) => {
				try {
					const { data, error } = await supabase
						.from("subscribers")
						.insert([subscriberData])
						.select(
							`
              *,
              subscription_plans!inner(plan_name)
            `
						)
						.single();

					if (error) throw error;

					const transformedData = {
						...data,
						plan_name: data.subscription_plans?.plan_name || "Unknown Plan",
					};

					get().addSubscriber(transformedData);
					return { data: transformedData, error: null };
				} catch (error) {
					console.error("Error creating subscriber:", error);
					return { data: null, error };
				}
			},
			updateSubscriberById: async (id, subscriberData) => {
				try {
					const { data, error } = await supabase
						.from("subscribers")
						.update(subscriberData)
						.eq("id", id)
						.select(
							`
              *,
              subscription_plans!inner(plan_name)
            `
						)
						.single();

					if (error) throw error;

					const transformedData = {
						...data,
						plan_name: data.subscription_plans?.plan_name || "Unknown Plan",
					};

					get().updateSubscriber(id, transformedData);
					return { data: transformedData, error: null };
				} catch (error) {
					console.error("Error updating subscriber:", error);
					return { data: null, error };
				}
			},
			deleteSubscriberById: async (id) => {
				try {
					const { error } = await supabase
						.from("subscribers")
						.delete()
						.eq("id", id);

					if (error) throw error;

					get().deleteSubscriber(id);
					return { error: null };
				} catch (error) {
					console.error("Error deleting subscriber:", error);
					return { error };
				}
			},
		}),
		{
			name: "subscribers-store",
			partialize: (state) => ({ subscribers: state.subscribers }),
		}
	)
);

export default useSubscribersStore;
