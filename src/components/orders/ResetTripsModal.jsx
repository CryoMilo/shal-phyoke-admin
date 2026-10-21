import React, { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import useDeliveryTripStore from "../../stores/deliveryTripStore";

const ResetTripsModal = ({ isOpen, onClose, onSuccess }) => {
	const { resetAllTrips } = useDeliveryTripStore();
	const [isResetting, setIsResetting] = useState(false);

	if (!isOpen) return null;

	const handleConfirm = async () => {
		setIsResetting(true);
		const res = await resetAllTrips();
		setIsResetting(false);
		if (res.success) {
			if (onSuccess) onSuccess();
			onClose();
		}
	};

	return (
		<div className="modal modal-open z-[100]">
			<div className="modal-box max-w-md bg-base-100 rounded-3xl border border-base-300 shadow-2xl">
				<div className="flex items-center gap-3 text-error mb-4">
					<div className="p-3 rounded-2xl bg-error/10 text-error">
						<Trash2 className="w-6 h-6" />
					</div>
					<div>
						<h3 className="font-black text-lg text-base-content">
							Reset All Delivery Trips?
						</h3>
						<p className="text-xs text-base-content/60">
							Permanently clears all trip records
						</p>
					</div>
				</div>

				<div className="py-2 text-sm text-base-content/80 space-y-3">
					<p>
						Are you sure you want to delete <strong className="text-error font-bold">all delivery trips</strong> from the database?
					</p>
					<div className="bg-error/10 text-error p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border border-error/20">
						<AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
						<span className="leading-relaxed">
							This will delete all historical and current trip records in the database, and unassign any linked orders. This action cannot be undone.
						</span>
					</div>
				</div>

				<div className="modal-action mt-6 flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="btn btn-ghost btn-sm"
						disabled={isResetting}>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						className="btn btn-error btn-sm gap-1.5 font-bold shadow-sm"
						disabled={isResetting}>
						{isResetting ? (
							<span className="loading loading-spinner loading-xs" />
						) : (
							<Trash2 className="w-4 h-4" />
						)}
						Reset All Trips
					</button>
				</div>
			</div>
			<div
				className="modal-backdrop bg-black/60 backdrop-blur-xs"
				onClick={isResetting ? undefined : onClose}
			/>
		</div>
	);
};

export default ResetTripsModal;
