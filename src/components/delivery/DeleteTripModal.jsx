import React, { useState } from "react";
import { Trash2, AlertTriangle, User, Calendar, Receipt } from "lucide-react";
import useDeliveryTripStore from "../../stores/deliveryTripStore";
import { format } from "date-fns";

const DeleteTripModal = ({ isOpen, trip, onClose, onSuccess }) => {
	const { deleteTrip } = useDeliveryTripStore();
	const [isDeleting, setIsDeleting] = useState(false);

	if (!isOpen || !trip) return null;

	const handleConfirm = async () => {
		setIsDeleting(true);
		const res = await deleteTrip(trip.id);
		setIsDeleting(false);
		if (res.success) {
			if (onSuccess) onSuccess();
			onClose();
		}
	};

	const formattedDate = trip.created_at
		? format(new Date(trip.created_at), "dd MMM yyyy, HH:mm")
		: "Today";

	const orderNumbers =
		trip.orders && trip.orders.length > 0
			? trip.orders.map((o) => `#${o.order_number || o.id.slice(0, 5)}`).join(", ")
			: `${trip.order_count || 1} order(s)`;

	return (
		<div className="modal modal-open z-[100]">
			<div className="modal-box max-w-md bg-base-100 rounded-3xl border border-base-300 shadow-2xl p-6">
				{/* Modal Header */}
				<div className="flex items-center justify-between pb-4 border-b border-base-200">
					<div className="flex items-center gap-3 text-error">
						<div className="p-3 rounded-2xl bg-error/10 text-error">
							<Trash2 className="w-6 h-6" />
						</div>
						<div>
							<h3 className="font-black text-lg text-base-content leading-tight">
								Delete Delivery Trip?
							</h3>
							<p className="text-xs text-base-content/60">
								Permanently removes this trip record
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isDeleting}
						className="btn btn-sm btn-circle btn-ghost">
						✕
					</button>
				</div>

				{/* Trip Summary Details Card */}
				<div className="my-4 p-4 bg-base-200/50 rounded-2xl border border-base-200 space-y-2.5 text-xs">
					<div className="flex justify-between items-center">
						<span className="text-base-content/60 font-semibold flex items-center gap-1.5">
							<User className="w-3.5 h-3.5 text-primary" />
							Staff Member:
						</span>
						<span className="font-black text-sm text-base-content">
							{trip.employees?.name || "Unknown Staff"}
						</span>
					</div>

					<div className="flex justify-between items-center">
						<span className="text-base-content/60 font-semibold flex items-center gap-1.5">
							<Calendar className="w-3.5 h-3.5 text-base-content/60" />
							Date & Time:
						</span>
						<span className="font-bold text-base-content/80">
							{formattedDate}
						</span>
					</div>

					<div className="flex justify-between items-center">
						<span className="text-base-content/60 font-semibold flex items-center gap-1.5">
							<Receipt className="w-3.5 h-3.5 text-base-content/60" />
							Orders Carried:
						</span>
						<span className="font-bold text-base-content/80 truncate max-w-[200px]" title={orderNumbers}>
							{orderNumbers}
						</span>
					</div>

					<div className="flex justify-between items-center pt-1 border-t border-base-200/70">
						<span className="text-base-content/60 font-semibold">
							Trip Payout:
						</span>
						<span className="font-black text-error text-sm">
							฿{Number(trip.trip_fee || 20).toFixed(2)}
						</span>
					</div>
				</div>

				{/* Warning Notice */}
				<div className="bg-error/10 text-error p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border border-error/20 mb-4">
					<AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
					<span className="leading-relaxed">
						Deleting this trip will unassign all linked orders and reset their delivery fee status to unpaid. This action cannot be undone.
					</span>
				</div>

				{/* Modal Actions */}
				<div className="modal-action mt-2 flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="btn btn-ghost btn-sm"
						disabled={isDeleting}>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						className="btn btn-error btn-sm gap-1.5 font-bold shadow-sm"
						disabled={isDeleting}>
						{isDeleting ? (
							<span className="loading loading-spinner loading-xs" />
						) : (
							<Trash2 className="w-4 h-4" />
						)}
						Delete Trip
					</button>
				</div>
			</div>
			<div
				className="modal-backdrop bg-black/60 backdrop-blur-xs"
				onClick={isDeleting ? undefined : onClose}
			/>
		</div>
	);
};

export default DeleteTripModal;
