import { create } from "zustand";
import { format, startOfMonth } from "date-fns";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const useBonusStore = create((set, get) => ({
	loading: false,
	error: null,

	bonuses: [],
	summary: {
		totalPool: 0,
		isAtLoss: false,
	},
	loading: false,
	error: null,

	fetchMonthlyBonuses: async (selectedDate = new Date()) => {
		set({ loading: true, error: null });

		const bonusMonth = format(startOfMonth(selectedDate), "yyyy-MM-dd");

		try {
			// Step 1: Trigger the server-side RPC to compute MTD and upsert into employee_bonus_log
			const { error: rpcError } = await supabase.rpc("calculate_monthly_employee_bonuses", {
				p_bonus_month: bonusMonth,
			});

			if (rpcError) throw rpcError;

			// Step 2: Fetch the persistent records from employee_bonus_log joined with employee details
			const { data: logs, error: fetchError } = await supabase
				.from("employee_bonus_log")
				.select(`
					*,
					employee:employees (
						id,
						name,
						position,
						is_active
					)
				`)
				.eq("bonus_month", bonusMonth)
				.order("created_at", { ascending: true });

			if (fetchError) throw fetchError;

			// Extract summary data from the first row (or default to 0)
			const totalPool = logs && logs.length > 0 ? Number(logs[0].total_bonus_pool) : 0;

			set({
				bonuses: logs || [],
				summary: {
					totalPool,
					isAtLoss: totalPool === 0,
				},
				loading: false,
			});
		} catch (err) {
			console.error("Error fetching monthly bonuses:", err);
			showToast.error("Failed to load bonus tracker: " + err.message);
			set({ error: err.message || "Failed to calculate bonuses", loading: false });
		}
	},

	// Keep fetchBonusTracker wrapper for compatibility
	fetchBonusTracker: async (referenceDate = new Date()) => {
		await get().fetchMonthlyBonuses(referenceDate);
	},

	bonusConfigs: [],
	fetchBonusConfigs: async () => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("bonus_config")
				.select("*")
				.order("effective_from", { ascending: false });

			if (error) throw error;
			set({ bonusConfigs: data || [], loading: false });
		} catch (error) {
			console.error("Error fetching bonus configs:", error);
			showToast.error("Failed to load bonus configurations");
			set({ loading: false });
		}
	},
	addBonusConfig: async (configData) => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("bonus_config")
				.insert([configData])
				.select()
				.single();

			if (error) throw error;

			set((state) => ({
				bonusConfigs: [data, ...state.bonusConfigs],
				loading: false,
			}));
			showToast.success("Bonus configuration added");
			return { success: true, data };
		} catch (error) {
			console.error("Error adding bonus config:", error);
			showToast.error(error.message || "Failed to add bonus configuration");
			set({ loading: false });
			return { success: false, error };
		}
	},
	updateBonusConfig: async (id, updates) => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("bonus_config")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;

			set((state) => ({
				bonusConfigs: state.bonusConfigs.map((c) => (c.id === id ? data : c)),
				loading: false,
			}));
			showToast.success("Bonus configuration updated");
			return { success: true, data };
		} catch (error) {
			console.error("Error updating bonus config:", error);
			showToast.error(error.message || "Failed to update bonus configuration");
			set({ loading: false });
			return { success: false, error };
		}
	},
	deleteBonusConfig: async (id) => {
		set({ loading: true });
		try {
			const { error } = await supabase
				.from("bonus_config")
				.delete()
				.eq("id", id);

			if (error) throw error;

			set((state) => ({
				bonusConfigs: state.bonusConfigs.filter((c) => c.id !== id),
				loading: false,
			}));
			showToast.success("Bonus configuration removed");
			return { success: true };
		} catch (error) {
			console.error("Error deleting bonus config:", error);
			showToast.error("Failed to delete bonus configuration");
			set({ loading: false });
			return { success: false, error };
		}
	},
}));

export default useBonusStore;