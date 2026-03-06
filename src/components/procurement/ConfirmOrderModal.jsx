// src/components/procurement/ConfirmOrderModal.jsx
import React, { useState } from "react";
import { X, Calendar } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import { showToast } from "../../utils/toastUtils";

const ConfirmOrderModal = ({ isOpen, onClose, vendor, items }) => {
	const [estimatedArrival, setEstimatedArrival] = useState(
		// Set default value once, not as defaultValue prop
		(() => {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(10, 0, 0, 0);
			return tomorrow.toISOString().slice(0, 16);
		})()
	);
	const [notes, setNotes] = useState("");
	const [isConfirming, setIsConfirming] = useState(false);

	const { confirmOrder } = useProcurementStore();

	if (!isOpen) return null;

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!estimatedArrival) {
			showToast.error("Please set estimated arrival time");
			return;
		}

		setIsConfirming(true);
		const result = await confirmOrder(
			vendor.id,
			items,
			estimatedArrival,
			notes
		);
		setIsConfirming(false);

		if (result?.success) {
			onClose();
		}
	};

	return (
		<div className="modal modal-open">
			<div className="modal-box relative">
				<button
					onClick={onClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
					<X className="w-4 h-4" />
				</button>

				<h3 className="font-bold text-xl mb-2">Confirm Order</h3>
				<p className="text-gray-600 mb-6">{vendor.name}</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Estimated Arrival - Fixed: only value, no defaultValue */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium flex items-center gap-2">
								<Calendar className="w-4 h-4" />
								Estimated Arrival <span className="text-error">*</span>
							</span>
						</label>
						<input
							type="datetime-local"
							value={estimatedArrival}
							onChange={(e) => setEstimatedArrival(e.target.value)}
							className="input input-bordered w-full"
							min={new Date().toISOString().slice(0, 16)}
							required
						/>
					</div>

					{/* Notes */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Order Notes</span>
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Any special instructions for this order..."
							className="textarea textarea-bordered"
							rows="3"
						/>
					</div>

					{/* Order Summary */}
					<div className="bg-base-200 rounded-lg p-3">
						<p className="font-medium mb-2">Order Summary</p>
						<p className="text-sm">Items: {items.length}</p>
						<p className="text-sm">
							Total Quantity: {items.reduce((sum, i) => sum + i.quantity, 0)}{" "}
							units
						</p>
					</div>

					<div className="modal-action">
						<button type="button" onClick={onClose} className="btn btn-ghost">
							Cancel
						</button>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={isConfirming}>
							{isConfirming ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : (
								"Confirm Order"
							)}
						</button>
					</div>
				</form>
			</div>
			<div className="modal-backdrop" onClick={onClose} />
		</div>
	);
};

export default ConfirmOrderModal;
