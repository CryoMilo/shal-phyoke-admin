// pages/Orders.jsx
import { useState, useEffect } from "react";
import NewOrderTab from "../components/orders/NewOrderTab";
import ActiveOrdersTab from "../components/orders/ActiveOrdersTab";
import { supabase } from "../services/supabase";
import OrderHistoryTab from "../components/orders/OrderHistoryTab";
import { showToast } from "../utils/toastUtils";
import useQuickNoteStore from "../stores/quickNoteStore";
import useOrderStore from "../stores/orderStore";
import useMenuStore from "../stores/menuStore";
import useStaffAccessStore from "../stores/staffAccessStore";
import { sendToKitchenPrinter } from "../services/printerService";
import { playDeliveryNotificationSound } from "../utils/soundUtils";
import { markOrderAsPlayed } from "../components/common/DeliveryNotificationListener";

export const Orders = () => {
	const fetchActiveNotes = useQuickNoteStore((state) => state.fetchActiveNotes);
	const {
		cart,
		orderType,
		customerInfo,
		tableNumber,
		deliveryFee,
		paymentMethod,
		discountAmount,
		notes,
		itemNotes,
		itemExtraPrices,
		editingOrderId,
		editingDraftId,
		deleteDraft,
		clearCart,
		getSubtotal,
		getTotalAmount,
	} = useOrderStore();

	const [activeTab, setActiveTab] = useState("new-order");
	const [isProcessing, setIsProcessing] = useState(false);
	const { autoPrintKitchenTicket, fetchPermissions } = useStaffAccessStore();

	useEffect(() => {
		fetchActiveNotes();
		fetchPermissions();
	}, [fetchActiveNotes, fetchPermissions]);

	const subtotal = getSubtotal();
	const totalAmount = getTotalAmount();

	const processOrder = async () => {
		if (cart.length === 0 || isProcessing) return;

		setIsProcessing(true);
		try {
			const paymentStatus =
				paymentMethod === "cash" || paymentMethod === "qr" ? "paid" : "unpaid";

			const orderData = {
				order_type: orderType,
				customer_name: customerInfo.name || null,
				customer_phone: orderType === "delivery" ? customerInfo.phone : null,
				delivery_address:
					orderType === "delivery" ? customerInfo.address : null,
				delivery_fee: orderType === "delivery" ? deliveryFee : 0,
				table_number:
					orderType === "dine_in" || orderType === "takeaway"
						? tableNumber
						: null,
				order_items: cart.map((item) => {
					// Strip UI-only flags and combo store data
					// before persisting to the database
					const { ...cleanItem } = item;

					return {
						...cleanItem,
						extra_price: itemExtraPrices[item.cart_id] || 0,
						final_price: item.price + (itemExtraPrices[item.cart_id] || 0),
					};
				}),
				subtotal,
				discount_amount: discountAmount,
				total_amount: totalAmount,
				payment_method: paymentMethod,
				payment_status: paymentStatus,
				notes: notes || null,
				item_notes: itemNotes,
				item_extra_prices: itemExtraPrices,
			};

			// Validate stock limits before proceeding
			for (const item of cart) {
				const stock = item.effective_available_stock;
				if (stock !== undefined && stock !== -1 && stock !== null) {
					const totalQty = cart
						.filter((c) => c.id === item.id)
						.reduce((sum, c) => sum + c.quantity, 0);
					if (totalQty > stock) {
						throw new Error(
							`Cannot order ${totalQty} of ${
								item.name_english || item.name_burmese
							}. Only ${stock} available.`
						);
					}
				}
			}

			let returnedOrderId;
			let dbError;

			if (editingOrderId) {
				const { data, error } = await supabase
					.from("orders")
					.update(orderData)
					.eq("id", editingOrderId)
					.select()
					.single();
				returnedOrderId = data?.id;
				dbError = error;
			} else {
				// Aggregate cart items and their selected extras (add-ons) to pass all items to the stock deduction RPC
				const rawItemsToDeduct = [];
				cart.forEach((item) => {
					const qty = item.quantity || 1;
					rawItemsToDeduct.push({ id: item.id, qty });

					const note = itemNotes[item.cart_id];
					if (note && item.available_extras && item.available_extras.length > 0) {
						const noteParts = note.split(",").map((s) => s.trim());
						item.available_extras.forEach((extra) => {
							const toppingName = extra.name_burmese || extra.name_english;
							if (toppingName && noteParts.includes(toppingName)) {
								const extraItemId = extra.extra_item_id || extra.extra_item?.id;
								if (extraItemId) {
									rawItemsToDeduct.push({ id: extraItemId, qty });
								}
							}
						});
					}
				});

				// Group by menu_item_id to sum quantities for duplicates
				const groupedDeductions = {};
				rawItemsToDeduct.forEach(({ id, qty }) => {
					groupedDeductions[id] = (groupedDeductions[id] || 0) + qty;
				});

				const orderItemsPayload = Object.entries(groupedDeductions).map(([id, qty]) => ({
					menu_item_id: id,
					quantity: qty,
				}));

				// Use the RPC to place new order and deduct stock
				const { data, error } = await supabase.rpc(
					"place_order_with_stock_deduction",
					{
						p_customer_name: customerInfo?.name || null,
						p_total_amount: totalAmount,
						p_order_items: orderItemsPayload,
					}
				);
				returnedOrderId = data;
				dbError = error;

				// Since RPC might only set basic fields, update it with the rest of the POS data
				if (!dbError && returnedOrderId) {
					await supabase
						.from("orders")
						.update(orderData)
						.eq("id", returnedOrderId);
				}
			}

			if (dbError) throw dbError;

			// Deduct stock for ordered items and add-ons if creating a new order
			if (!editingOrderId) {
				// Refresh menu items in menuStore so stock count updates immediately across POS/Menu
				useMenuStore.getState().fetchAllMenuItems();
			}

			// If we successfully processed a draft, delete it from our drafts list
			if (editingDraftId) {
				deleteDraft(editingDraftId);
			}

			// Play sound for delivery orders
			if (orderType === "delivery") {
				playDeliveryNotificationSound();
				markOrderAsPlayed(returnedOrderId);
			}

			// Trigger auto-print if enabled
			if (autoPrintKitchenTicket) {
				sendToKitchenPrinter({ id: returnedOrderId }).catch((err) => {
					console.error("Auto-print failed:", err);
				});
			}

			showToast.success("Order processed successfully!");
			clearCart();
			setActiveTab("active-orders");
		} catch (error) {
			console.error("Error processing order:", error);
			showToast.error("Failed to process order: " + error.message);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="p-4 bg-base-100 min-h-screen">
			{/* Tabs Navigation */}
			<div className="tabs tabs-boxed mb-3 bg-base-200 p-1 w-fit rounded-lg flex items-center gap-1">
				<button
					className={`tab tab-lg ${
						activeTab === "new-order" ? "tab-active font-bold" : ""
					}`}
					onClick={() => setActiveTab("new-order")}>
					New Order
				</button>
				<button
					className={`tab tab-lg ${
						activeTab === "active-orders" ? "tab-active font-bold" : ""
					}`}
					onClick={() => setActiveTab("active-orders")}>
					Active Orders
				</button>
				<button
					className={`tab tab-lg ${
						activeTab === "order-history" ? "tab-active font-bold" : ""
					}`}
					onClick={() => setActiveTab("order-history")}>
					Order History
				</button>
			</div>

			{/* Tab Content */}
			<>
				{activeTab === "new-order" ? (
					<NewOrderTab
						processOrder={processOrder}
						isProcessing={isProcessing}
					/>
				) : activeTab === "active-orders" ? (
					<ActiveOrdersTab />
				) : (
					<OrderHistoryTab />
				)}
			</>
		</div>
	);
};

export default Orders;
