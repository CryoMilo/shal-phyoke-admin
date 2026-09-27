// src/components/orders/OrderRequestDetailModal.jsx
import React, { useState } from "react";
import {
	X,
	Check,
	AlertTriangle,
	ChefHat,
	ExternalLink,
	Phone,
	Building2,
	MapPin,
	Receipt,
	Banknote,
	QrCode,
	MessageSquare,
	Clock,
	XCircle,
} from "lucide-react";
import useOrderRequestStore from "../../stores/orderRequestStore";

const OrderRequestDetailModal = ({ isOpen, onClose, request }) => {
	const {
		confirmStock,
		requestChange,
		rejectRequest,
		approveOrder,
		actionLoading,
	} = useOrderRequestStore();

	const [isChangeRequestedOpen, setIsChangeRequestedOpen] = useState(false);
	const [changeReason, setChangeReason] = useState("");
	const [isRejectOpen, setIsRejectOpen] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [isSlipEnlarged, setIsSlipEnlarged] = useState(false);

	if (!isOpen || !request) return null;

	const items = Array.isArray(request.items) ? request.items : [];
	const isCancelled = request.status === "cancelled";
	const isChangeRequested =
		request.stock_status === "change_requested" &&
		request.status === "stock_checking";
	const isStockCheck =
		request.status === "stock_checking" &&
		request.stock_status !== "change_requested";
	const isPaymentCheck = request.status === "paid_pending_approval";
	const isAwaitingPayment = request.status === "awaiting_payment";

	const handleConfirmStock = async () => {
		const res = await confirmStock(request.id);
		if (res.success) {
			onClose();
		}
	};

	const handleSubmitChange = async () => {
		if (!changeReason.trim()) return;
		const res = await requestChange(request.id, changeReason);
		if (res.success) {
			setIsChangeRequestedOpen(false);
			onClose();
		}
	};

	const handleReject = async () => {
		const res = await rejectRequest(request.id, rejectReason);
		if (res.success) {
			setIsRejectOpen(false);
			onClose();
		}
	};

	const handleApproveOrder = async () => {
		const res = await approveOrder(request);
		if (res?.success) {
			onClose();
		}
	};

	return (
		<div className="modal modal-open z-50">
			<div className="modal-box p-0 max-w-xl w-full mx-3 bg-base-100 rounded-3xl shadow-2xl overflow-hidden border border-base-300 max-h-[92vh] flex flex-col">
				{/* Top Header */}
				<div className="p-4 sm:p-5 bg-base-200/80 border-b border-base-300 flex items-center justify-between shrink-0">
					<div className="flex items-center gap-3">
						<div
							className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
								isCancelled
									? "bg-error/20 text-error"
									: isChangeRequested
									? "bg-secondary/20 text-secondary"
									: isStockCheck
									? "bg-warning/20 text-warning"
									: isPaymentCheck
									? "bg-info/20 text-info"
									: "bg-base-300 text-base-content"
							}`}>
							{isCancelled ? (
								<XCircle className="w-5 h-5" />
							) : isChangeRequested ? (
								<MessageSquare className="w-5 h-5" />
							) : isStockCheck ? (
								<AlertTriangle className="w-5 h-5" />
							) : (
								<Receipt className="w-5 h-5" />
							)}
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="font-extrabold text-base md:text-lg leading-tight">
									Order Request
								</h3>
								<span className="font-mono text-xs font-bold text-base-content/60">
									#{request.request_number}
								</span>
							</div>
							<div className="flex items-center gap-1.5 mt-0.5">
								{isCancelled && (
									<span className="badge badge-error badge-xs font-bold gap-1">
										⚠️ Cancelled by Customer
									</span>
								)}
								{isChangeRequested && (
									<span className="badge badge-secondary badge-xs font-bold gap-1">
										💬 Phase 1: Change Requested
									</span>
								)}
								{isStockCheck && (
									<span className="badge badge-warning badge-xs font-bold">
										⏳ Phase 1: Stock Verification
									</span>
								)}
								{isPaymentCheck && (
									<span className="badge badge-info badge-xs font-bold">
										💰 Phase 2: Payment Review
									</span>
								)}
								{isAwaitingPayment && (
									<span className="badge badge-ghost badge-xs font-semibold">
										⌛ Awaiting Customer Payment
									</span>
								)}
							</div>
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="btn btn-circle btn-ghost btn-sm"
						disabled={actionLoading}>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Modal Scrollable Body */}
				<div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-sm">
					{/* Customer Cancellation Banner */}
					{isCancelled && (
						<div className="bg-error/10 border-2 border-error/30 rounded-2xl p-4 flex items-start gap-3">
							<AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
							<div className="space-y-1">
								<h4 className="font-extrabold text-sm text-error">
									Order Request Cancelled
								</h4>
								<p className="text-xs text-base-content/80 font-medium">
									Customer cancelled this order request while waiting. No kitchen action needed.
								</p>
								{request.stock_rejection_reason && (
									<p className="text-[11px] text-base-content/60 italic">
										Reason: {request.stock_rejection_reason}
									</p>
								)}
							</div>
						</div>
					)}

					{/* Change Requested Banner */}
					{isChangeRequested && (
						<div className="bg-secondary/10 border-2 border-secondary/30 rounded-2xl p-4 flex items-start gap-3">
							<MessageSquare className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
							<div className="space-y-1">
								<h4 className="font-extrabold text-sm text-secondary">
									Item Change Requested
								</h4>
								<p className="text-xs text-base-content/80 font-medium">
									Customer was notified to swap out unavailable items. Waiting for customer to update cart and proceed.
								</p>
								{request.stock_rejection_reason && (
									<p className="text-xs text-base-content/90 font-mono bg-base-100/90 p-2 rounded-xl border border-secondary/20 mt-1">
										Note sent: &quot;{request.stock_rejection_reason}&quot;
									</p>
								)}
							</div>
						</div>
					)}

					{/* 1. Customer & Delivery Info Card */}
					<div className="bg-base-200/50 rounded-2xl p-3.5 border border-base-300/80 space-y-2">
						<div className="flex items-center justify-between">
							<span className="font-bold text-base-content text-sm">
								{request.customer_name}
							</span>
							{request.customer_phone && (
								<a
									href={`tel:${request.customer_phone}`}
									className="btn btn-xs btn-outline btn-primary gap-1 font-mono">
									<Phone className="w-3 h-3" />
									{request.customer_phone}
								</a>
							)}
						</div>

						<div className="flex items-start gap-1.5 text-xs text-base-content/80">
							<Building2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
							<span>
								{request.clean_building_info && (
									<strong>{request.clean_building_info} - </strong>
								)}
								{request.clean_address || request.delivery_address}
							</span>
						</div>

						{request.notes && (
							<div className="mt-1 bg-base-100 p-2 rounded-xl text-xs text-base-content/80 border border-base-200 flex items-start gap-1.5">
								<MessageSquare className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
								<span>
									<strong>Drop-off note:</strong> {request.notes}
								</span>
							</div>
						)}
					</div>

					{/* 2. Items List */}
					<div className="space-y-2">
						<div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-base-content/60">
							<span>Requested Items ({items.length})</span>
							<span>Price</span>
						</div>

						<div className="divide-y divide-base-200 border border-base-200 rounded-2xl bg-base-100 overflow-hidden">
							{items.map((item, idx) => {
								const extraPrice = Number(
									item.extra_price !== undefined
										? item.extra_price
										: request.item_extra_prices?.[item.cart_id] || 0
								);
								const unitPrice =
									item.final_price !== undefined
										? Number(item.final_price)
										: (Number(item.price) || 0) + extraPrice;
								const note = (
									item.notes ||
									request.item_notes?.[item.cart_id] ||
									""
								).trim();

								return (
									<div
										key={item.cart_id || idx}
										className={`p-3 flex items-start justify-between gap-3 ${
											item.requires_stock_check
												? "bg-warning/10 border-l-4 border-warning"
												: ""
										}`}>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-1.5 flex-wrap">
												<span className="font-extrabold text-base-content">
													{item.quantity}x
												</span>
												<span className="font-semibold text-base-content">
													{item.name_burmese || item.name_english}
												</span>
												{item.name_english && item.name_burmese && (
													<span className="text-xs text-base-content/60">
														({item.name_english})
													</span>
												)}
												{item.requires_stock_check && (
													<span className="badge badge-warning badge-xs font-bold gap-1">
														⚠️ Check Stock
													</span>
												)}
											</div>

											{note && (
										<div className="mt-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block font-medium">
													📝 {note}
												</div>
											)}
										</div>

										<div className="font-mono font-bold text-base-content text-right shrink-0">
											฿{(unitPrice * (Number(item.quantity) || 1)).toFixed(2)}
										</div>
									</div>
								);
							})}
						</div>

						{/* Price Totals */}
						<div className="bg-base-200/40 rounded-2xl p-3 space-y-1 text-xs">
							<div className="flex justify-between text-base-content/70">
								<span>Food Subtotal</span>
								<span className="font-mono">
									฿{Number(request.subtotal || 0).toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between text-base-content/70">
								<span>Fixed Delivery Fee</span>
								<span className="font-mono">
									฿{Number(request.delivery_fee || 0).toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between text-sm font-extrabold text-base-content pt-1 border-t border-base-300">
								<span>Total Amount</span>
								<span className="text-primary font-mono text-base">
									฿{Number(request.total_amount || 0).toFixed(2)}
								</span>
							</div>
						</div>
					</div>

					{/* 3. Payment Verification Section (if Phase 2 or slip present) */}
					{(isPaymentCheck || request.payment_slip_url || request.payment_type) && (
						<div className="bg-base-200/50 rounded-2xl p-3.5 border border-base-300 space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
									<Receipt className="w-3.5 h-3.5 text-info" />
									Payment Verification
								</span>
								<span className="badge badge-outline font-bold text-xs">
									{request.payment_type === "cod"
										? "Cash on Delivery"
										: request.payment_type === "truemoney"
										? "TrueMoney Wallet"
										: "PromptPay QR"}
								</span>
							</div>

							{request.payment_slip_url ? (
								<div className="space-y-2">
									<div className="flex items-center gap-3">
										<div
											onClick={() => setIsSlipEnlarged(!isSlipEnlarged)}
											className="w-20 h-24 rounded-xl border-2 border-base-300 overflow-hidden cursor-pointer hover:opacity-90 relative shrink-0 shadow-sm group">
											<img
												src={request.payment_slip_url}
												alt="Payment Transfer Slip"
												className="w-full h-full object-cover group-hover:scale-105 transition-transform"
											/>
											<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
												Zoom
											</div>
										</div>
										<div className="space-y-1.5 text-xs">
											<p className="font-bold text-base-content">
												Bank Transfer Slip Attached
											</p>
											<p className="text-base-content/60">
												Verify recipient account and transfer amount (฿
												{Number(request.total_amount || 0).toFixed(2)}).
											</p>
											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={() => setIsSlipEnlarged(!isSlipEnlarged)}
													className="btn btn-xs btn-outline btn-info">
													{isSlipEnlarged ? "Collapse" : "Enlarge Preview"}
												</button>
												<a
													href={request.payment_slip_url}
													target="_blank"
													rel="noopener noreferrer"
													className="btn btn-xs btn-ghost gap-1 text-primary p-0 font-medium">
													<span>Open Full Slip in New Tab</span>
													<ExternalLink className="w-3 h-3" />
												</a>
											</div>
										</div>
									</div>

									{isSlipEnlarged && (
										<div className="rounded-2xl overflow-hidden border border-base-300 bg-black/90 p-2 flex flex-col items-center gap-2">
											<img
												src={request.payment_slip_url}
												alt="Payment Transfer Slip Full"
												className="max-h-96 object-contain rounded-xl"
											/>
											<button
												type="button"
												onClick={() => setIsSlipEnlarged(false)}
												className="btn btn-xs btn-ghost text-white/80 hover:text-white">
												Close Preview
											</button>
										</div>
									)}
								</div>
							) : request.payment_type === "cod" ? (
								<div className="bg-success/10 border border-success/30 rounded-xl p-3 text-xs text-base-content flex items-center gap-2">
									<span className="text-base">💵</span>
									<span className="font-medium">
										<strong>Cash on Delivery</strong> (฿{Number(request.total_amount || 0).toFixed(2)} to collect upon delivery)
									</span>
								</div>
							) : (
								<p className="text-xs text-warning">
									⚠️ QR payment selected, but transfer slip has not been uploaded yet.
								</p>
							)}
						</div>
					)}

					{/* 4. Request Change Inline Input */}
					{isChangeRequestedOpen && (
						<div className="bg-warning/10 border border-warning/30 rounded-2xl p-3.5 space-y-2">
							<div className="flex items-center gap-1.5 text-xs font-bold text-warning">
								<AlertTriangle className="w-4 h-4" />
								<span>Reason / Alternative Item for Customer</span>
							</div>
							<textarea
								rows={2}
								className="textarea textarea-bordered w-full text-xs"
								placeholder="e.g. Shan Noodle is sold out, please choose Garlic Noodle or remove item."
								value={changeReason}
								onChange={(e) => setChangeReason(e.target.value)}
							/>
							<div className="flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setIsChangeRequestedOpen(false)}
									className="btn btn-xs btn-ghost">
									Cancel
								</button>
								<button
									type="button"
									disabled={!changeReason.trim() || actionLoading}
									onClick={handleSubmitChange}
									className="btn btn-xs btn-warning font-bold">
									Send Change Request
								</button>
							</div>
						</div>
					)}

					{/* 5. Reject Request Inline Input */}
					{isRejectOpen && (
						<div className="bg-error/10 border border-error/30 rounded-2xl p-3.5 space-y-2">
							<div className="flex items-center gap-1.5 text-xs font-bold text-error">
								<X className="w-4 h-4" />
								<span>Cancellation Reason</span>
							</div>
							<input
								type="text"
								className="input input-sm input-bordered w-full text-xs"
								placeholder="e.g. Kitchen closed / unable to deliver"
								value={rejectReason}
								onChange={(e) => setRejectReason(e.target.value)}
							/>
							<div className="flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setIsRejectOpen(false)}
									className="btn btn-xs btn-ghost">
									Cancel
								</button>
								<button
									type="button"
									disabled={actionLoading}
									onClick={handleReject}
									className="btn btn-xs btn-error font-bold">
									Confirm Reject
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Bottom Actions Bar */}
				<div className="p-4 sm:p-5 bg-base-200/80 border-t border-base-300 flex flex-wrap items-center justify-between gap-2 shrink-0">
					{isCancelled ? (
						<div className="w-full flex items-center justify-between">
							<span className="text-xs text-error font-semibold flex items-center gap-1">
								<AlertTriangle className="w-3.5 h-3.5" />
								No kitchen action needed
							</span>
							<button
								type="button"
								onClick={onClose}
								className="btn btn-sm btn-outline border-base-300">
								Close
							</button>
						</div>
					) : isChangeRequested ? (
						<div className="w-full flex items-center justify-between">
							{!isRejectOpen ? (
								<button
									type="button"
									onClick={() => setIsRejectOpen(true)}
									disabled={actionLoading}
									className="btn btn-sm btn-ghost text-error hover:bg-error/10">
									Cancel Request
								</button>
							) : (
								<div />
							)}

							<div className="flex items-center gap-2">
								<span className="text-xs text-secondary font-medium">
									Waiting for customer response...
								</span>
								<button
									type="button"
									onClick={onClose}
									className="btn btn-sm btn-outline border-base-300">
									Close
								</button>
							</div>
						</div>
					) : (
						<>
							{/* Rejection trigger */}
							{!isRejectOpen && !isChangeRequestedOpen && (
								<button
									type="button"
									onClick={() => setIsRejectOpen(true)}
									disabled={actionLoading}
									className="btn btn-sm btn-ghost text-error hover:bg-error/10">
									Reject
								</button>
							)}

							<div className="flex items-center gap-2 ml-auto">
								{/* Phase 1 Actions */}
								{isStockCheck && !isChangeRequestedOpen && !isRejectOpen && (
									<>
										<button
											type="button"
											onClick={() => setIsChangeRequestedOpen(true)}
											disabled={actionLoading}
											className="btn btn-sm btn-outline btn-warning gap-1">
											<AlertTriangle className="w-4 h-4" />
											<span>Out of Stock</span>
										</button>

										<button
											type="button"
											onClick={handleConfirmStock}
											disabled={actionLoading}
											className="btn btn-sm btn-success font-extrabold text-success-content gap-1.5 shadow-md">
											<Check className="w-4 h-4" />
											<span>Confirm Stock Available</span>
										</button>
									</>
								)}

								{/* Phase 2 Actions */}
								{isPaymentCheck && !isRejectOpen && (
									<button
										type="button"
										onClick={handleApproveOrder}
										disabled={actionLoading}
										className="btn btn-sm btn-primary font-extrabold text-primary-content gap-1.5 shadow-md">
										<ChefHat className="w-4 h-4" />
										<span>Approve &amp; Print to Kitchen</span>
									</button>
								)}

								{/* Awaiting Payment Action */}
								{isAwaitingPayment && !isRejectOpen && (
									<button
										type="button"
										onClick={handleApproveOrder}
										disabled={actionLoading}
										className="btn btn-sm btn-outline btn-primary gap-1">
										<span>Manual Cash Approval</span>
									</button>
								)}
							</div>
						</>
					)}
				</div>
			</div>
			<div className="modal-backdrop" onClick={onClose} />
		</div>
	);
};

export default OrderRequestDetailModal;

