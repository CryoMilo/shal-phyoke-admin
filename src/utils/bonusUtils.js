// src/utils/bonusUtils.js
import { startOfMonth, eachDayOfInterval, format } from "date-fns";
import { processDashboardData } from "./processData";
import { toBangkokDateString } from "./dateUtils";

const getSafeNumber = (value) => parseFloat(value) || 0;

/**
 * Sum absence points for an employee within the current month,
 * excluding Sundays (shop closed, doesn't count against allowance).
 */
export const sumAbsencePoints = (absences = []) => {
	return absences.reduce((total, absence) => {
		const d = new Date(`${absence.absence_date}T12:00:00`);
		if (d.getDay() === 0) return total; // Sunday - free pass
		return total + getSafeNumber(absence.points);
	}, 0);
};

/**
 * Determine penalty percentage based on TOTAL absence points this month.
 *
 * Business rule: only the first `allowedAbsences` point(s) are free with
 * zero deduction. From that point on, the absolute absence point count
 * (not "points beyond the allowance") looks up the penalty tier directly.
 *
 * penaltyTiers shape: { "2": 50, "3": 75, "4": 100 }
 * Keys are the TOTAL absence point count, values are % penalty.
 * e.g. allowedAbsences=1, tiers={2:50,3:75,4:100}:
 *   1 pt  -> 0%   (free)
 *   2 pts -> 50%
 *   3 pts -> 75%
 *   4 pts -> 100%
 *   5+ pts -> 100% (no higher tier defined, stays at the highest one)
 */
export const getPenaltyPercentage = (
	absencePoints,
	allowedAbsences,
	penaltyTiers
) => {
	if (absencePoints <= allowedAbsences) return 0;

	// Sort tier thresholds ascending and take the highest threshold that
	// the employee's absolute point count has reached or passed.
	const tierEntries = Object.entries(penaltyTiers || {})
		.map(([k, v]) => [parseFloat(k), Number(v)])
		.sort((a, b) => a[0] - b[0]);

	let applicablePenalty = 0;
	for (const [threshold, penalty] of tierEntries) {
		if (absencePoints >= threshold) {
			applicablePenalty = penalty;
		}
	}

	return applicablePenalty;
};

/**
 * Reduce a list of per-day dashboard results into running month-to-date totals.
 * Reuses the same field names produced by processDashboardData so downstream
 * consumers don't need to know this is an aggregation.
 */
const accumulateDailyResults = (dailyResults) => {
	return dailyResults.reduce(
		(acc, day) => ({
			totalIncome: acc.totalIncome + day.totalIncome,
			totalDailyExpenses: acc.totalDailyExpenses + day.totalDailyExpenses,
			dailyOverheadCost: acc.dailyOverheadCost + day.dailyOverheadCost,
			totalExpenses: acc.totalExpenses + day.totalExpenses,
			netProfit: acc.netProfit + day.netProfit,
		}),
		{
			totalIncome: 0,
			totalDailyExpenses: 0,
			dailyOverheadCost: 0,
			totalExpenses: 0,
			netProfit: 0,
		}
	);
};

/**
 * Build the list of Bangkok-local calendar dates from the start of the
 * given month up to (and including) "today" — or the full month if the
 * month has already ended.
 */
export const getMonthToDateRange = (referenceDate = new Date()) => {
	const monthStart = startOfMonth(referenceDate);
	const today = new Date();

	// Cap the range at "today" if we're looking at the current month,
	// otherwise the whole month has already happened.
	const isCurrentMonth =
		referenceDate.getFullYear() === today.getFullYear() &&
		referenceDate.getMonth() === today.getMonth();

	const rangeEnd = isCurrentMonth ? today : new Date(referenceDate);

	return eachDayOfInterval({ start: monthStart, end: rangeEnd });
};

/**
 * Fetches and aggregates all data needed to compute one day's netProfit
 * using the exact same fields/shape as the Dashboard page, then runs it
 * through processDashboardData for a single day.
 *
 * fetchDayDataFn must be supplied by the caller (the store), since this
 * util has no Supabase access of its own — keeps it pure & testable.
 */
