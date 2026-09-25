import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUpdate = vi.fn();
const mockInsert = vi.fn();

vi.mock("../../services/supabase", () => ({
	supabase: {
		from: vi.fn((table) => {
			if (table === "order_requests") {
				return {
					select: vi.fn().mockReturnThis(),
					in: vi.fn().mockReturnThis(),
					order: vi.fn().mockResolvedValue({
						data: [
							{
								id: "req-1",
								request_number: "REQ-001",
								status: "stock_checking",
								customer_name: "John",
								customer_phone: "0812345678",
								total_amount: 120,
							},
						],
						error: null,
					}),
					update: mockUpdate.mockReturnValue({
						eq: vi.fn().mockResolvedValue({ error: null }),
					}),
				};
			}
			if (table === "orders") {
				return {
					insert: mockInsert.mockReturnValue({
						select: vi.fn().mockReturnValue({
							single: vi.fn().mockResolvedValue({
								data: { id: "new-order-1", order_number: "DEL-123", customer_id: "cust-1" },
								error: null,
							}),
						}),
					}),
				};
			}
			if (table === "customers") {
				return {
					update: vi.fn().mockReturnValue({
						eq: vi.fn().mockResolvedValue({ error: null }),
					}),
				};
			}
			return {
				select: vi.fn().mockReturnThis(),
			};
		}),
		channel: vi.fn().mockReturnValue({
			on: vi.fn().mockReturnThis(),
			subscribe: vi.fn().mockReturnThis(),
		}),
		removeChannel: vi.fn(),
	},
}));

vi.mock("../../utils/toastUtils", () => ({
	showToast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
	},
}));

vi.mock("../../utils/soundUtils", () => ({
	playDeliveryNotificationSound: vi.fn(),
}));

vi.mock("../../services/printerService", () => ({
	sendToKitchenPrinter: vi.fn().mockResolvedValue({ success: true }),
}));

import useOrderRequestStore from "../orderRequestStore";

describe("orderRequestStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useOrderRequestStore.setState({
			orderRequests: [],
			loading: false,
			selectedRequest: null,
			actionLoading: false,
		});
	});

	it("fetches active order requests", async () => {
		await useOrderRequestStore.getState().fetchOrderRequests();
		const requests = useOrderRequestStore.getState().orderRequests;
		expect(requests.length).toBe(1);
		expect(requests[0].request_number).toBe("REQ-001");
	});

	it("confirms stock available for a request", async () => {
		const res = await useOrderRequestStore.getState().confirmStock("req-1");
		expect(res.success).toBe(true);
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				stock_status: "stock_confirmed",
				status: "awaiting_payment",
			})
		);
	});

	it("requests item change when out of stock", async () => {
		const res = await useOrderRequestStore.getState().requestChange("req-1", "Out of beef");
		expect(res.success).toBe(true);
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				stock_status: "change_requested",
				stock_rejection_reason: "Out of beef",
			})
		);
	});

	it("rejects an order request", async () => {
		const res = await useOrderRequestStore.getState().rejectRequest("req-1", "Cannot deliver");
		expect(res.success).toBe(true);
		expect(mockUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "cancelled",
				stock_status: "rejected",
			})
		);
	});

	it("approves paid order, creates official POS order, and converts request", async () => {
		const mockRequest = {
			id: "req-1",
			customer_id: "cust-1",
			customer_name: "John Doe",
			customer_phone: "0812345678",
			delivery_address: "Lumpini Building B",
			clean_building_info: "Building B",
			delivery_fee: 10,
			items: [{ id: "menu-1", quantity: 2, price: 50 }],
			item_notes: {},
			item_extra_prices: {},
			subtotal: 100,
			total_amount: 110,
			payment_type: "promptpay",
			payment_slip_url: "https://example.com/slip.jpg",
			notes: "Leave at lobby",
		};

		const res = await useOrderRequestStore.getState().approveOrder(mockRequest);
		expect(res.success).toBe(true);
		expect(mockInsert).toHaveBeenCalledWith(
			expect.objectContaining({
				order_type: "delivery",
				order_source: "qr",
				customer_name: "John Doe",
				payment_status: "paid",
				pos_order_status: "preparing",
			})
		);
	});
});
