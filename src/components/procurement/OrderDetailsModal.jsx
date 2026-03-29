// src/components/procurement/OrderDetailsModal.jsx
import React, { useState } from "react";
import { X, Check, AlertCircle, Package, Calendar } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import { showToast } from "../../utils/toastUtils";

const OrderDetailsModal = ({ isOpen, onClose, order, readOnly = false }) => {
	const safeItems = order?.items ?? [];
	const [receivedItems, setReceivedItems] = useState(
		safeItems.reduce((acc, item) => {
			// For read-only mode, set based on actual received status
			acc[item.id] = readOnly ? item.received : false;
			return acc;
		}, {})
	);
	const [notes, setNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { updateOrderStatus } = useProcurementStore();

	if (!isOpen) return null;

	const handleToggleItem = (itemId) => {
		if (readOnly) return; // No toggling in read-only mode
		setReceivedItems((prev) => ({
			...prev,
			[itemId]: !prev[itemId],
		}));
	};

	const handleSubmit = async () => {
		if (readOnly) return;
		if (!order.items || order.items.length === 0) {
			showToast.error("Order has no items to process");
			return;
		}

		const received = order.items.filter((item) => receivedItems[item.id]);
		const missed = order.items.filter((item) => !receivedItems[item.id]);

		if (received.length === 0 && missed.length === 0) {
			showToast.error("No items to process");
			return;
		}

		setIsSubmitting(true);
		const result = await updateOrderStatus(
			order.id,
			missed.length === 0 ? "arrived" : "partial",
			received,
			missed,
			notes
		);
		setIsSubmitting(false);

		if (result?.success) {
			showToast.success(
				missed.length > 0
					? `${missed.length} missed items added to market list`
					: "Order marked as arrived"
			);
			onClose();
		}
	};

	const canSubmit =
		!readOnly &&
		(Object.values(receivedItems).some((v) => v === true) ||
			Object.values(receivedItems).some((v) => v === false));

	const missedCount = safeItems.filter((item) => !receivedItems[item.id]).length;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-3xl relative max-h-[90vh] overflow-y-auto">
				<button
					onClick={onClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
					<X className="w-4 h-4" />
				</button>

				<h3 className="font-bold text-xl mb-1">Order Details</h3>
				<p className="text-gray-600 mb-6">
					{order.vendor?.name} •{" "}
					{readOnly && (
						<span className="ml-3 badge badge-ghost">
							{order.status === "arrived" ? "Completed" : "Cancelled"}
						</span>
					)}
				</p>

				{/* Order Info Summary */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-base-200 rounded-lg p-4 mb-6">
					<div>
						<p className="text-xs text-gray-500">Ordered Date</p>
						<p className="font-medium text-sm">
							{new Date(order.created_at).toLocaleDateString()}
						</p>
					</div>
					<div>
						<p className="text-xs text-gray-500">Est. Arrival</p>
						<p className="font-medium text-sm">
							{order.estimated_arrival
								? new Date(order.estimated_arrival).toLocaleDateString()
								: "N/A"}
						</p>
					</div>
					{order.arrived_at && (
						<div>
							<p className="text-xs text-gray-500">Arrived Date</p>
							<p className="font-medium text-sm">
								{new Date(order.arrived_at).toLocaleDateString()}
							</p>
						</div>
					)}
					<div>
						<p className="text-xs text-gray-500">Total Items</p>
						<p className="font-medium text-sm">{order.total_items}</p>
					</div>
				</div>

				{/* Items List */}
				<h4 className="font-semibold mb-3">
					{readOnly ? "Order Items" : "Items Received"}
				</h4>
				{!readOnly && (
					<p className="text-sm text-gray-600 mb-4">
						Check items that arrived. Unchecked items will be marked as missed
						and reordered.
					</p>
				)}

				<div className="space-y-2 max-h-60 overflow-y-auto mb-4">
					{safeItems.map((item) => {
						const isReceived = readOnly
							? item.received
							: receivedItems[item.id];

						return (
							<div
								key={item.id}
								className={`flex items-center gap-3 p-3 rounded-lg border ${
									readOnly
										? "bg-base-100 border-base-200"
										: isReceived
										? "bg-green-50 border-green-200 cursor-pointer"
										: "bg-orange-50 border-orange-200 cursor-pointer"
								}`}
								onClick={() => !readOnly && handleToggleItem(item.id)}>
								{!readOnly && (
									<input
										type="checkbox"
										checked={isReceived}
										onChange={() => handleToggleItem(item.id)}
										className="checkbox checkbox-sm"
									/>
								)}

								<div className="flex-1">
									<p className="font-medium">
										{item.inventory_item?.name || item.custom_item_name}
									</p>
									<p className="text-sm text-gray-600">
										{item.quantity} {item.unit}
										{item.notes && ` • ${item.notes}`}
									</p>
								</div>

								{readOnly ? (
									isReceived ? (
										<span className="text-xs text-green-600 flex items-center gap-1">
											<Check className="w-3 h-3" />
											Received
										</span>
									) : (
										<span className="text-xs text-orange-600 flex items-center gap-1">
											<AlertCircle className="w-3 h-3" />
											Missed
										</span>
									)
								) : isReceived ? (
									<span className="text-xs text-green-600 flex items-center gap-1">
										<Check className="w-3 h-3" />
										Received
									</span>
								) : (
									<span className="text-xs text-orange-600 flex items-center gap-1">
										<AlertCircle className="w-3 h-3" />
										Will reorder
									</span>
								)}
							</div>
						);
					})}
				</div>

				{/* Missed Items Summary - Only show for active orders */}
				{!readOnly && missedCount > 0 && (
					<div className="alert alert-warning mb-4">
						<AlertCircle className="w-5 h-5" />
						<span>
							{missedCount} item{missedCount > 1 ? "s" : ""} will be added back
							to market list for reorder.
						</span>
					</div>
				)}

				{/* Notes */}
				<div className="form-control mb-4">
					<label className="label">
						<span className="label-text font-medium">
							{readOnly ? "Order Notes" : "Delivery Notes"}
						</span>
					</label>
					<textarea
						value={readOnly ? order.notes || "No notes" : notes}
						onChange={(e) => !readOnly && setNotes(e.target.value)}
						placeholder={readOnly ? "" : "Any issues with the delivery?"}
						className={`textarea textarea-bordered ${
							readOnly ? "bg-base-200" : ""
						}`}
						rows="2"
						readOnly={readOnly}
						disabled={readOnly}
					/>
				</div>

				{/* Action Buttons */}
				<div className="flex justify-end gap-2">
					<button onClick={onClose} className="btn btn-ghost">
						Close
					</button>
					{!readOnly && (
						<button
							onClick={handleSubmit}
							className="btn btn-primary"
							disabled={!canSubmit || isSubmitting}>
							{isSubmitting ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : missedCount > 0 ? (
								"Confirm Partial Arrival"
							) : (
								"Mark as Arrived"
							)}
						</button>
					)}
				</div>
			</div>
			<div className="modal-backdrop" onClick={onClose} />
		</div>
	);
};

export default OrderDetailsModal;
