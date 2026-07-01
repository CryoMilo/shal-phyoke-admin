import { create } from "zustand";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";
import { toBangkokDateString, getBangkokDayRange } from "../utils/dateUtils";
import {
	computeMonthToDateProfit,
	calculateEmployeeBonuses,
} from "../utils/bonusUtils";
import useStaffAccessStore from "./staffAccessStore";

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

	/**
	 * Fetches one day's worth of raw data (orders, aggregated sales, daily
	 * expenses, daily cash, monthly overheads) in the exact shape that
	 * processDashboardData (utils/processData.js) expects. Mirrors the
	 * fetch logic already used in pages/Dashboard.jsx so figures match
	 * exactly what's shown there.
	 */
	_fetchDayData: async (day, dateStr) => {
		const { start, end } = getBangkokDayRange(day);

		const [
			{ data: orders, error: ordersError },
			{ data: aggregatedSales, error: salesError },
			{ data: dailyExpenses, error: expensesError },
			{ data: dailyCash, error: cashError },
			{ data: monthlyOverheads, error: overheadsError },
		] = await Promise.all([
			supabase
				.from("orders")
				.select(
					"id, created_at, total_amount, delivery_fee, payment_method, order_items"
				)
				.eq("pos_order_status", "completed")
				.eq("payment_status", "paid")
				.gte("created_at", start)
				.lte("created_at", end),
			supabase
				.from("monthly_sales")
				.select(
					`
						menu_item_id,
						menu_item_name_burmese,
						menu_item_name_english,
						menu_item_category,
						menu_item_price,
						quantity_sold,
						total_revenue,
						order_id,
						payment_method
					`
				)
				.eq("sale_date", dateStr),
			supabase
				.from("daily_expenses")
				.select("id, amount, category, paid_by, description, notes")
				.eq("date", dateStr),
			supabase
				.from("daily_cash")
				.select("opening_balance, cash_collected, cash_deposited, notes")
				.eq("date", dateStr)
				.maybeSingle(),
			supabase
				.from("monthly_overheads")
				.select(
					"id, amount, category, description, due_date, paid_date, is_recurring, notes"
				)
				.eq("month", format(startOfMonth(day), "yyyy-MM-dd")),
		]);

		if (ordersError) console.error("Bonus: error fetching orders", ordersError);
		if (salesError) console.error("Bonus: error fetching sales", salesError);
		if (expensesError)
			console.error("Bonus: error fetching daily expenses", expensesError);
		if (cashError) console.error("Bonus: error fetching daily cash", cashError);
		if (overheadsError)
			console.error("Bonus: error fetching overheads", overheadsError);

		return {
			orders: orders || [],
			aggregatedSales: aggregatedSales || [],
			dailyExpenses: dailyExpenses || [],
			dailyCash: dailyCash || {},
			monthlyOverheads: monthlyOverheads || [],
		};
	},

	/**
	/**
	 * Fetch the active bonus_config row covering "referenceDate" (effective_from <= referenceDate
	 * and effective_to is null or >= referenceDate). Falls back to sane defaults if
	 * none has been configured yet.
	 */
	_fetchActiveBonusConfig: async (referenceDate = new Date()) => {
		const targetDateStr = toBangkokDateString(referenceDate);
		try {
			const { data, error } = await supabase
				.from("bonus_config")
				.select("*")
				.lte("effective_from", targetDateStr)
				.or(`effective_to.is.null,effective_to.gte.${targetDateStr}`)
				.order("effective_from", { ascending: false })
				.limit(1)
				.maybeSingle();

			if (error) throw error;

			return (
				data || {
					pool_percentage: 10,
					allowed_absences: 1,
					penalty_tiers: { 2: 50, 3: 75, 4: 100 },
				}
			);
		} catch (error) {
			console.error("Error fetching bonus config, using defaults:", error);
			return {
				pool_percentage: 10,
				allowed_absences: 1,
				penalty_tiers: { 2: 50, 3: 75, 4: 100 },
			};
		}
	},

	/**
	 * Fetch all absences for the current month, grouped by employee_id.
	 */
	_fetchCurrentMonthAbsencesByEmployee: async (referenceDate) => {
		const monthStart = format(startOfMonth(referenceDate), "yyyy-MM-dd");
		const monthEnd = format(endOfMonth(referenceDate), "yyyy-MM-dd");

		const { data, error } = await supabase
			.from("employee_absences")
			.select("employee_id, absence_date, points")
			.gte("absence_date", monthStart)
			.lte("absence_date", monthEnd);

		if (error) {
			console.error("Error fetching absences for bonus calc:", error);
			return {};
		}

		return (data || []).reduce((acc, absence) => {
			if (!acc[absence.employee_id]) acc[absence.employee_id] = [];
			acc[absence.employee_id].push(absence);
			return acc;
		}, {});
	},

	/**
	 * Main entry point: computes the live month-to-date bonus pool and each
	 * active employee's real-time estimated bonus share.
	 */
	fetchBonusTracker: async (referenceDate = new Date()) => {
		set({ loading: true, error: null });
		try {
			const { _fetchDayData, _fetchActiveBonusConfig, _fetchCurrentMonthAbsencesByEmployee } =
				get();

			// 1. Active employees (only those currently active share the pool)
			const { data: employees, error: employeesError } = await supabase
				.from("employees")
				.select("id, name, position, is_active")
				.eq("is_active", true)
				.order("name");

			if (employeesError) throw employeesError;

			// 2. Retrieve openingDays from staffAccessStore
			let openingDays = useStaffAccessStore.getState().openingDays;
			if (!openingDays || openingDays.length === 0) {
				await useStaffAccessStore.getState().fetchPermissions();
				openingDays = useStaffAccessStore.getState().openingDays || [1, 2, 3, 4, 5, 6];
			}

			// 3. Month-to-date accumulated profit, reusing processData.js per day
			const monthToDate = await computeMonthToDateProfit(
				_fetchDayData,
				referenceDate,
				openingDays
			);

			// 4. Bonus configuration (pool %, absence allowance, penalty tiers)
			const config = await _fetchActiveBonusConfig(referenceDate);

			// 5. This month's absences per employee
			const absencesByEmployee = await _fetchCurrentMonthAbsencesByEmployee(
				referenceDate
			);

			// 6. Crunch the numbers
			const { totalPool, poolPercentage, employeeBonuses } =
				calculateEmployeeBonuses(
					monthToDate.netProfit,
					employees || [],
					absencesByEmployee,
					config,
					openingDays
				);

			set({
				totalPool,
				poolPercentage,
				allowedAbsences: config?.allowed_absences ?? 1,
				monthLabel: monthToDate.monthLabel,
				monthToDateProfit: monthToDate.netProfit,
				employeeBonuses,
				lastUpdated: new Date().toISOString(),
				loading: false,
			});
		} catch (error) {
			console.error("Error computing bonus tracker:", error);
			showToast.error("Failed to load bonus tracker");
			set({ loading: false, error: error.message });
		}
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