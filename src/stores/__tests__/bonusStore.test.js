import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock toastUtils
vi.mock("../../utils/toastUtils", () => ({
	showToast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
	},
}));

// Mock Supabase service before importing store
vi.mock("../../services/supabase", () => ({
	supabase: {
		rpc: vi.fn(),
		from: vi.fn(),
		auth: {
			getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
		},
	},
}));

import { supabase } from "../../services/supabase";
import useBonusStore from "../bonusStore";

describe("bonusStore.js - Manual Reset & Month-End Protection", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		useBonusStore.setState({
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
		});
	});

	it("initializes with default summary and resetInfo", () => {
		const state = useBonusStore.getState();
		expect(state.bonuses).toEqual([]);
		expect(state.summary.totalPool).toBe(0);
		expect(state.summary.isReset).toBe(false);
		expect(state.resetInfo.isReset).toBe(false);
	});

	it("resets bonuses to 0 on resetBonuses() call and persists to settings and localStorage", async () => {
		useBonusStore.setState({
			bonuses: [
				{
					id: "log_1",
					employee: { name: "Aung" },
					total_bonus_pool: 2500,
					base_bonus_amount: 500,
					final_bonus_amount: 500,
					penalty_percentage: 0,
				},
			],
			summary: {
				totalPool: 2500,
				isAtLoss: false,
				isReset: false,
				resetAt: null,
			},
		});

		supabase.from.mockReturnValue({
			upsert: vi.fn().mockResolvedValue({ error: null }),
		});

		const res = await useBonusStore.getState().resetBonuses();
		expect(res.success).toBe(true);

		const updatedState = useBonusStore.getState();
		expect(updatedState.summary.totalPool).toBe(0);
		expect(updatedState.summary.isReset).toBe(true);
		expect(updatedState.summary.resetAt).toBeTruthy();
		expect(updatedState.bonuses[0].final_bonus_amount).toBe(0);
		expect(updatedState.bonuses[0].total_bonus_pool).toBe(0);

		// Verified localStorage persistence
		const rawLocal = localStorage.getItem("bonus_tracker_reset");
		expect(rawLocal).toBeTruthy();
		const parsed = JSON.parse(rawLocal);
		expect(parsed.is_reset).toBe(true);
	});

	it("fetches and displays bonuses for the selected month", async () => {
		supabase.from.mockImplementation((table) => {
			if (table === "app_settings") {
				return {
					select: vi.fn().mockReturnValue({
						eq: vi.fn().mockReturnValue({
							maybeSingle: vi.fn().mockResolvedValue({ data: null }),
						}),
					}),
				};
			}
			if (table === "employee_bonus_log") {
				return {
					select: vi.fn().mockReturnValue({
						eq: vi.fn().mockImplementation((col, val) => ({
							order: vi.fn().mockResolvedValue({
								data: [
									{
										id: `log_${val}_1`,
										employee: { id: "emp_1", name: "Zaw Zaw", position: "Chef" },
										total_bonus_pool: 3200,
										base_bonus_amount: 600,
										final_bonus_amount: 600,
										absence_points: 0,
										penalty_percentage: 0,
									},
								],
							}),
						})),
					}),
				};
			}
			return {
				select: vi.fn().mockReturnThis(),
			};
		});

		supabase.rpc.mockResolvedValue({ error: null });

		await useBonusStore.getState().fetchMonthlyBonuses(new Date("2026-09-30"));

		const state = useBonusStore.getState();
		expect(state.summary.totalPool).toBe(3200);
		expect(state.bonuses.length).toBe(1);
		expect(state.bonuses[0].final_bonus_amount).toBe(600);
	});
});
