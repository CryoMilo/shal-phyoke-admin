// src/components/procurement/ConfirmOrderModal.jsx
import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";

const ConfirmOrderModal = ({ isOpen, onClose, vendor, items }) => {
	const [notes, setNotes] = useState("");
	const [isConfirming, setIsConfirming] = useState(false);

	const { createMarketList } = useProcurementStore();

	if (!isOpen) return null;

	const handleConfirm = async () => {
		setIsConfirming(true);
		try {
			await createMarketList(
				vendor.id,
				items.map((item) => ({
					cart_id: item.id,
					inventory_item_id: item.inventory_item_id,
					custom_item_name: item.custom_item_name,
					quantity: item.quantity,
					unit: item.unit,
					notes: item.notes,
				})),
				notes
			);
			onClose();
		} catch (error) {
			console.error("Failed to confirm order:", error);
		} finally {
			setIsConfirming(false);
		}
	};

	const totalItems = items.length;
	const missedItems = items.filter((item) => item.is_missed).length;

	return (
		<div className="modal modal-open">
			<div className="modal-box relative">
				<button
					onClick={onClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
					<X className="w-4 h-4" />
				</button>

				<h3 className="font-bold text-lg mb-2">
					Confirm Order for {vendor.name}
				</h3>

				<div className="py-4">
					<div className="bg-base-200 rounded-lg p-3 mb-4">
						<p className="text-sm font-medium">Order Summary</p>
						<p className="text-xs text-gray-600 mt-1">
							{totalItems} items • {missedItems} missed from previous orders
						</p>
					</div>

					<div className="space-y-2 max-h-60 overflow-y-auto mb-4">
						{items.map((item) => (
							<div
								key={item.id}
								className={`flex items-center justify-between p-2 rounded-lg ${
									item.is_missed ? "bg-orange-50" : ""
								}`}>
								<div>
									<p className="text-sm font-medium">
										{item.inventory_item?.name || item.custom_item_name}
									</p>
									<p className="text-xs text-gray-600">
										{item.quantity} {item.unit}
									</p>
								</div>
								{item.is_missed && (
									<span className="text-xs text-orange-600 flex items-center gap-1">
										<AlertCircle className="w-3 h-3" />
										Missed
									</span>
								)}
							</div>
						))}
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">
								Order Notes (optional)
							</span>
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Any special instructions for the vendor?"
							className="textarea textarea-bordered"
							rows="2"
						/>
					</div>
				</div>

				<div className="modal-action">
					<button
						onClick={onClose}
						className="btn btn-ghost"
						disabled={isConfirming}>
						Cancel
					</button>
					<button
						onClick={handleConfirm}
						className="btn btn-primary"
						disabled={isConfirming}>
						{isConfirming ? (
							<span className="loading loading-spinner loading-sm"></span>
						) : (
							"Confirm Order"
						)}
					</button>
				</div>
			</div>
			<div className="modal-backdrop" onClick={onClose} />
		</div>
	);
};

export default ConfirmOrderModal;
