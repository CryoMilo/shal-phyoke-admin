import { create } from "zustand";
import { format, startOfMonth } from "date-fns";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const RESET_STORAGE_KEY = "bonus_tracker_reset";

const getLocalResetInfo = () => {
	try {
		const raw = localStorage.getItem(RESET_STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch (e) {
		console.warn("Failed to parse local reset info:", e);
		return null;
	}
};

const setLocalResetInfo = (info) => {
	try {
		localStorage.setItem(RESET_STORAGE_KEY, JSON.stringify(info));
	} catch (e) {
		console.warn("Failed to save local reset info:", e);
	}
};

const useBonusStore = create((set) => ({
	loading: false,
	resetting: false,
	error: null,

	bonuses: [],
	summary: {
		totalPool: 0,
		isAtLoss: false,
		isReset: false,
		resetAt: null,
	},
	resetInfo: {
		isReset: false,
		resetAt: null,
	},

	fetchMonthlyBonuses: async (selectedDate = new Date()) => {
		set({ loading: true, error: null });

		// 1. Check reset status from app_settings with local fallback
		let resetInfo = getLocalResetInfo();
		try {
			const { data: settingData } = await supabase
				.from("app_settings")
				.select("value")
				.eq("key", "bonus_tracker_reset")
				.maybeSingle();

			if (settingData?.value) {
				resetInfo = settingData.value;
				setLocalResetInfo(resetInfo);
			}
		} catch (e) {
			console.warn("Could not fetch bonus_tracker_reset from app_settings:", e);
		}

		// If manual reset occurred and no new orders have come in after reset_at, maintain reset state (฿0)
		if (resetInfo?.is_reset && resetInfo?.last_reset_at) {
			try {
				const { count, error: countErr } = await supabase
					.from("orders")
					.select("id", { count: "exact", head: true })
					.eq("pos_order_status", "completed")
					.eq("payment_status", "paid")
					.gt("created_at", resetInfo.last_reset_at);

				if (!countErr && (count === 0 || count === null)) {
					// No completed orders since manual reset: show 0 pool and active employees at 0
					const { data: employees } = await supabase
						.from("employees")
						.select("id, name, position, is_active")
						.eq("is_active", true)
						.order("name", { ascending: true });

					const emptyLogs = (employees || []).map((emp) => ({
						id: `reset_${emp.id}`,
						employee_id: emp.id,
						employee: emp,
						total_bonus_pool: 0,
						base_bonus_amount: 0,
						absence_points: 0,
						penalty_percentage: 0,
						final_bonus_amount: 0,
					}));

					set({
						bonuses: emptyLogs,
						summary: {
							totalPool: 0,
							isAtLoss: false,
							isReset: true,
							resetAt: resetInfo.last_reset_at,
						},
						resetInfo: {
							isReset: true,
							resetAt: resetInfo.last_reset_at,
						},
						loading: false,
					});
					return;
				}
			} catch (e) {
				console.warn("Error checking orders since reset:", e);
			}
		}

		// 2. Compute bonuses for target month
		const targetMonthStr = format(startOfMonth(selectedDate), "yyyy-MM-dd");

		try {
			// Trigger server-side RPC to compute MTD and upsert into employee_bonus_log
			const { error: rpcError } = await supabase.rpc("calculate_monthly_employee_bonuses", {
				p_bonus_month: targetMonthStr,
			});

			if (rpcError) throw rpcError;

			let { data: logs, error: fetchError } = await supabase
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
				.eq("bonus_month", targetMonthStr)
				.order("created_at", { ascending: true });

			if (fetchError) throw fetchError;

			let totalPool = logs && logs.length > 0 ? Number(logs[0].total_bonus_pool) : 0;

			// If still no logs (e.g. fresh database), fetch active employees so cards still render
			if (!logs || logs.length === 0) {
				const { data: employees } = await supabase
					.from("employees")
					.select("id, name, position, is_active")
					.eq("is_active", true)
					.order("name", { ascending: true });

				logs = (employees || []).map((emp) => ({
					id: `emp_${emp.id}`,
					employee_id: emp.id,
					employee: emp,
					total_bonus_pool: 0,
					base_bonus_amount: 0,
					absence_points: 0,
					penalty_percentage: 0,
					final_bonus_amount: 0,
				}));
			}

			set({
				bonuses: logs || [],
				summary: {
					totalPool,
					isAtLoss: totalPool === 0,
					isReset: false,
					resetAt: null,
				},
				resetInfo: {
					isReset: false,
					resetAt: null,
				},
				loading: false,
			});
		} catch (err) {
			console.error("Error fetching monthly bonuses:", err);
			showToast.error("Failed to load bonus tracker: " + err.message);
			set({ error: err.message || "Failed to calculate bonuses", loading: false });
		}
	},

	resetBonuses: async () => {
		set({ resetting: true });
		const nowIso = new Date().toISOString();

		const resetData = {
			is_reset: true,
			last_reset_at: nowIso,
		};

		// 1. Save to app_settings with error handling
		try {
			const { data: authData } = await supabase.auth.getUser();
			if (authData?.user?.id) {
				resetData.reset_by = authData.user.id;
			}

			const { error } = await supabase.from("app_settings").upsert(
				{
					key: "bonus_tracker_reset",
					value: resetData,
					updated_at: nowIso,
				},
				{ onConflict: "key" }
			);

			if (error) {
				console.warn("Could not save reset to app_settings:", error);
			}
		} catch (e) {
			console.warn("Failed saving bonus reset to database:", e);
		}

		// 2. Save to localStorage
		setLocalResetInfo(resetData);

		// 3. Update store state immediately
		set((state) => {
			let resetBonusesList = state.bonuses.map((log) => ({
				...log,
				total_bonus_pool: 0,
				base_bonus_amount: 0,
				penalty_percentage: 0,
				final_bonus_amount: 0,
			}));

			return {
				bonuses: resetBonusesList,
				summary: {
					totalPool: 0,
					isAtLoss: false,
					isReset: true,
					resetAt: nowIso,
				},
				resetInfo: {
					isReset: true,
					resetAt: nowIso,
				},
				resetting: false,
			};
		});

		showToast.success("Bonuses have been reset to ฿0.00");
		return { success: true };
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