import { describe, it, expect } from "vitest";
import {
	calculateDailyOverheadCost,
	processSalesData,
	processDailyExpenses,
	processMonthlyOverheads,
	processCashData,
	processDashboardData,
} from "../processData";

describe("processData.js - Financial Calculations", () => {
	describe("calculateDailyOverheadCost", () => {
		it("returns 0 for empty overheads array", () => {
			const cost = calculateDailyOverheadCost([], new Date("2026-05-15"));
			expect(cost).toBe(0);
		});

		it("returns 0 for a closed day (e.g. Sunday when openingDays excludes 0)", () => {
			// May 10, 2026 is a Sunday (day 0)
			const sunday = new Date("2026-05-10T12:00:00Z");
			expect(sunday.getDay()).toBe(0);

			const overheads = [{ amount: 26000, category: "rent" }];
			const cost = calculateDailyOverheadCost(overheads, sunday, [1, 2, 3, 4, 5, 6]);
			expect(cost).toBe(0);
		});

		it("correctly prorates monthly overhead over the number of open days in the month", () => {
			// May 2026 has 31 days.
			// Sundays in May 2026: May 3, 10, 17, 24, 31 (5 Sundays).
			// Open days excluding Sunday: 31 - 5 = 26 open days.
			// Monday May 11, 2026 is an open day.
			const monday = new Date("2026-05-11T12:00:00Z");
			const overheads = [
				{ amount: 26000, category: "rent" },
				{ amount: 5200, category: "utilities" },
			];
			// Total overheads = 31200. Open days = 26. Daily = 31200 / 26 = 1200.
			const cost = calculateDailyOverheadCost(overheads, monday, [1, 2, 3, 4, 5, 6]);
			expect(cost).toBe(1200);
		});
	});

	describe("processSalesData", () => {
		it("deducts delivery fee from gross revenue and separates completed from cancelled/refunded", () => {
			const orders = [
				{
					id: "ord-1",
					pos_order_status: "completed",
					total_amount: 500,
					delivery_fee: 50,
					payment_method: "cash",
					order_items: [{ id: "item-1" }, { id: "item-2" }],
				},
				{
					id: "ord-2",
					pos_order_status: "completed",
					total_amount: 300,
					delivery_fee: 0,
					payment_method: "qr",
					order_items: [{ id: "item-3" }],
				},
				{
					id: "ord-3",
					pos_order_status: "cancelled",
					total_amount: 400,
					delivery_fee: 0,
				},
				{
					id: "ord-4",
					pos_order_status: "refunded",
					total_amount: 150,
					delivery_fee: 0,
				},
			];

			const result = processSalesData(orders, [], "2026-05-11");

			// Completed order 1 income: 500 - 50 = 450
			// Completed order 2 income: 300 - 0 = 300
			// Total income: 750
			expect(result.totalIncome).toBe(750);
			expect(result.totalDeliveryFees).toBe(50);
			expect(result.totalOrders).toBe(2);
			expect(result.totalItems).toBe(3);
			expect(result.cashSales).toBe(450);
			expect(result.qrSales).toBe(300);
			expect(result.avgOrderValue).toBe(375); // 750 / 2

			// Inactive / Cancelled / Refunded stats
			expect(result.cancelledCount).toBe(1);
			expect(result.cancelledAmount).toBe(400);
			expect(result.refundedCount).toBe(1);
			expect(result.refundedAmount).toBe(150);
		});
	});

	describe("processDailyExpenses", () => {
		it("categorizes expenses and aggregates payment sources", () => {
			const dailyExpenses = [
				{ amount: 120, category: "food", paid_by: "cash_drawer" },
				{ amount: 80, category: "drinks", paid_by: "cash_drawer" },
				{ amount: 200, category: "food", paid_by: "bank" },
			];

			const result = processDailyExpenses(dailyExpenses);

			expect(result.totalDailyExpenses).toBe(400);
			expect(result.dailyExpenseByCategory.food).toBe(320);
			expect(result.dailyExpenseByCategory.drinks).toBe(80);
			expect(result.expenseByPaidBy.cash_drawer).toBe(200);
			expect(result.expenseByPaidBy.bank).toBe(200);
		});
	});

	describe("processMonthlyOverheads", () => {
		it("categorizes overheads and tracks paid vs pending amounts", () => {
			const monthlyOverheads = [
				{ amount: 15000, category: "rent", paid_date: "2026-05-01" },
				{ amount: 3000, category: "utilities", paid_date: null },
			];
			const monday = new Date("2026-05-11T12:00:00Z");

			const result = processMonthlyOverheads(monthlyOverheads, monday, [1, 2, 3, 4, 5, 6]);

			expect(result.totalMonthlyOverheads).toBe(18000);
			expect(result.paidOverheads).toBe(15000);
			expect(result.pendingOverheads).toBe(3000);
			expect(result.monthlyOverheadByCategory.rent).toBe(15000);
			expect(result.monthlyOverheadByCategory.utilities).toBe(3000);
		});
	});

	describe("processCashData", () => {
		it("calculates cash variance and expected cash properly", () => {
			const dailyCash = {
				opening_balance: 1000,
				cash_collected: 2450,
				cash_deposited: 2000,
			};
			const cashSales = 1500;

			const result = processCashData(dailyCash, cashSales);

			// Expected = 1000 + 1500 = 2500
			// Variance = 2450 - 2500 = -50 (shortage of 50)
			expect(result.expectedCash).toBe(2500);
			expect(result.cashVariance).toBe(-50);
			expect(result.dailyCash.cash_shortage).toBe(450);
		});
	});

	describe("processDashboardData", () => {
		it("accurately calculates net profit and profit margins", () => {
			const orders = [
				{
					id: "ord-1",
					pos_order_status: "completed",
					total_amount: 2000,
					delivery_fee: 0,
					payment_method: "cash",
					order_items: [{ id: "i1" }],
				},
			];
			const dailyExpenses = [{ amount: 500, category: "food" }];
			const monthlyOverheads = [{ amount: 26000, category: "rent" }]; // 1000/day on open days
			const dailyCash = { opening_balance: 500, cash_collected: 2500 };
			const monday = new Date("2026-05-11T12:00:00Z");

			const result = processDashboardData(
				orders,
				[],
				dailyExpenses,
				dailyCash,
				monthlyOverheads,
				monday,
				"2026-05-11",
				[1, 2, 3, 4, 5, 6]
			);

			// Income: 2000
			// Daily Expenses: 500
			// Daily Overhead: 1000
			// Total Expenses: 1500
			// Net Profit: 2000 - 1500 = 500
			expect(result.totalIncome).toBe(2000);
			expect(result.totalDailyExpenses).toBe(500);
			expect(result.dailyOverheadCost).toBe(1000);
			expect(result.totalExpenses).toBe(1500);
			expect(result.netProfit).toBe(500);
			expect(result.profitMargin).toBe(25); // (500 / 2000) * 100
			expect(result.dailyProfit).toBe(1500); // 2000 - 500
		});
	});
});
