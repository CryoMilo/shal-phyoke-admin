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
		from: vi.fn(),
	},
}));

import { supabase } from "../../services/supabase";
import useDeliveryTripStore from "../deliveryTripStore";

describe("deliveryTripStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useDeliveryTripStore.setState({
			todayTrips: [],
			monthlyTrips: [],
			boltMonthlyOrders: [],
			loading: false,
		});
	});

	it("initializes with default empty lists", () => {
		const state = useDeliveryTripStore.getState();
		expect(state.todayTrips).toEqual([]);
		expect(state.monthlyTrips).toEqual([]);
		expect(state.boltMonthlyOrders).toEqual([]);
		expect(state.loading).toBe(false);
	});

	it("fails recordStaffTrip if employeeId or orderIds is missing", async () => {
		const result = await useDeliveryTripStore.getState().recordStaffTrip({
			employeeId: "",
			orderIds: [],
		});
		expect(result.success).toBe(false);
	});

	it("successfully records a staff delivery trip", async () => {
		const mockTrip = { id: "trip-123", employee_id: "emp-1", trip_fee: 20 };

		// Mock insert into delivery_trips
		const mockInsert = vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue({
				single: vi.fn().mockResolvedValue({ data: mockTrip, error: null }),
			}),
		});

		// Mock update orders
		const mockIn = vi.fn().mockResolvedValue({ error: null });
		const mockUpdate = vi.fn().mockReturnValue({ in: mockIn });

		// Mock select for fetchTodayTrips
		const mockLte = vi.fn().mockReturnValue({
			order: vi.fn().mockResolvedValue({ data: [mockTrip], error: null }),
		});
		const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
		const mockSelect = vi.fn().mockReturnValue({ gte: mockGte });

		supabase.from.mockImplementation((table) => {
			if (table === "delivery_trips") {
				return {
					insert: mockInsert,
					select: mockSelect,
				};
			}
			if (table === "orders") {
				return {
					update: mockUpdate,
				};
			}
			return {};
		});

		const result = await useDeliveryTripStore.getState().recordStaffTrip({
			employeeId: "emp-1",
			orderIds: ["ord-1", "ord-2"],
			tripFee: 20,
		});

		expect(result.success).toBe(true);
		expect(mockInsert).toHaveBeenCalledWith([
			expect.objectContaining({
				employee_id: "emp-1",
				trip_fee: 20,
				order_count: 2,
			}),
		]);
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				delivery_trip_id: "trip-123",
				delivery_provider: "in_house",
				delivery_fee_paid: true,
			})
		);
		expect(mockIn).toHaveBeenCalledWith("id", ["ord-1", "ord-2"]);
	});

	it("successfully assigns Bolt delivery without creating a trip record", async () => {
		const mockIn = vi.fn().mockResolvedValue({ error: null });
		const mockUpdate = vi.fn().mockReturnValue({ in: mockIn });

		supabase.from.mockImplementation((table) => {
			if (table === "orders") {
				return { update: mockUpdate };
			}
			return {};
		});

		const result = await useDeliveryTripStore.getState().recordBoltDelivery({
			orderIds: ["ord-99"],
		});

		expect(result.success).toBe(true);
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				delivery_provider: "bolt",
				delivery_trip_id: null,
				delivery_fee_paid: true,
			})
		);
		expect(mockIn).toHaveBeenCalledWith("id", ["ord-99"]);
	});

	it("successfully undoes a trip by resetting orders and deleting trip row", async () => {
		const mockEqOrders = vi.fn().mockResolvedValue({ error: null });
		const mockUpdateOrders = vi.fn().mockReturnValue({ eq: mockEqOrders });

		const mockEqTrips = vi.fn().mockResolvedValue({ error: null });
		const mockDeleteTrips = vi.fn().mockReturnValue({ eq: mockEqTrips });

		const mockLte = vi.fn().mockReturnValue({
			order: vi.fn().mockResolvedValue({ data: [], error: null }),
		});
		const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
		const mockSelect = vi.fn().mockReturnValue({ gte: mockGte });

		supabase.from.mockImplementation((table) => {
			if (table === "orders") {
				return { update: mockUpdateOrders };
			}
			if (table === "delivery_trips") {
				return {
					delete: mockDeleteTrips,
					select: mockSelect,
				};
			}
			return {};
		});

		const result = await useDeliveryTripStore.getState().undoTrip("trip-123");
		expect(result.success).toBe(true);
		expect(mockUpdateOrders).toHaveBeenCalledWith(
			expect.objectContaining({
				delivery_trip_id: null,
				delivery_fee_paid: false,
				delivery_provider: null,
			})
		);
		expect(mockEqOrders).toHaveBeenCalledWith("delivery_trip_id", "trip-123");
		expect(mockDeleteTrips).toHaveBeenCalled();
		expect(mockEqTrips).toHaveBeenCalledWith("id", "trip-123");
	});

	it("successfully resets all delivery trips", async () => {
		const mockNotOrders = vi.fn().mockResolvedValue({ error: null });
		const mockUpdateOrders = vi.fn().mockReturnValue({ not: mockNotOrders });

		const mockNeqTrips = vi.fn().mockResolvedValue({ error: null });
		const mockDeleteTrips = vi.fn().mockReturnValue({ neq: mockNeqTrips });

		supabase.from.mockImplementation((table) => {
			if (table === "orders") {
				return { update: mockUpdateOrders };
			}
			if (table === "delivery_trips") {
				return { delete: mockDeleteTrips };
			}
			return {};
		});

		useDeliveryTripStore.setState({
			todayTrips: [{ id: "trip-1" }],
			monthlyTrips: [{ id: "trip-1" }],
		});

		const result = await useDeliveryTripStore.getState().resetAllTrips();
		expect(result.success).toBe(true);
		expect(mockUpdateOrders).toHaveBeenCalledWith(
			expect.objectContaining({
				delivery_trip_id: null,
				delivery_fee_paid: false,
				delivery_provider: null,
			})
		);
		expect(mockNotOrders).toHaveBeenCalledWith("delivery_trip_id", "is", null);
		expect(mockDeleteTrips).toHaveBeenCalled();
		expect(mockNeqTrips).toHaveBeenCalledWith(
			"id",
			"00000000-0000-0000-0000-000000000000"
		);
		expect(useDeliveryTripStore.getState().todayTrips).toEqual([]);
		expect(useDeliveryTripStore.getState().monthlyTrips).toEqual([]);
	});

	it("fails transferTrip if tripId or newEmployeeId is missing", async () => {
		const res1 = await useDeliveryTripStore.getState().transferTrip("", "emp-2");
		expect(res1.success).toBe(false);

		const res2 = await useDeliveryTripStore.getState().transferTrip("trip-1", "");
		expect(res2.success).toBe(false);
	});

	it("successfully transfers a delivery trip to another staff member", async () => {
		const mockEq = vi.fn().mockResolvedValue({ error: null });
		const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

		const mockLte = vi.fn().mockReturnValue({
			order: vi.fn().mockResolvedValue({ data: [], error: null }),
		});
		const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
		const mockSelect = vi.fn().mockReturnValue({ gte: mockGte });

		supabase.from.mockImplementation((table) => {
			if (table === "delivery_trips") {
				return { update: mockUpdate, select: mockSelect };
			}
			return {};
		});

		const result = await useDeliveryTripStore
			.getState()
			.transferTrip("trip-123", "emp-new");

		expect(result.success).toBe(true);
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				employee_id: "emp-new",
			})
		);
		expect(mockEq).toHaveBeenCalledWith("id", "trip-123");
	});
});
