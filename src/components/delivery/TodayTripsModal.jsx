import React, { useState, useEffect, useMemo } from "react";
import { X, Bike, RotateCcw } from "lucide-react";
import useDeliveryTripStore from "../../stores/deliveryTripStore";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";

const TodayTripsModal = ({ isOpen, onClose, onTripsChanged }) => {
	const { todayTrips, fetchTodayTrips, undoTrip } = useDeliveryTripStore();
	const { isAdmin } = useAuth();
	const [tripToUndo, setTripToUndo] = useState(null);
	const [isUndoing, setIsUndoing] = useState(false);

	useEffect(() => {
		if (isOpen) {
			fetchTodayTrips();
			setTripToUndo(null);
		}
	}, [isOpen, fetchTodayTrips]);

	// Calculate total trips completed today per staff member
	const staffTripCounts = useMemo(() => {
		const counts = {};
		todayTrips.forEach((trip) => {
			const empId = trip.employee_id;
			if (empId) {
				counts[empId] = (counts[empId] || 0) + 1;
			}
		});
		return counts;
	}, [todayTrips]);

	if (!isOpen) return null;

	const handleConfirmUndo = async (tripId) => {
		setIsUndoing(true);
		const result = await undoTrip(tripId);
		setIsUndoing(false);
		if (result.success) {
			setTripToUndo(null);
			if (onTripsChanged) onTripsChanged();
		}
	};

	return (
		<div className="modal modal-open z-[100]">
			<div className="modal-box max-w-lg p-0 overflow-hidden bg-base-100 rounded-3xl shadow-2xl border border-base-300">
				{/* Header */}
				<div className="p-5 border-b border-base-200 flex justify-between items-center bg-base-200/40">
					<div className="flex items-center gap-2.5">
						<div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
							<Bike className="w-5 h-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="font-black text-lg text-base-content leading-tight">
									Today's Delivery Trips
								</h3>
								<span className="badge badge-secondary badge-sm font-bold">
									{todayTrips.length}
								</span>
							</div>
							<p className="text-xs text-base-content/60">
								Today's recorded delivery trips
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="btn btn-sm btn-circle btn-ghost"
						type="button">
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Body */}
				<div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
					{todayTrips.length === 0 ? (
						<div className="py-10 text-center bg-base-200/30 rounded-2xl border-2 border-dashed border-base-300">
							<p className="text-sm opacity-50 font-medium">
								No staff delivery trips recorded today
							</p>
						</div>
					) : (
						todayTrips.map((trip) => {
							const formattedTime = trip.created_at
								? format(new Date(trip.created_at), "HH:mm")
								: "";
							const isConfirmingThis = tripToUndo === trip.id;
							const personTripCount = staffTripCounts[trip.employee_id] || 1;
							const orderNumbers =
								trip.orders && trip.orders.length > 0
									? trip.orders
											.map((o) => `#${o.order_number || o.id.slice(0, 5)}`)
											.join(", ")
									: `${trip.order_count || 1} order(s)`;

							return (
								<div
									key={trip.id}
									className="p-3.5 bg-base-200/50 rounded-2xl border border-base-200 transition-all hover:border-base-300">
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-start gap-3 min-w-0">
											<div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 text-sm">
												{trip.employees?.name
													? trip.employees.name.slice(0, 2).toUpperCase()
													: "?"}
											</div>
											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<span className="font-black text-sm text-base-content truncate">
														{trip.employees?.name || "Unknown Staff"}
													</span>
													<span className="text-[10px] opacity-40 font-mono">
														{formattedTime}
													</span>
												</div>
												<div className="text-xs text-base-content/70 font-medium mt-0.5 truncate">
													Orders: <span className="font-bold">{orderNumbers}</span>
												</div>
												{trip.notes && (
													<p className="text-[11px] text-base-content/50 italic mt-0.5">
														Note: {trip.notes}
													</p>
												)}
											</div>
										</div>

										<div className="flex flex-col items-end gap-1 shrink-0">
											<div className="flex items-center gap-1.5">
												<span
													className="badge badge-ghost badge-sm font-bold text-xs opacity-75"
													title={`Completed ${personTripCount} trip(s) today`}>
													{personTripCount} {personTripCount === 1 ? "trip" : "trips"}
												</span>
												<span className="badge badge-success badge-sm font-black">
													฿{Number(trip.trip_fee || 20).toFixed(2)}
												</span>
											</div>
											{isAdmin && (
												!isConfirmingThis ? (
													<button
														type="button"
														onClick={() => setTripToUndo(trip.id)}
														className="btn btn-ghost btn-xs text-error gap-1 px-2 hover:bg-error/10">
														<RotateCcw className="w-3 h-3" />
														Undo
													</button>
												) : (
													<div className="flex items-center gap-1 mt-1">
														<button
															type="button"
															disabled={isUndoing}
															onClick={() => handleConfirmUndo(trip.id)}
															className="btn btn-error btn-xs font-bold">
															{isUndoing ? "..." : "Confirm"}
														</button>
														<button
															type="button"
															onClick={() => setTripToUndo(null)}
															className="btn btn-ghost btn-xs">
															Cancel
														</button>
													</div>
												)
											)}
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>

				{/* Footer */}
				<div className="p-4 border-t border-base-200 bg-base-200/30 flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="btn btn-primary btn-sm px-6 font-bold">
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default TodayTripsModal;
