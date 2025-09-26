import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";

const useSubscriptionPlansStore = create(
	persist(
		(set, get) => ({
			plans: [],
			loading: false,
			setPlans: (plans) => set({ plans }),
			setLoading: (loading) => set({ loading }),
			addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),
			updatePlan: (id, updatedPlan) =>
				set((state) => ({
					plans: state.plans.map((plan) =>
						plan.id === id ? { ...plan, ...updatedPlan } : plan
					),
				})),
			deletePlan: (id) =>
				set((state) => ({
					plans: state.plans.filter((plan) => plan.id !== id),
				})),
			fetchPlans: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("subscription_plans")
						.select("*")
						.order("created_at", { ascending: false });

					if (error) throw error;
					set({ plans: data || [], loading: false });
				} catch (error) {
					console.error("Error fetching plans:", error);
					set({ loading: false });
				}
			},
			createPlan: async (planData) => {
				try {
					const { data, error } = await supabase
						.from("subscription_plans")
						.insert([planData])
						.select()
						.single();

					if (error) throw error;

					get().addPlan(data);
					return { data, error: null };
				} catch (error) {
					console.error("Error creating plan:", error);
					return { data: null, error };
				}
			},
			updatePlanById: async (id, planData) => {
				try {
					const { data, error } = await supabase
						.from("subscription_plans")
						.update(planData)
						.eq("id", id)
						.select()
						.single();

					if (error) throw error;

					get().updatePlan(id, data);
					return { data, error: null };
				} catch (error) {
					console.error("Error updating plan:", error);
					return { data: null, error };
				}
			},
			deletePlanById: async (id) => {
				try {
					const { error } = await supabase
						.from("subscription_plans")
						.delete()
						.eq("id", id);

					if (error) throw error;

					get().deletePlan(id);
					return { error: null };
				} catch (error) {
					console.error("Error deleting plan:", error);
					return { error };
				}
			},
		}),
		{
			name: "subscription-plans-store",
			partialize: (state) => ({ plans: state.plans }),
		}
	)
);

export default useSubscriptionPlansStore;
