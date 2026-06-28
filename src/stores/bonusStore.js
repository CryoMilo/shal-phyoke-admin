import { create } from "zustand";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";
import { toBangkokDateString, getBangkokDayRange } from "../utils/dateUtils";
import {
	computeMonthToDateProfit,
	calculateEmployeeBonuses,
} from "../utils/bonusUtils";

const useBonusStore = create((set, get) => ({
	loading: false,
	error: null,

	// Live tracker results
	totalPool: 0,
	poolPercentage: 10,
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
	 * Fetch the active bonus_config row covering "now" (effective_from <= today
	 * and effective_to is null or >= today). Falls back to sane defaults if
	 * none has been configured yet.
	 */
	_fetchActiveBonusConfig: async () => {
		const todayStr = toBangkokDateString(new Date());
		try {
			const { data, error } = await supabase
				.from("bonus_config")
				.select("*")
				.lte("effective_from", todayStr)
				.or(`effective_to.is.null,effective_to.gte.${todayStr}`)
				.order("effective_from", { ascending: false })
				.limit(1)
				.maybeSingle();

			if (error) throw error;

			return (
				data || {
					pool_percentage: 10,
					allowed_absences: 4,
					penalty_tiers: { 2: 50, 3: 75, 4: 100 },
				}
			);
		} catch (error) {
			console.error("Error fetching bonus config, using defaults:", error);
			return {
				pool_percentage: 10,
				allowed_absences: 4,
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

			// 2. Month-to-date accumulated profit, reusing processData.js per day
			const monthToDate = await computeMonthToDateProfit(
				_fetchDayData,
				referenceDate
			);

			// 3. Bonus configuration (pool %, absence allowance, penalty tiers)
			const config = await _fetchActiveBonusConfig();

			// 4. This month's absences per employee
			const absencesByEmployee = await _fetchCurrentMonthAbsencesByEmployee(
				referenceDate
			);

			// 5. Crunch the numbers
			const { totalPool, poolPercentage, employeeBonuses } =
				calculateEmployeeBonuses(
					monthToDate.netProfit,
					employees || [],
					absencesByEmployee,
					config
				);

			set({
				totalPool,
				poolPercentage,
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
}));

export default useBonusStore;