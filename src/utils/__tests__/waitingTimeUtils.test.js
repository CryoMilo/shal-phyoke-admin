import { describe, it, expect } from "vitest";
import {
	isDrinkItem,
	countActiveCookingDishes,
	getEstimatedTimeWindow,
	calculateWaitingTime,
	KITCHEN_ACTIVE_WINDOW_MS,
} from "../waitingTimeUtils";

describe("waitingTimeUtils", () => {
	describe("isDrinkItem", () => {
		it("detects drinks by category", () => {
			expect(isDrinkItem({ category: "Drink", name_english: "Coffee" })).toBe(true);
			expect(isDrinkItem({ category: "Regular_Drinks", name_english: "Tea" })).toBe(true);
		});

		it("detects drinks by english keywords", () => {
			expect(isDrinkItem({ category: "Others", name_english: "Cold Coke Can" })).toBe(true);
			expect(isDrinkItem({ category: "Others", name_english: "Mineral Water 500ml" })).toBe(true);
			expect(isDrinkItem({ category: "Others", name_english: "Chang Beer" })).toBe(true);
		});

		it("identifies hot kitchen food dishes correctly as not drinks", () => {
			expect(isDrinkItem({ category: "Noodles", name_english: "Shan Noodles" })).toBe(false);
			expect(isDrinkItem({ category: "Rice", name_english: "Fried Rice" })).toBe(false);
			expect(isDrinkItem({ category: "Salad", name_english: "Tea Leaf Salad" })).toBe(false);
		});
	});

	describe("countActiveCookingDishes", () => {
		const now = Date.now();

		it("ignores completed or cancelled orders", () => {
			const orders = [
				{
					pos_order_status: "completed",
					created_at: new Date(now - 5000).toISOString(),
					order_items: [{ quantity: 3, name_english: "Fried Rice" }],
				},
				{
					pos_order_status: "cancelled",
					created_at: new Date(now - 5000).toISOString(),
					order_items: [{ quantity: 2, name_english: "Shan Noodles" }],
				},
			];
			expect(countActiveCookingDishes(orders, now)).toBe(0);
		});

		it("ignores orders older than 25 minutes (likely already served)", () => {
			const orders = [
				{
					pos_order_status: "pending",
					created_at: new Date(now - (KITCHEN_ACTIVE_WINDOW_MS + 60000)).toISOString(),
					order_items: [{ quantity: 5, name_english: "Fried Rice" }],
				},
			];
			expect(countActiveCookingDishes(orders, now)).toBe(0);
		});

		it("counts active cooking dishes within 25 minutes while excluding drinks", () => {
			const orders = [
				{
					pos_order_status: "preparing",
					created_at: new Date(now - 10 * 60 * 1000).toISOString(),
					order_items: [
						{ quantity: 2, category: "Noodles", name_english: "Shan Noodles" },
						{ quantity: 3, category: "Drink", name_english: "Coke" },
						{ quantity: 1, category: "Rice", name_english: "Pork Curry Rice" },
					],
				},
				{
					pos_order_status: "pending",
					created_at: new Date(now - 2 * 60 * 1000).toISOString(),
					order_items: [
						{ quantity: 3, category: "Snack", name_english: "Fried Tofu" },
					],
				},
			];
			// 2 noodles + 1 pork rice + 3 fried tofu = 6 dishes (excluding 3 cokes)
			expect(countActiveCookingDishes(orders, now)).toBe(6);
		});
	});

	describe("getEstimatedTimeWindow", () => {
		it("returns 10–15 mins for 0 to 3 dishes", () => {
			expect(getEstimatedTimeWindow(0).timeWindow).toBe("10 – 15 mins");
			expect(getEstimatedTimeWindow(3).timeWindow).toBe("10 – 15 mins");
		});

		it("returns 15–20 mins for 4 to 8 dishes", () => {
			expect(getEstimatedTimeWindow(4).timeWindow).toBe("15 – 20 mins");
			expect(getEstimatedTimeWindow(8).timeWindow).toBe("15 – 20 mins");
		});

		it("returns 20–30 mins for 9 to 14 dishes", () => {
			expect(getEstimatedTimeWindow(9).timeWindow).toBe("20 – 30 mins");
			expect(getEstimatedTimeWindow(14).timeWindow).toBe("20 – 30 mins");
		});

		it("returns 30–40 mins for 15 to 20 dishes", () => {
			expect(getEstimatedTimeWindow(15).timeWindow).toBe("30 – 40 mins");
			expect(getEstimatedTimeWindow(20).timeWindow).toBe("30 – 40 mins");
		});

		it("returns 45–50 mins for 21+ dishes", () => {
			expect(getEstimatedTimeWindow(21).timeWindow).toBe("45 – 50 mins");
			expect(getEstimatedTimeWindow(35).timeWindow).toBe("45 – 50 mins");
		});
	});

	describe("calculateWaitingTime", () => {
		it("computes full payload with dishCount, timeWindow, and rawMinutes", () => {
			const now = Date.now();
			const orders = [
				{
					pos_order_status: "preparing",
					created_at: new Date(now - 5000).toISOString(),
					order_items: [{ quantity: 5, category: "Rice", name_english: "Fried Rice" }],
				},
			];
			const res = calculateWaitingTime(orders, now);
			expect(res.dishCount).toBe(5);
			expect(res.timeWindow).toBe("15 – 20 mins");
			expect(res.status).toBe("normal");
			expect(res.rawMinutes).toBe(16); // 10 + 5 * 1.2 = 16
		});
	});
});
