import { create } from "zustand";
import { format, startOfMonth } from "date-fns";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const useBonusStore = create((set, get) => ({
	loading: false,
	error: null,

	// Live tracker results
	totalPool: 0,
	poolPercentage: 10,
	allowedAbsences: 1,
	monthLabel: "",
	monthToDateProfit: 0,
	employeeBonuses: [], // [{ employeeId, name, position, absencePoints, penaltyPercentage, estimatedBonus, ... }]
	lastUpdated: null,

	// New MTD states
	bonuses: [],
	summary: { totalPool: 0, MTDProfit: 0, isAtLoss: false, configSnapshot: null },

	fetchMonthlyBonuses: async (selectedDate = new Date()) => {
		set({ loading: true, error: null });
		try {
			const bonusMonth = format(startOfMonth(selectedDate), "yyyy-MM-01");

			// Step 1: Trigger server-side recalculation
			const { error: rpcError } = await supabase.rpc("calculate_monthly_employee_bonuses", {
				p_bonus_month: bonusMonth,
			});
			if (rpcError) throw rpcError;

			// Step 2: Fetch stable records from log
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

			const totalPool = logs && logs.length > 0 ? parseFloat(logs[0].total_bonus_pool) : 0;
			const configSnapshot = logs && logs.length > 0 ? logs[0].config_snapshot : null;
			const poolPercentage = configSnapshot?.pool_percentage || 10;
			const MTDProfit = poolPercentage > 0 ? (totalPool * 100) / poolPercentage : 0;
			const isAtLoss = totalPool === 0;

			const summary = {
				totalPool,
				MTDProfit,
				isAtLoss,
				configSnapshot,
			};

			// Map logs to legacy employeeBonuses format for compatibility
			const legacyEmployeeBonuses = (logs || []).map((log) => ({
				employeeId: log.employee_id,
				name: log.employee?.name || "Unknown",
				position: log.employee?.position || "",
				absencePoints: log.absence_points,
				penaltyPercentage: log.penalty_percentage,
				baseShareAmount: log.base_bonus_amount,
				estimatedBonus: log.final_bonus_amount,
			}));

			set({
				bonuses: logs || [],
				summary,
				totalPool,
				monthToDateProfit: MTDProfit,
				monthLabel: format(selectedDate, "MMMM yyyy"),
				employeeBonuses: legacyEmployeeBonuses,
				poolPercentage,
				allowedAbsences: configSnapshot?.allowed_absences ?? 1,
				lastUpdated: new Date().toISOString(),
				loading: false,
				error: null,
			});
		} catch (error) {
			console.error("Error fetching monthly bonuses:", error);
			showToast.error("Failed to load bonus tracker: " + error.message);
			set({ loading: false, error: error.message });
		}
	},

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