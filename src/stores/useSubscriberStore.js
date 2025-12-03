// stores/useSubscribersStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

const useSubscribersStore = create(
	persist(
		(set, get) => ({
			subscribers: [],
			loading: false,
			error: null,

			// Basic setters
			setSubscribers: (subscribers) => set({ subscribers }),
			setLoading: (loading) => set({ loading }),
			setError: (error) => set({ error }),

			// Local state mutations
			addSubscriber: (subscriber) =>
				set((state) => ({
					subscribers: [...state.subscribers, subscriber],
				})),

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

			// Update subscriber's plan instances locally
			updateSubscriberPlans: (subscriberId, updatedPlans) =>
				set((state) => ({
					subscribers: state.subscribers.map((sub) =>
						sub.id === subscriberId
							? {
									...sub,
									active_plans: updatedPlans,
									// Update flattened fields for backward compatibility
									plan_name:
										updatedPlans[0]?.subscription_plans?.plan_name ||
										"No Active Plan",
									remaining_points: updatedPlans[0]?.remaining_points || 0,
									serve_type: updatedPlans[0]?.serve_type || null,
							  }
							: sub
					),
				})),

			// Add plan to subscriber locally
			addSubscriberPlan: (subscriberId, newPlan) =>
				set((state) => {
					const updatedSubscribers = state.subscribers.map((sub) => {
						if (sub.id === subscriberId) {
							const updatedPlans = [...(sub.active_plans || []), newPlan];
							return {
								...sub,
								active_plans: updatedPlans,
								plan_name:
									updatedPlans[0]?.subscription_plans?.plan_name ||
									"No Active Plan",
								remaining_points: updatedPlans[0]?.remaining_points || 0,
								serve_type: updatedPlans[0]?.serve_type || null,
							};
						}
						return sub;
					});

					return { subscribers: updatedSubscribers };
				}),

			// Remove plan from subscriber locally
			removeSubscriberPlan: (subscriberId, planId) =>
				set((state) => {
					const updatedSubscribers = state.subscribers.map((sub) => {
						if (sub.id === subscriberId) {
							const updatedPlans =
								sub.active_plans?.filter((plan) => plan.id !== planId) || [];
							return {
								...sub,
								active_plans: updatedPlans,
								plan_name:
									updatedPlans[0]?.subscription_plans?.plan_name ||
									"No Active Plan",
								remaining_points: updatedPlans[0]?.remaining_points || 0,
								serve_type: updatedPlans[0]?.serve_type || null,
							};
						}
						return sub;
					});

					return { subscribers: updatedSubscribers };
				}),

			// Fetch all subscribers with their plans
			fetchSubscribers: async () => {
				set({ loading: true, error: null });
				try {
					const { data, error } = await supabase
						.from("subscribers")
						.select(
							`
              *,
              subscriber_plans (
                id,
                subscription_plan_id,
                serve_type,
                remaining_points,
                subscription_start_date,
                subscription_end_date,
                is_active,
                subscription_plans (
                  id,
                  plan_name,
                  main_dish_choice,
                  side_dish_choice,
                  price,
                  points_included,
                  image_url
                )
              )
            `
						)
						.order("created_at", { ascending: false });

					if (error) throw error;

					// Transform data to include flattened info for easy access
					const transformedData =
						data?.map((sub) => {
							// Get active subscriber plans
							const activePlans =
								sub.subscriber_plans?.filter((sp) => sp.is_active) || [];
							const primaryPlan = activePlans[0]; // Get most recent active plan

							return {
								...sub,
								// Flattened fields for backward compatibility
								plan_name:
									primaryPlan?.subscription_plans?.plan_name ||
									"No Active Plan",
								remaining_points: primaryPlan?.remaining_points || 0,
								serve_type: primaryPlan?.serve_type || null,
								subscription_start_date:
									primaryPlan?.subscription_start_date || null,
								subscription_end_date:
									primaryPlan?.subscription_end_date || null,
								// Keep full plans data for detailed views
								active_plans: activePlans,
								all_plans: sub.subscriber_plans || [],
							};
						}) || [];

					set({ subscribers: transformedData, loading: false });
					return { data: transformedData, error: null };
				} catch (error) {
					console.error("Error fetching subscribers:", error);
					set({ loading: false, error: error.message });
					return { data: null, error };
				}
			},

			// Fetch single subscriber with all details
			fetchSubscriberWithId: async (id) => {
				set({ loading: true, error: null });
				try {
					const { data, error } = await supabase
						.from("subscribers")
						.select(
							`
              *,
              subscriber_plans (
                id,
                subscription_plan_id,
                serve_type,
                remaining_points,
                subscription_start_date,
                subscription_end_date,
                is_active,
                created_at,
                subscription_plans (
                  id,
                  plan_name,
                  main_dish_choice,
                  side_dish_choice,
                  price,
                  points_included,
                  image_url
                )
              )
            `
						)
						.eq("id", id)
						.single();

					if (error) throw error;

					// Transform to include convenience fields
					const activePlans =
						data.subscriber_plans?.filter((sp) => sp.is_active) || [];
					const primaryPlan = activePlans[0];

					const transformedData = {
						...data,
						plan_name:
							primaryPlan?.subscription_plans?.plan_name || "No Active Plan",
						remaining_points: primaryPlan?.remaining_points || 0,
						active_plans: activePlans,
						all_plans: data.subscriber_plans || [],
					};

					// Update local state
					get().updateSubscriber(id, transformedData);
					set({ loading: false });
					return { data: transformedData, error: null };
				} catch (error) {
					console.error("Error fetching subscriber by id:", error);
					set({ loading: false, error: error.message });
					return { data: null, error };
				}
			},

			// Create new subscriber (only subscriber record, not plan)
			createSubscriber: async (subscriberData) => {
				set({ loading: true, error: null });
				try {
					const { data, error } = await supabase
						.from("subscribers")
						.insert([subscriberData])
						.select()
						.single();

					if (error) throw error;

					// Add to local state with empty plans array
					const subscriberWithPlans = {
						...data,
						active_plans: [],
						all_plans: [],
						plan_name: "No Active Plan",
						remaining_points: 0,
						serve_type: null,
					};

					get().addSubscriber(subscriberWithPlans);
					set({ loading: false });
					return { data: subscriberWithPlans, error: null };
				} catch (error) {
					console.error("Error creating subscriber:", error);
					set({ loading: false, error: error.message });
					return { data: null, error };
				}
			},

			// Update subscriber info
			updateSubscriberById: async (id, subscriberData) => {
				set({ loading: true, error: null });
				try {
					const { data, error } = await supabase
						.from("subscribers")
						.update(subscriberData)
						.eq("id", id)
						.select()
						.single();

					if (error) throw error;

					get().updateSubscriber(id, data);
					set({ loading: false });
					return { data, error: null };
				} catch (error) {
					console.error("Error updating subscriber:", error);
					set({ loading: false, error: error.message });
					return { data: null, error };
				}
			},

			// Delete subscriber (cascades to subscriber_plans)
			deleteSubscriberById: async (id) => {
				set({ loading: true, error: null });
				try {
					const { error } = await supabase
						.from("subscribers")
						.delete()
						.eq("id", id);

					if (error) throw error;

					get().deleteSubscriber(id);
					set({ loading: false });
					return { error: null };
				} catch (error) {
					console.error("Error deleting subscriber:", error);
					set({ loading: false, error: error.message });
					return { error };
				}
			},

			// Create subscriber plan (assign plan to subscriber)
			createSubscriberPlan: async (subscriberPlanData) => {
				set({ loading: true, error: null });
				try {
					const { data, error } = await supabase
						.from("subscriber_plans")
						.insert([subscriberPlanData])
						.select(
							`
              *,
              subscription_plans (*)
            `
						)
						.single();

					if (error) throw error;

					// Update local state immediately
					get().addSubscriberPlan(subscriberPlanData.subscriber_id, data);

					set({ loading: false });
					return { data, error: null };
				} catch (error) {
					console.error("Error creating subscriber plan:", error);
					set({ loading: false, error: error.message });
					return { data: null, error };
				}
			},

			// Update subscriber plan (e.g., update points, dates)
			updateSubscriberPlan: async (subscriberPlanId, updates) => {
				set({ loading: true, error: null });
				try {
					const { data, error } = await supabase
						.from("subscriber_plans")
						.update(updates)
						.eq("id", subscriberPlanId)
						.select(
							`
              *,
              subscription_plans (*)
            `
						)
						.single();

					if (error) throw error;

					// Find which subscriber this plan belongs to and update local state
					const state = get();
					const subscriber = state.subscribers.find((sub) =>
						sub.active_plans?.some((plan) => plan.id === subscriberPlanId)
					);

					if (subscriber) {
						const updatedPlans = subscriber.active_plans.map((plan) =>
							plan.id === subscriberPlanId ? data : plan
						);
						state.updateSubscriberPlans(subscriber.id, updatedPlans);
					}

					set({ loading: false });
					return { data, error: null };
				} catch (error) {
					console.error("Error updating subscriber plan:", error);
					set({ loading: false, error: error.message });
					return { data: null, error };
				}
			},

			// Deactivate subscriber plan
			deactivateSubscriberPlan: async (subscriberPlanId) => {
				set({ loading: true, error: null });
				try {
					const { data, error } = await supabase
						.from("subscriber_plans")
						.update({ is_active: false })
						.eq("id", subscriberPlanId)
						.select()
						.single();

					if (error) throw error;

					// Update local state - remove from active plans
					const state = get();
					const subscriber = state.subscribers.find((sub) =>
						sub.active_plans?.some((plan) => plan.id === subscriberPlanId)
					);

					if (subscriber) {
						const updatedPlans = subscriber.active_plans.filter(
							(plan) => plan.id !== subscriberPlanId
						);
						state.updateSubscriberPlans(subscriber.id, updatedPlans);
					}

					set({ loading: false });
					return { data, error: null };
				} catch (error) {
					console.error("Error deactivating subscriber plan:", error);
					set({ loading: false, error: error.message });
					return { data: null, error };
				}
			},

			// Batch update subscriber plans (for modal form submissions)
			batchUpdateSubscriberPlans: async (subscriberId) => {
				set({ loading: true, error: null });
				try {
					// This would handle multiple plan updates in sequence
					// For now, we'll refresh the subscriber data
					const result = await get().fetchSubscriberWithId(subscriberId);

					if (result.error) throw result.error;

					set({ loading: false });
					return { data: result.data, error: null };
				} catch (error) {
					console.error("Error in batch updating subscriber plans:", error);
					set({ loading: false, error: error.message });
					return { data: null, error };
				}
			},

			// Deduct points from subscriber plan
			deductPoints: async (subscriberPlanId, pointsToDeduct) => {
				set({ loading: true, error: null });
				try {
					// First, get current points
					const { data: currentPlan, error: fetchError } = await supabase
						.from("subscriber_plans")
						.select("remaining_points")
						.eq("id", subscriberPlanId)
						.single();

					if (fetchError) throw fetchError;

					const newPoints = Math.max(
						0,
						currentPlan.remaining_points - pointsToDeduct
					);

					// Update points
					const { data, error } = await supabase
						.from("subscriber_plans")
						.update({ remaining_points: newPoints })
						.eq("id", subscriberPlanId)
						.select()
						.single();

					if (error) throw error;

					// Update local state
					const state = get();
					const subscriber = state.subscribers.find((sub) =>
						sub.active_plans?.some((plan) => plan.id === subscriberPlanId)
					);

					if (subscriber) {
						const updatedPlans = subscriber.active_plans.map((plan) =>
							plan.id === subscriberPlanId
								? { ...plan, remaining_points: newPoints }
								: plan
						);
						state.updateSubscriberPlans(subscriber.id, updatedPlans);
					}

					set({ loading: false });
					return { data, error: null };
				} catch (error) {
					console.error("Error deducting points:", error);
					set({ loading: false, error: error.message });
					return { data: null, error };
				}
			},
		}),
		{
			name: "subscribers-store",
			partialize: (state) => ({
				subscribers: state.subscribers,
			}),
		}
	)
);

export default useSubscribersStore;
