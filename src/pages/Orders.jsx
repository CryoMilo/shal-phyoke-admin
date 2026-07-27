// pages/Orders.jsx
import { useState, useEffect } from "react";
import NewOrderTab from "../components/orders/NewOrderTab";
import ActiveOrdersTab from "../components/orders/ActiveOrdersTab";
import TableSelectionModal from "../components/orders/TableSelectionModal";
import { supabase } from "../services/supabase";
import OrderHistoryTab from "../components/orders/OrderHistoryTab";
import { showToast } from "../utils/toastUtils";
import useQuickNoteStore from "../stores/quickNoteStore";
import useOrderStore from "../stores/orderStore";
import useStaffAccessStore from "../stores/staffAccessStore";
import { sendToKitchenPrinter } from "../services/printerService";
import { playDeliveryNotificationSound } from "../utils/soundUtils";
import { markOrderAsPlayed } from "../components/common/DeliveryNotificationListener";
import { FolderOpen } from "lucide-react";

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
		drafts,
		loadDraft,
		deleteDraft,
		setOrderType,
		setCustomerInfo,
		setTableNumber,
		setDeliveryFee,
		setPaymentMethod,
		setDiscountAmount,
		setNotes,
		addToCart,
		updateQuantity,
		splitItem,
		updateItemNote,
		clearCart,
		getSubtotal,
		getTotalAmount,
	} = useOrderStore();

	const [activeTab, setActiveTab] = useState("new-order");
	const [showTableModal, setShowTableModal] = useState(false);
	const [showDraftsModal, setShowDraftsModal] = useState(false);
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
				table_number: (orderType === "dine_in" || orderType === "takeaway") ? tableNumber : null,
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

			const { data, error } = editingOrderId
				? await supabase
						.from("orders")
						.update(orderData)
						.eq("id", editingOrderId)
						.select()
						.single()
				: await supabase
						.from("orders")
						.insert([orderData])
						.select()
						.single();

			if (error) throw error;

			// If we successfully processed a draft, delete it from our drafts list
			if (editingDraftId) {
				deleteDraft(editingDraftId);
			}

			// Play sound for delivery orders
			if (orderType === "delivery") {
				playDeliveryNotificationSound();
				markOrderAsPlayed(data.id);
			}

			// Trigger auto-print if enabled
			if (autoPrintKitchenTicket) {
				sendToKitchenPrinter(data).catch((err) => {
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
				<div className="w-[1px] h-8 bg-base-300 mx-1"></div>
				<button
					className="tab tab-lg text-secondary flex items-center gap-1 font-semibold"
					onClick={() => setShowDraftsModal(true)}>
					<FolderOpen className="w-4 h-4" />
					Drafts
					{drafts.length > 0 && (
						<span className="badge badge-secondary badge-sm font-bold ml-1">
							{drafts.length}
						</span>
					)}
				</button>
			</div>

			{/* Tab Content */}
			<>
				{activeTab === "new-order" ? (
					<NewOrderTab
						cart={cart}
						orderType={orderType}
						setOrderType={setOrderType}
						customerInfo={customerInfo}
						setCustomerInfo={setCustomerInfo}
						tableNumber={tableNumber}
						setTableNumber={setTableNumber}
						deliveryFee={deliveryFee}
						setDeliveryFee={setDeliveryFee}
						setShowTableModal={setShowTableModal}
						paymentMethod={paymentMethod}
						setPaymentMethod={setPaymentMethod}
						discountAmount={discountAmount}
						setDiscountAmount={setDiscountAmount}
						notes={notes}
						setNotes={setNotes}
						itemNotes={itemNotes}
						itemExtraPrices={itemExtraPrices}
						updateItemNote={updateItemNote}
						subtotal={subtotal}
						totalAmount={totalAmount}
						addToCart={addToCart}
						updateQuantity={updateQuantity}
						splitItem={splitItem}
						clearCart={clearCart}
						processOrder={processOrder}
						isProcessing={isProcessing}
					/>
				) : activeTab === "active-orders" ? (
					<ActiveOrdersTab />
				) : (
					<OrderHistoryTab />
				)}
			</>

			{/* Modals */}
			<TableSelectionModal
				show={showTableModal}
				onClose={() => setShowTableModal(false)}
				onSelect={(num) => {
					setTableNumber(num);
					setShowTableModal(false);
				}}
				selectedTable={tableNumber}
			/>

			{/* Drafts Modal */}
			{showDraftsModal && (
				<div className="modal modal-open z-50">
					<div className="modal-box max-w-4xl p-0 overflow-hidden bg-base-100">
						<div className="p-4 bg-base-200 border-b border-base-300 flex justify-between items-center">
							<h3 className="font-bold text-lg flex items-center gap-2">
								<FolderOpen className="w-5 h-5 text-secondary" /> Local Drafts / Parked Orders
							</h3>
							<button
								className="btn btn-sm btn-circle btn-ghost"
								onClick={() => setShowDraftsModal(false)}>
								✕
							</button>
						</div>

						<div className="p-6 max-h-[70vh] overflow-y-auto">
							{drafts.length > 0 ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
									{drafts.map((draft) => {
										const timeElapsed = Math.floor((new Date() - new Date(draft.created_at)) / 60000);
										return (
											<div
												key={draft.id}
												className="card border-2 border-secondary/20 bg-base-100 hover:border-secondary transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 group relative">
												
												{/* Delete Button */}
												<button
													className="absolute top-2 right-2 btn btn-circle btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white"
													onClick={(e) => {
														e.stopPropagation();
														deleteDraft(draft.id);
														showToast.success("Draft deleted");
													}}
													title="Delete draft">
													✕
												</button>

												<div
													className="card-body p-4 relative"
													onClick={() => {
														loadDraft(draft);
														setShowDraftsModal(false);
														setActiveTab("new-order"); // Switch back to New Order tab
														showToast.success("Loaded draft into POS");
													}}>
													
													<div className="text-[10px] opacity-40 font-mono mb-1">
														{timeElapsed}m ago
													</div>

													<div className="flex items-center gap-2 mb-2">
														<div
															className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm
															${
																draft.orderType === "dine_in"
																	? "bg-primary text-primary-content"
																	: draft.orderType === "delivery"
																	? "bg-accent text-accent-content"
																	: "bg-secondary text-secondary-content"
															}`}>
															{draft.tableNumber ||
																draft.customerInfo?.name?.substring(0, 2).toUpperCase() ||
																"?"}
														</div>
														<div className="flex-1 min-w-0">
															<div className="text-xs font-bold truncate">
																{draft.customerInfo?.name ||
																	(draft.orderType === "dine_in"
																		? `Table ${draft.tableNumber}`
																		: draft.orderType.toUpperCase())}
															</div>
															<div className="text-[10px] opacity-50 font-mono">
																Draft
															</div>
														</div>
													</div>

													<div className="text-xs space-y-1 mb-3 flex-1">
														<div className="opacity-70 font-semibold line-clamp-2">
															{draft.cart.map(item => `${item.quantity}x ${item.name_burmese}`).join(", ")}
														</div>
														{draft.notes && (
															<div className="text-[10px] text-accent truncate italic">
																"{draft.notes}"
															</div>
														)}
													</div>

													<div className="flex justify-between items-center mt-auto pt-2 border-t border-base-200">
														<span className="font-bold text-primary text-sm">
															฿{draft.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
														</span>
														<span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-secondary/20 text-secondary">
															DRAFT
														</span>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-center py-12 opacity-50">
									<FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
									<p>No parked drafts available.</p>
								</div>
							)}
						</div>
					</div>
					<div className="modal-backdrop bg-black/50" onClick={() => setShowDraftsModal(false)}></div>
				</div>
			)}
		</div>
	);
};

export default Orders;
