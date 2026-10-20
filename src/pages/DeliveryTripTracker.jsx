import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "../components/common/PageHeader";
import {
	Bike,
	Zap,
	Calendar,
	Users,
	PiggyBank,
	ChevronLeft,
	ChevronRight,
	RotateCcw,
	PackageCheck,
	Trash2,
	AlertTriangle,
} from "lucide-react";
import useDeliveryTripStore from "../stores/deliveryTripStore";
import { format, addMonths, subMonths, isToday } from "date-fns";

const DeliveryTripTracker = () => {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const {
		monthlyTrips,
		boltMonthlyOrders,
		fetchMonthlyTrips,
		undoTrip,
		resetAllTrips,
		loading,
	} = useDeliveryTripStore();

	const [undoingTripId, setUndoingTripId] = useState(null);
	const [isResetModalOpen, setIsResetModalOpen] = useState(false);
	const [isResetting, setIsResetting] = useState(false);

	useEffect(() => {
		fetchMonthlyTrips(selectedDate);
	}, [selectedDate, fetchMonthlyTrips]);

	const handlePrevMonth = () => setSelectedDate((prev) => subMonths(prev, 1));
	const handleNextMonth = () => setSelectedDate((prev) => addMonths(prev, 1));

	// Aggregated Staff Statistics
	const staffSummary = useMemo(() => {
		const map = {};

		monthlyTrips.forEach((trip) => {
			const empId = trip.employee_id;
			const empName = trip.employees?.name || "Unknown Staff";
			const position = trip.employees?.position || "Staff";

			if (!map[empId]) {
				map[empId] = {
					id: empId,
					name: empName,
					position,
					tripCount: 0,
					orderCount: 0,
					totalPayout: 0,
				};
			}

			map[empId].tripCount += 1;
			map[empId].orderCount += trip.order_count || 1;
			map[empId].totalPayout += Number(trip.trip_fee || 20);
		});

		return Object.values(map).sort((a, b) => b.totalPayout - a.totalPayout);
	}, [monthlyTrips]);

	// Overall KPIs
	const totalTrips = monthlyTrips.length;
	const totalStaffOrders = monthlyTrips.reduce(
		(sum, t) => sum + (t.order_count || 1),
		0
	);
	const totalPayout = monthlyTrips.reduce(
		(sum, t) => sum + Number(t.trip_fee || 20),
		0
	);
	// Money saved: if staff was paid ฿20 per order vs ฿20 per trip
	const ordersBatched = Math.max(0, totalStaffOrders - totalTrips);
	const moneySaved = ordersBatched * 20;

	const totalBoltOrders = boltMonthlyOrders.length;

	const handleUndoTrip = async (tripId) => {
		setUndoingTripId(tripId);
		const res = await undoTrip(tripId);
		setUndoingTripId(null);
		if (res.success) {
			fetchMonthlyTrips(selectedDate);
		}
	};

	const handleConfirmResetAll = async () => {
		setIsResetting(true);
		const res = await resetAllTrips();
		setIsResetting(false);
		if (res.success) {
			setIsResetModalOpen(false);
			fetchMonthlyTrips(selectedDate);
		}
	};

	return (
		<div className="space-y-6 pb-20">
			{/* Page Header */}
			<PageHeader
				title="Delivery Trips Tracker"
				description="Track in-house staff delivery trips, monthly payouts, and shop delivery savings">
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-2 bg-base-100 p-1 rounded-2xl border border-base-200 shadow-sm">
						<button
							type="button"
							onClick={handlePrevMonth}
							className="btn btn-ghost btn-sm btn-square"
							title="Previous Month">
							<ChevronLeft className="w-4 h-4" />
						</button>
						<span className="font-black text-sm px-3 flex items-center gap-1.5 min-w-[120px] justify-center text-base-content">
							<Calendar className="w-4 h-4 text-primary" />
							{format(selectedDate, "MMMM yyyy")}
						</span>
						<button
							type="button"
							onClick={handleNextMonth}
							className="btn btn-ghost btn-sm btn-square"
							title="Next Month">
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>

					<button
						type="button"
						onClick={() => setIsResetModalOpen(true)}
						className="btn btn-outline btn-error btn-sm gap-1.5 font-bold shadow-sm"
						title="Reset all delivery trips in database">
						<RotateCcw className="w-3.5 h-3.5" />
						<span>Reset All Trips</span>
					</button>
				</div>
			</PageHeader>

			{/* KPI Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
				{/* 1. Total Trips */}
				<div className="card bg-base-100 shadow-sm border border-base-200 p-4">
					<div className="flex items-center justify-between opacity-70 mb-2">
						<span className="text-xs font-bold uppercase tracking-wider">
							Total Trips
						</span>
						<Bike className="w-4 h-4 text-primary" />
					</div>
					<div className="text-2xl font-black text-base-content">
						{totalTrips}
					</div>
					<div className="text-[11px] text-base-content/50 mt-1">
						In-house deliveries
					</div>
				</div>

				{/* 2. Total Orders Delivered */}
				<div className="card bg-base-100 shadow-sm border border-base-200 p-4">
					<div className="flex items-center justify-between opacity-70 mb-2">
						<span className="text-xs font-bold uppercase tracking-wider">
							Orders Delivered
						</span>
						<PackageCheck className="w-4 h-4 text-secondary" />
					</div>
					<div className="text-2xl font-black text-secondary">
						{totalStaffOrders}
					</div>
					<div className="text-[11px] text-base-content/50 mt-1">
						Avg {(totalTrips > 0 ? (totalStaffOrders / totalTrips).toFixed(1) : 0)} orders/trip
					</div>
				</div>

				{/* 3. Total Staff Payout */}
				<div className="card bg-base-100 shadow-sm border border-base-200 p-4">
					<div className="flex items-center justify-between opacity-70 mb-2">
						<span className="text-xs font-bold uppercase tracking-wider">
							Total Payout
						</span>
						<Users className="w-4 h-4 text-info" />
					</div>
					<div className="text-2xl font-black text-info">
						฿{totalPayout.toFixed(2)}
					</div>
					<div className="text-[11px] text-base-content/50 mt-1">
						Trips × ฿20 fee
					</div>
				</div>

				{/* 4. Money Saved by Batching */}
				<div className="card bg-success/10 shadow-sm border border-success/30 p-4">
					<div className="flex items-center justify-between text-success mb-2">
						<span className="text-xs font-black uppercase tracking-wider">
							Cost Saved
						</span>
						<PiggyBank className="w-4 h-4" />
					</div>
					<div className="text-2xl font-black text-success">
						฿{moneySaved.toFixed(2)}
					</div>
					<div className="text-[11px] text-success/70 font-semibold mt-1">
						{ordersBatched} batched orders
					</div>
				</div>

				{/* 5. Bolt Deliveries */}
				<div className="card bg-amber-500/10 shadow-sm border border-amber-500/30 p-4 col-span-2 lg:col-span-1">
					<div className="flex items-center justify-between text-amber-600 mb-2">
						<span className="text-xs font-black uppercase tracking-wider">
							Bolt Orders
						</span>
						<Zap className="w-4 h-4 fill-current" />
					</div>
					<div className="text-2xl font-black text-amber-600">
						{totalBoltOrders}
					</div>
					<div className="text-[11px] text-amber-700/70 font-semibold mt-1">
						External riders (฿0 payout)
					</div>
				</div>
			</div>

			{/* Staff Breakdown Table */}
			<div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
				<div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-200/30">
					<div className="flex items-center gap-2">
						<Users className="w-4 h-4 text-primary" />
						<h3 className="font-black text-base text-base-content">
							Staff Monthly Payout Summary
						</h3>
					</div>
					<span className="badge badge-sm font-bold opacity-60">
						{staffSummary.length} delivering staff
					</span>
				</div>

				<div className="overflow-x-auto">
					<table className="table table-zebra w-full text-sm">
						<thead>
							<tr className="text-xs uppercase tracking-wider text-base-content/60 bg-base-200/50">
								<th>Staff Member</th>
								<th>Position</th>
								<th className="text-center">Total Trips</th>
								<th className="text-center">Orders Carried</th>
								<th className="text-center">Avg / Trip</th>
								<th className="text-right">Total Payout (฿)</th>
							</tr>
						</thead>
						<tbody>
							{loading && staffSummary.length === 0 ? (
								<tr>
									<td colSpan={6} className="text-center py-10">
										<span className="loading loading-spinner text-primary"></span>
									</td>
								</tr>
							) : staffSummary.length === 0 ? (
								<tr>
									<td colSpan={6} className="text-center py-10 text-base-content/40">
										No staff delivery trips recorded for {format(selectedDate, "MMMM yyyy")}
									</td>
								</tr>
							) : (
								staffSummary.map((staff) => (
									<tr key={staff.id} className="hover">
										<td className="font-bold flex items-center gap-2">
											<div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
												{staff.name.slice(0, 2).toUpperCase()}
											</div>
											<span>{staff.name}</span>
										</td>
										<td className="text-xs text-base-content/60">
											{staff.position}
										</td>
										<td className="text-center font-bold">
											{staff.tripCount}
										</td>
										<td className="text-center">
											{staff.orderCount}
										</td>
										<td className="text-center text-xs opacity-70">
											{(staff.orderCount / staff.tripCount).toFixed(1)}
										</td>
										<td className="text-right font-black text-primary text-base">
											฿{staff.totalPayout.toFixed(2)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Detailed Monthly Trip Log */}
			<div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
				<div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-200/30">
					<div className="flex items-center gap-2">
						<Bike className="w-4 h-4 text-secondary" />
						<h3 className="font-black text-base text-base-content">
							Monthly Trip History Log
						</h3>
					</div>
					<span className="badge badge-sm font-bold opacity-60">
						{monthlyTrips.length} records
					</span>
				</div>

				<div className="overflow-x-auto">
					<table className="table table-sm table-zebra w-full text-xs">
						<thead>
							<tr className="uppercase tracking-wider text-base-content/60 bg-base-200/50">
								<th>Date & Time</th>
								<th>Staff</th>
								<th>Order Count</th>
								<th>Order Numbers</th>
								<th>Fee</th>
								<th className="text-right">Action</th>
							</tr>
						</thead>
						<tbody>
							{loading && monthlyTrips.length === 0 ? (
								<tr>
									<td colSpan={6} className="text-center py-8">
										<span className="loading loading-spinner loading-sm text-primary"></span>
									</td>
								</tr>
							) : monthlyTrips.length === 0 ? (
								<tr>
									<td colSpan={6} className="text-center py-8 text-base-content/40">
										No trips recorded for this month
									</td>
								</tr>
							) : (
								monthlyTrips.map((trip) => {
									const tripDate = trip.created_at ? new Date(trip.created_at) : null;
									const tripIsToday = tripDate ? isToday(tripDate) : false;
									const orderNumbers =
										trip.orders && trip.orders.length > 0
											? trip.orders
													.map((o) => `#${o.order_number || o.id.slice(0, 5)}`)
													.join(", ")
											: "—";

									return (
										<tr key={trip.id} className="hover">
											<td className="font-mono text-base-content/70">
												{tripDate ? format(tripDate, "yyyy-MM-dd HH:mm") : "—"}
											</td>
											<td className="font-bold text-base-content">
												{trip.employees?.name || "Unknown"}
											</td>
											<td>
												<span className="badge badge-ghost badge-xs font-bold">
													{trip.order_count || 1}
												</span>
											</td>
											<td className="max-w-[200px] truncate" title={orderNumbers}>
												{orderNumbers}
											</td>
											<td className="font-bold text-success">
												฿{Number(trip.trip_fee || 20).toFixed(2)}
											</td>
											<td className="text-right">
												{tripIsToday && (
													<button
														type="button"
														disabled={undoingTripId === trip.id}
														onClick={() => handleUndoTrip(trip.id)}
														className="btn btn-ghost btn-xs text-error gap-1 hover:bg-error/10"
														title="Undo today's trip">
														<RotateCcw className="w-3 h-3" />
														{undoingTripId === trip.id ? "..." : "Undo"}
													</button>
												)}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Reset All Trips Confirmation Modal */}
			{isResetModalOpen && (
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
								onClick={() => setIsResetModalOpen(false)}
								className="btn btn-ghost btn-sm"
								disabled={isResetting}>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleConfirmResetAll}
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
						onClick={isResetting ? undefined : () => setIsResetModalOpen(false)}
					/>
				</div>
			)}
		</div>
	);
};

export default DeliveryTripTracker;
