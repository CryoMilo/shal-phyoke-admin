import React, { useState, useEffect } from "react";
import { ArrowRightLeft, ArrowRight, User } from "lucide-react";
import useDeliveryTripStore from "../../stores/deliveryTripStore";

const TransferTripModal = ({ isOpen, trip, employees = [], onClose, onSuccess }) => {
	const { transferTrip } = useDeliveryTripStore();
	const [targetEmployeeId, setTargetEmployeeId] = useState("");
	const [isTransferring, setIsTransferring] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setTargetEmployeeId("");
		}
	}, [isOpen, trip]);

	if (!isOpen || !trip) return null;

	const activeEmployees = employees.filter(
		(emp) => emp.is_active && emp.id !== trip.employee_id
	);

	const handleConfirm = async () => {
		if (!targetEmployeeId) return;
		setIsTransferring(true);
		const res = await transferTrip(trip.id, targetEmployeeId);
		setIsTransferring(false);
		if (res.success) {
			if (onSuccess) onSuccess();
			onClose();
		}
	};

	const orderNumbers =
		trip.orders && trip.orders.length > 0
			? trip.orders.map((o) => `#${o.order_number || o.id.slice(0, 5)}`).join(", ")
			: `${trip.order_count || 1} order(s)`;

	return (
		<div className="modal modal-open z-[100]">
			<div className="modal-box max-w-md bg-base-100 rounded-3xl border border-base-300 shadow-2xl p-6">
				{/* Modal Header */}
				<div className="flex items-center justify-between pb-4 border-b border-base-200">
					<div className="flex items-center gap-2.5">
						<div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
							<ArrowRightLeft className="w-5 h-5" />
						</div>
						<div>
							<h3 className="font-black text-lg text-base-content leading-tight">
								Transfer Delivery Trip
							</h3>
							<p className="text-xs text-base-content/60">
								Reassign this trip to another staff member
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isTransferring}
						className="btn btn-sm btn-circle btn-ghost">
						✕
					</button>
				</div>

				{/* Trip Summary Card */}
				<div className="my-4 p-3.5 bg-base-200/50 rounded-2xl border border-base-200 space-y-2 text-xs">
					<div className="flex justify-between items-center">
						<span className="text-base-content/60 font-semibold">
							Currently Assigned To:
						</span>
						<span className="font-black text-sm text-primary">
							{trip.employees?.name || "Unknown"}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-base-content/60 font-semibold">
							Orders Carried:
						</span>
						<span className="font-bold">{orderNumbers}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-base-content/60 font-semibold">
							Trip Fee / Payout:
						</span>
						<span className="font-black text-success">
							฿{Number(trip.trip_fee || 20).toFixed(2)}
						</span>
					</div>
				</div>

				{/* Target Staff Selection */}
				<div className="space-y-2">
					<label className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
						Select New Staff Member:
					</label>
					{activeEmployees.length === 0 ? (
						<div className="py-4 text-center text-xs opacity-50 bg-base-200/40 rounded-xl border border-dashed">
							No other active staff available to transfer to
						</div>
					) : (
						<div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
							{activeEmployees.map((emp) => {
								const isSelected = targetEmployeeId === emp.id;
								return (
									<button
										key={emp.id}
										type="button"
										onClick={() => setTargetEmployeeId(emp.id)}
										className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
											isSelected
												? "bg-primary text-primary-content border-primary shadow-sm"
												: "bg-base-200/60 hover:bg-base-200 border-base-200 text-base-content"
										}`}>
										<div className="flex items-center gap-2.5 min-w-0">
											<div
												className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
													isSelected
														? "bg-primary-content/20 text-primary-content"
														: "bg-base-300 text-base-content/70"
												}`}>
												<User className="w-3.5 h-3.5" />
											</div>
											<div className="truncate">
												<div className="font-bold text-xs truncate">
													{emp.name}
												</div>
												{emp.position && (
													<div
														className={`text-[10px] truncate ${
															isSelected
																? "text-primary-content/80"
																: "text-base-content/50"
														}`}>
														{emp.position}
													</div>
												)}
											</div>
										</div>
										{isSelected && (
											<span className="badge badge-xs bg-primary-content text-primary font-bold">
												Selected
											</span>
										)}
									</button>
								);
							})}
						</div>
					)}
				</div>

				{/* Modal Actions */}
				<div className="modal-action mt-6 flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="btn btn-ghost btn-sm"
						disabled={isTransferring}>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						className="btn btn-primary btn-sm gap-1.5 font-bold shadow-sm"
						disabled={!targetEmployeeId || isTransferring}>
						{isTransferring ? (
							<span className="loading loading-spinner loading-xs" />
						) : (
							<ArrowRight className="w-4 h-4" />
						)}
						Confirm Transfer
					</button>
				</div>
			</div>
			<div
				className="modal-backdrop bg-black/60 backdrop-blur-xs"
				onClick={isTransferring ? undefined : onClose}
			/>
		</div>
	);
};

export default TransferTripModal;
