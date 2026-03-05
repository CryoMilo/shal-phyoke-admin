// src/components/procurement/ReceiveOrderModal.jsx
import React, { useState } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";

const ReceiveOrderModal = ({ isOpen, onClose, order }) => {
	const [receivedItems, setReceivedItems] = useState(
		order.items?.reduce((acc, item) => {
			acc[item.id] = true;
			return acc;
		}, {}) || {}
	);
	const [notes, setNotes] = useState("");

	const { updateMarketListStatus } = useProcurementStore();

	if (!isOpen) return null;

	const handleToggleItem = (itemId) => {
		setReceivedItems((prev) => ({
			...prev,
			[itemId]: !prev[itemId],
		}));
	};

	const handleSubmit = async () => {
		const received = order.items.filter((item) => receivedItems[item.id]);
		const missed = order.items.filter((item) => !receivedItems[item.id]);

		await updateMarketListStatus(order.id, "Arrived", received, missed, notes);

		onClose();
	};

	const missedCount =
		order.items?.filter((item) => !receivedItems[item.id]).length || 0;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-2xl relative">
				<button
					onClick={onClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
					<X className="w-4 h-4" />
				</button>

				<h3 className="font-bold text-lg mb-2">
					Receive Order: {order.vendor?.name}
				</h3>
				<p className="text-sm text-gray-500 mb-6">{order.order_number}</p>

				<div className="space-y-4">
					<p className="text-sm text-gray-600">
						Check items that arrived. Unchecked items will be added back to your
						cart.
					</p>

					<div className="space-y-2 max-h-96 overflow-y-auto">
						{order.items?.map((item) => (
							<label
								key={item.id}
								className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
									receivedItems[item.id]
										? "bg-green-50 border-green-200"
										: "bg-orange-50 border-orange-200"
								}`}>
								<input
									type="checkbox"
									checked={receivedItems[item.id]}
									onChange={() => handleToggleItem(item.id)}
									className="checkbox checkbox-sm"
								/>

								<div className="flex-1">
									<p className="font-medium">
										{item.inventory_item?.name || item.custom_item_name}
									</p>
									<p className="text-sm text-gray-600">
										{item.quantity} {item.unit}
										{item.notes && ` • ${item.notes}`}
									</p>
								</div>

								{receivedItems[item.id] ? (
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
							</label>
						))}
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Notes (optional)</span>
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Any issues with the delivery?"
							className="textarea textarea-bordered w-full"
							rows="2"
						/>
					</div>

					{missedCount > 0 && (
						<div className="alert alert-warning">
							<AlertCircle className="w-5 h-5" />
							<span>
								{missedCount} item{missedCount > 1 ? "s" : ""} will be added
								back to your cart.
							</span>
						</div>
					)}
				</div>

				<div className="modal-action">
					<button onClick={onClose} className="btn btn-ghost">
						Cancel
					</button>
					<button onClick={handleSubmit} className="btn btn-primary">
						Confirm Receipt
					</button>
				</div>
			</div>
			<div className="modal-backdrop" onClick={onClose} />
		</div>
	);
};

export default ReceiveOrderModal;
