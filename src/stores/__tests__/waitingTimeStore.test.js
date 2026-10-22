import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Supabase service before importing store
vi.mock("../../services/supabase", () => ({
	supabase: {
		from: vi.fn(),
		channel: vi.fn().mockReturnValue({
			on: vi.fn().mockReturnThis(),
			subscribe: vi.fn().mockReturnThis(),
		}),
		removeChannel: vi.fn(),
	},
}));

import { supabase } from "../../services/supabase";
import useWaitingTimeStore from "../waitingTimeStore";

describe("waitingTimeStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useWaitingTimeStore.setState({
			dishCount: 0,
			timeWindow: "10 – 15 mins",
			status: "quick",
			loading: false,
			lastUpdated: null,
		});
	});

	it("initializes with default wait time", () => {
		const state = useWaitingTimeStore.getState();
		expect(state.timeWindow).toBe("10 – 15 mins");
		expect(state.dishCount).toBe(0);
	});

	it("successfully fetches active orders and computes waiting time window", async () => {
		const now = Date.now();
		const mockOrders = [
			{
				id: "ord-1",
				pos_order_status: "preparing",
				created_at: new Date(now - 3000).toISOString(),
				order_items: [
					{ quantity: 2, category: "Noodles", name_english: "Shan Noodles" },
					{ quantity: 3, category: "Rice", name_english: "Fried Rice" },
				],
			},
		];

		const mockGte = vi.fn().mockResolvedValue({ data: mockOrders, error: null });
		const mockIn = vi.fn().mockReturnValue({ gte: mockGte });
		const mockSelect = vi.fn().mockReturnValue({ in: mockIn });

		supabase.from.mockReturnValue({
			select: mockSelect,
		});

		const res = await useWaitingTimeStore.getState().fetchWaitingTime();

		expect(res.dishCount).toBe(5);
		expect(res.timeWindow).toBe("15 – 20 mins");
		expect(res.status).toBe("normal");

		const state = useWaitingTimeStore.getState();
		expect(state.dishCount).toBe(5);
		expect(state.timeWindow).toBe("15 – 20 mins");
		expect(state.loading).toBe(false);
	});
});
