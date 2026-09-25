// src/stores/orderRequestStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";
import { sendToKitchenPrinter } from "../services/printerService";
import useStaffAccessStore from "./staffAccessStore";

let realtimeChannel = null;
let debounceTimer = null;

const useOrderRequestStore = create((set, get) => ({
	orderRequests: [],
	loading: false,
	selectedRequest: null,
	actionLoading: false,

	setSelectedRequest: (request) => {
		set({ selectedRequest: request });
	},

	// Fetch active pending order requests
	fetchOrderRequests: async () => {
		try {
			set({ loading: true });
			const { data, error } = await supabase
				.from("order_requests")
				.select("*")
				.in("status", ["stock_checking", "awaiting_payment", "paid_pending_approval"])
				.order("created_at", { ascending: false });

			if (error) throw error;
			set({ orderRequests: data || [] });

			// Keep selectedRequest in sync if it's currently open
			const currentSelected = get().selectedRequest;
			if (currentSelected && data) {
				const updated = data.find((r) => r.id === currentSelected.id);
				if (updated) {
					set({ selectedRequest: updated });
				}
			}
		} catch (error) {
			console.error("Error fetching order requests:", error);
		} finally {
			set({ loading: false });
		}
	},

	// Subscribe to realtime changes on order_requests
	subscribeToOrderRequests: () => {
		if (realtimeChannel) {
			supabase.removeChannel(realtimeChannel);
			realtimeChannel = null;
		}

		const debouncedFetch = () => {
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				get().fetchOrderRequests();
			}, 300);
		};

		realtimeChannel = supabase
			.channel("order-requests-admin-realtime")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "order_requests",
				},
				(payload) => {
					const { eventType, new: newRecord, old: oldRecord } = payload;

					if (eventType === "INSERT") {
						if (
							newRecord.status === "stock_checking" ||
							newRecord.status === "paid_pending_approval"
						) {
							showToast.info(
								`📥 New Request #${newRecord.request_number} (${
									newRecord.status === "stock_checking"
										? "Stock Verification"
										: "Payment Review"
								})`
							);
						}
					} else if (eventType === "UPDATE") {
						// Always keep selectedRequest in sync in real-time if staff has it open
						const currentSelected = get().selectedRequest;
						if (currentSelected && currentSelected.id === newRecord.id) {
							set({ selectedRequest: newRecord });
						}

						if (newRecord.status === "cancelled") {
							if (oldRecord?.status !== "cancelled") {
								const isCustomerCancelled =
									newRecord.stock_rejection_reason?.toLowerCase().includes("customer") ||
									newRecord.stock_status === "rejected";
								showToast.warning(
									`⚠️ Request #${newRecord.request_number || newRecord.id.slice(0, 6)} was cancelled${
										isCustomerCancelled ? " by customer" : ""
									}`
								);
							}
						} else if (
							newRecord.status === "paid_pending_approval" &&
							oldRecord?.status !== "paid_pending_approval"
						) {
							showToast.success(
								`💰 Slip uploaded for Request #${newRecord.request_number}!`
							);
						} else if (
							newRecord.status === "stock_checking" &&
							oldRecord?.status !== "stock_checking"
						) {
							showToast.info(
								`⏳ Stock verification requested for #${newRecord.request_number}`
							);
						}
					}

					debouncedFetch();
				}
			)
			.subscribe((status) => {
				if (status === "CHANNEL_ERROR") {
					console.warn("Order requests realtime channel error. Reconnecting...");
				}
			});

		return () => {
			if (debounceTimer) clearTimeout(debounceTimer);
			if (realtimeChannel) {
				supabase.removeChannel(realtimeChannel);
				realtimeChannel = null;
			}
		};
	},

	// Phase 1 Action: Confirm stock is available
	confirmStock: async (requestId) => {
		try {
			set({ actionLoading: true });
			const { error } = await supabase
				.from("order_requests")
				.update({
					stock_status: "stock_confirmed",
					status: "awaiting_payment",
					stock_checked_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", requestId);

			if (error) throw error;

			showToast.success("Stock confirmed! Customer notified to pay.");
			await get().fetchOrderRequests();
			return { success: true };
		} catch (error) {
			console.error("Error confirming stock:", error);
			showToast.error("Failed to confirm stock: " + error.message);
			return { error };
		} finally {
			set({ actionLoading: false });
		}
	},

	// Phase 1 Action: Request item change due to stock shortage
	requestChange: async (requestId, reason) => {
		if (!reason || !reason.trim()) {
			showToast.warning("Please provide a reason or alternative item suggestion.");
			return { error: new Error("Reason required") };
		}

		try {
			set({ actionLoading: true });
			const { error } = await supabase
				.from("order_requests")
				.update({
					stock_status: "change_requested",
					stock_rejection_reason: reason.trim(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", requestId);

			if (error) throw error;

			showToast.info("Item change request sent to customer.");
			await get().fetchOrderRequests();
			return { success: true };
		} catch (error) {
			console.error("Error requesting change:", error);
			showToast.error("Failed to request change: " + error.message);
			return { error };
		} finally {
			set({ actionLoading: false });
		}
	},

	// Phase 1 / Phase 2 Action: Reject order request
	rejectRequest: async (requestId, reason = null) => {
		try {
			set({ actionLoading: true });
			const { error } = await supabase
				.from("order_requests")
				.update({
					status: "cancelled",
					stock_status: "rejected",
					stock_rejection_reason: reason ? reason.trim() : "Rejected by staff",
					updated_at: new Date().toISOString(),
				})
				.eq("id", requestId);

			if (error) throw error;

			showToast.error("Order request cancelled.");
			set({ selectedRequest: null });
			await get().fetchOrderRequests();
			return { success: true };
		} catch (error) {
			console.error("Error rejecting request:", error);
			showToast.error("Failed to reject request: " + error.message);
			return { error };
		} finally {
			set({ actionLoading: false });
		}
	},

	// Phase 2 Action: Approve payment and convert to official POS order
	approveOrder: async (request) => {
		try {
			set({ actionLoading: true });

			const orderNumber = `DEL-${Date.now().toString(36).toUpperCase()}`;

			// 1. Prepare official POS order payload
			const orderData = {
				order_number: orderNumber,
				order_type: "delivery",
				order_source: "qr",
				customer_id: request.customer_id || null,
				customer_name: request.customer_name,
				customer_phone: request.customer_phone,
				delivery_address: request.delivery_address,
				delivery_fee: Number(request.delivery_fee) || 0,
				order_items: request.items || [],
				item_notes: request.item_notes || {},
				item_extra_prices: request.item_extra_prices || {},
				subtotal: Number(request.subtotal) || 0,
				total_amount: Number(request.total_amount) || 0,
				payment_method: request.payment_type === "cod" ? "cash" : "qr",
				payment_status: request.payment_type === "cod" ? "unpaid" : "paid",
				pos_order_status: "preparing",
				payment_slip_url: request.payment_slip_url || null,
				notes: request.notes || null,
			};

			// 2. Insert into public.orders
			const { data: newOrder, error: orderError } = await supabase
				.from("orders")
				.insert(orderData)
				.select()
				.single();

			if (orderError) throw orderError;

			// 3. If customer_id and clean_building_info exist, sync building_info
			const targetCustomerId = request.customer_id || newOrder?.customer_id;
			if (targetCustomerId && request.clean_building_info) {
				try {
					await supabase
						.from("customers")
						.update({
							building_info: request.clean_building_info.trim(),
							updated_at: new Date().toISOString(),
						})
						.eq("id", targetCustomerId);
				} catch (custErr) {
					console.error("Failed to sync customer building_info:", custErr);
				}
			}

			// 4. Update order_requests to converted_to_order
			const { error: requestUpdateError } = await supabase
				.from("order_requests")
				.update({
					status: "converted_to_order",
					final_order_id: newOrder.id,
					updated_at: new Date().toISOString(),
				})
				.eq("id", request.id);

			if (requestUpdateError) {
				console.error("Error updating order_requests final_order_id:", requestUpdateError);
			}

			// 5. Automatically send to kitchen printer if enabled
			const { autoPrintKitchenTicket } = useStaffAccessStore.getState();
			if (autoPrintKitchenTicket) {
				try {
					await sendToKitchenPrinter(newOrder);
					showToast.info("Kitchen ticket sent to printer");
				} catch (printErr) {
					console.error("Kitchen printer error:", printErr);
				}
			}

			showToast.success(`Order #${newOrder.order_number || newOrder.id.slice(0, 8)} approved & sent to kitchen!`);
			set({ selectedRequest: null });
			await get().fetchOrderRequests();

			return { success: true, order: newOrder };
		} catch (error) {
			console.error("Error approving order:", error);
			showToast.error("Failed to approve order: " + error.message);
			return { error };
		} finally {
			set({ actionLoading: false });
		}
	},
}));

export default useOrderRequestStore;