export const computeMonthToDateProfit = async (fetchDayDataFn, referenceDate = new Date()) => {
	const days = getMonthToDateRange(referenceDate);

	const dailyResults = await Promise.all(
		days.map(async (day) => {
			const dateStr = toBangkokDateString(day);
			const {
				orders,
				aggregatedSales,
				dailyExpenses,
				dailyCash,
				monthlyOverheads,
			} = await fetchDayDataFn(day, dateStr);

			return processDashboardData(
				orders,
				aggregatedSales,
				dailyExpenses,
				dailyCash,
				monthlyOverheads,
				day,
				dateStr
			);
		})
	);

	const totals = accumulateDailyResults(dailyResults);

	return {
		...totals,
		daysCounted: dailyResults.length,
		monthLabel: format(referenceDate, "MMMM yyyy"),
	};
};

/**
 * Calculates each active employee's real-time bonus share for the month.
 *
 * @param {number} monthToDateProfit - accumulated net profit so far this month
 * @param {Array} employees - active employees
 * @param {Object} absencesByEmployee - { [employeeId]: absences[] }
 * @param {Object} config - bonus_config row { pool_percentage, allowed_absences, penalty_tiers }.
 *   allowed_absences = number of FREE absence points before any penalty
 *   (default 1, per business rule: first point is free). penalty_tiers
 *   keys are the TOTAL absence point count, e.g. {2:50, 3:75, 4:100}.
 */
export const calculateEmployeeBonuses = (
	monthToDateProfit,
	employees = [],
	absencesByEmployee = {},
	config
) => {
	const poolPercentage = getSafeNumber(config?.pool_percentage ?? 10);
	const allowedAbsences = getSafeNumber(config?.allowed_absences ?? 1);
	const penaltyTiers = config?.penalty_tiers || { 2: 50, 3: 75, 4: 100 };

	const safeProfit = Math.max(0, monthToDateProfit);
	const totalPool = safeProfit * (poolPercentage / 100);

	const activeCount = employees.length;
	const equalShare = activeCount > 0 ? 100 / activeCount : 0;
	const baseSharePerEmployee = activeCount > 0 ? totalPool / activeCount : 0;

	// First pass: compute each employee's penalty + raw forfeited amount
	const computed = employees.map((employee) => {
		const absences = absencesByEmployee[employee.id] || [];
		const absencePoints = sumAbsencePoints(absences);
		const penaltyPercentage = getPenaltyPercentage(
			absencePoints,
			allowedAbsences,
			penaltyTiers
		);

		const forfeitedAmount = baseSharePerEmployee * (penaltyPercentage / 100);
		const retainedAmount = baseSharePerEmployee - forfeitedAmount;

		return {
			employee,
			sharePercentage: equalShare,
			absencePoints,
			penaltyPercentage,
			baseShareAmount: baseSharePerEmployee,
			forfeitedAmount,
			retainedAmount,
		};
	});

	// Forfeited money is redistributed equally among employees with 0% penalty,
	// "Deducted penalty money goes back into the pool and divided for others."
	const totalForfeited = computed.reduce((sum, c) => sum + c.forfeitedAmount, 0);
	const eligibleForRedistribution = computed.filter(
		(c) => c.penaltyPercentage === 0
	);
	const redistributionShare =
		eligibleForRedistribution.length > 0
			? totalForfeited / eligibleForRedistribution.length
			: 0;

	const final = computed.map((c) => {
		const bonusFromRedistribution =
			c.penaltyPercentage === 0 ? redistributionShare : 0;

		return {
			employeeId: c.employee.id,
			name: c.employee.name,
			position: c.employee.position,
			sharePercentage: c.sharePercentage,
			absencePoints: c.absencePoints,
			penaltyPercentage: c.penaltyPercentage,
			baseShareAmount: c.baseShareAmount,
			estimatedBonus: c.retainedAmount + bonusFromRedistribution,
		};
	});

	return {
		totalPool,
		poolPercentage,
		activeEmployeeCount: activeCount,
		employeeBonuses: final,
	};
};