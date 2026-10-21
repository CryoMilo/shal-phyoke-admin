import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "../components/common/PageHeader";
import {
	Bike,
	Calendar,
	ChevronLeft,
	ChevronRight,
	PackageCheck,
	User,
	Clock,
	Receipt,
} from "lucide-react";
import useEmployeeStore from "../stores/employeeStore";
import useDeliveryTripStore from "../stores/deliveryTripStore";
import { format, addMonths, subMonths } from "date-fns";

const StaffTripSummary = () => {
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
	const [activeViewTab, setActiveViewTab] = useState("today"); // "today" | "month"

	const { employees, fetchEmployees, loading: employeesLoading } = useEmployeeStore();
	const {
		todayTrips,
		monthlyTrips,
		fetchTodayTrips,
		fetchMonthlyTrips,
		loading: tripsLoading,
	} = useDeliveryTripStore();

	useEffect(() => {
		fetchEmployees();
		fetchTodayTrips();
	}, [fetchEmployees, fetchTodayTrips]);

	useEffect(() => {
		fetchMonthlyTrips(selectedDate);
	}, [selectedDate, fetchMonthlyTrips]);

	const activeEmployees = useMemo(
		() => employees.filter((e) => e.is_active),
		[employees]
	);

	// Auto-select first active employee if none selected
	useEffect(() => {
		if (!selectedEmployeeId && activeEmployees.length > 0) {
			setSelectedEmployeeId(activeEmployees[0].id);
		}
	}, [selectedEmployeeId, activeEmployees]);

	const selectedEmployee = useMemo(
		() => activeEmployees.find((e) => e.id === selectedEmployeeId),
		[activeEmployees, selectedEmployeeId]
	);

	// Filter trips for selected employee
	const staffTodayTrips = useMemo(() => {
		if (!selectedEmployeeId) return [];
		return todayTrips.filter((t) => t.employee_id === selectedEmployeeId);
	}, [todayTrips, selectedEmployeeId]);

	const staffMonthlyTrips = useMemo(() => {
		if (!selectedEmployeeId) return [];
		return monthlyTrips.filter((t) => t.employee_id === selectedEmployeeId);
	}, [monthlyTrips, selectedEmployeeId]);

	// Today's metrics for selected staff
	const todayTripCount = staffTodayTrips.length;
	const todayOrderCount = staffTodayTrips.reduce(
		(sum, t) => sum + (t.order_count || 1),
		0
	);
	const todayPayout = staffTodayTrips.reduce(
		(sum, t) => sum + Number(t.trip_fee || 20),
		0
	);

	// Month's metrics for selected staff
	const monthTripCount = staffMonthlyTrips.length;
	const monthOrderCount = staffMonthlyTrips.reduce(
		(sum, t) => sum + (t.order_count || 1),
		0
	);
	const monthPayout = staffMonthlyTrips.reduce(
		(sum, t) => sum + Number(t.trip_fee || 20),
		0
	);

	const handlePrevMonth = () => setSelectedDate((prev) => subMonths(prev, 1));
	const handleNextMonth = () => setSelectedDate((prev) => addMonths(prev, 1));

	return (
		<div className="space-y-6 pb-20">
			{/* Page Header */}
			<PageHeader
				title="Staff Trip Summary"
				description="Daily and monthly delivery trips record and total earnings">
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
			</PageHeader>

			{/* Staff Member Selector */}
			<div className="bg-base-100 p-4 rounded-3xl border border-base-200 shadow-sm space-y-2">
				<div className="flex items-center justify-between">
					<label className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
						<User className="w-3.5 h-3.5" />
						Select Staff Member
					</label>
					{selectedEmployee && (
						<span className="badge badge-sm badge-ghost font-semibold">
							{selectedEmployee.position || "Staff"}
						</span>
					)}
				</div>

				{employeesLoading && activeEmployees.length === 0 ? (
					<div className="py-4 text-center">
						<span className="loading loading-spinner loading-sm text-primary"></span>
					</div>
				) : activeEmployees.length === 0 ? (
					<div className="text-sm opacity-50 py-3 text-center">
						No active staff members registered
					</div>
				) : (
					<div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
						{activeEmployees.map((emp) => {
							const isSelected = selectedEmployeeId === emp.id;
							// Find today's trip count for quick chip info
							const empTodayTrips = todayTrips.filter(
								(t) => t.employee_id === emp.id
							).length;

							return (
								<button
									key={emp.id}
									type="button"
									onClick={() => setSelectedEmployeeId(emp.id)}
									className={`btn btn-sm rounded-2xl flex items-center gap-2 shrink-0 transition-all ${
										isSelected
											? "btn-primary font-bold shadow-md scale-[1.02]"
											: "btn-ghost bg-base-200/60 hover:bg-base-200 text-base-content font-medium"
									}`}>
									<div
										className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
											isSelected
												? "bg-primary-content text-primary"
												: "bg-base-300 text-base-content"
										}`}>
										{emp.name.slice(0, 1).toUpperCase()}
									</div>
									<span>{emp.name}</span>
									{empTodayTrips > 0 && (
										<span
											className={`badge badge-xs font-bold ${
												isSelected
													? "bg-primary-content/20 text-primary-content"
													: "badge-secondary"
											}`}>
											{empTodayTrips} today
										</span>
									)}
								</button>
							);
						})}
					</div>
				)}
			</div>

			{/* Hero Collective Metrics for Selected Staff */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* 1. Today's Box */}
				<div className="card bg-gradient-to-br from-primary/10 via-base-100 to-base-100 shadow-sm border-2 border-primary/20 p-5 rounded-3xl">
					<div className="flex items-center justify-between pb-3 border-b border-base-200/60 mb-4">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-xl bg-primary text-primary-content flex items-center justify-center font-bold">
								<Clock className="w-4 h-4" />
							</div>
							<div>
								<h3 className="font-black text-sm text-base-content uppercase tracking-wider">
									Today's Trips
								</h3>
								<p className="text-[11px] text-base-content/50">
									{format(new Date(), "EEEE, dd MMM yyyy")}
								</p>
							</div>
						</div>
						<div className="text-right">
							<span className="text-[10px] uppercase font-bold text-base-content/50 block">
								Today's Earnings
							</span>
							<span className="text-2xl font-black text-primary">
								฿{todayPayout.toFixed(2)}
							</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3 text-center">
						<div className="bg-base-200/50 p-3 rounded-2xl border border-base-200">
							<span className="text-xs font-bold text-base-content/60 block mb-0.5">
								Trips Completed
							</span>
							<span className="text-2xl font-black text-base-content flex items-center justify-center gap-1">
								<Bike className="w-5 h-5 text-primary" />
								{todayTripCount}
							</span>
						</div>
						<div className="bg-base-200/50 p-3 rounded-2xl border border-base-200">
							<span className="text-xs font-bold text-base-content/60 block mb-0.5">
								Orders Delivered
							</span>
							<span className="text-2xl font-black text-base-content flex items-center justify-center gap-1">
								<PackageCheck className="w-5 h-5 text-secondary" />
								{todayOrderCount}
							</span>
						</div>
					</div>
				</div>

				{/* 2. This Month's Box */}
				<div className="card bg-gradient-to-br from-secondary/10 via-base-100 to-base-100 shadow-sm border-2 border-secondary/20 p-5 rounded-3xl">
					<div className="flex items-center justify-between pb-3 border-b border-base-200/60 mb-4">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-xl bg-secondary text-secondary-content flex items-center justify-center font-bold">
								<Calendar className="w-4 h-4" />
							</div>
							<div>
								<h3 className="font-black text-sm text-base-content uppercase tracking-wider">
									Monthly Total
								</h3>
								<p className="text-[11px] text-base-content/50">
									{format(selectedDate, "MMMM yyyy")}
								</p>
							</div>
						</div>
						<div className="text-right">
							<span className="text-[10px] uppercase font-bold text-base-content/50 block">
								Month Total Payout
							</span>
							<span className="text-2xl font-black text-secondary">
								฿{monthPayout.toFixed(2)}
							</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3 text-center">
						<div className="bg-base-200/50 p-3 rounded-2xl border border-base-200">
							<span className="text-xs font-bold text-base-content/60 block mb-0.5">
								Total Trips
							</span>
							<span className="text-2xl font-black text-base-content flex items-center justify-center gap-1">
								<Bike className="w-5 h-5 text-secondary" />
								{monthTripCount}
							</span>
						</div>
						<div className="bg-base-200/50 p-3 rounded-2xl border border-base-200">
							<span className="text-xs font-bold text-base-content/60 block mb-0.5">
								Orders Delivered
							</span>
							<span className="text-2xl font-black text-base-content flex items-center justify-center gap-1">
								<PackageCheck className="w-5 h-5 text-primary" />
								{monthOrderCount}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Trip Log Section with Tabs */}
			<div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl overflow-hidden">
				<div className="p-4 border-b border-base-200 flex flex-wrap justify-between items-center gap-2 bg-base-200/30">
					<div className="flex items-center gap-2">
						<Receipt className="w-4 h-4 text-primary" />
						<h3 className="font-black text-base text-base-content">
							Delivery Trips History
						</h3>
						{selectedEmployee && (
							<span className="text-xs text-base-content/60 font-medium hidden sm:inline">
								• {selectedEmployee.name}
							</span>
						)}
					</div>

					{/* Tab switcher: Today vs Month */}
					<div className="join bg-base-200 p-0.5 rounded-xl border border-base-300">
						<button
							type="button"
							onClick={() => setActiveViewTab("today")}
							className={`join-item btn btn-xs rounded-lg font-bold ${
								activeViewTab === "today"
									? "btn-primary shadow-xs"
									: "btn-ghost opacity-70"
							}`}>
							Today ({todayTripCount})
						</button>
						<button
							type="button"
							onClick={() => setActiveViewTab("month")}
							className={`join-item btn btn-xs rounded-lg font-bold ${
								activeViewTab === "month"
									? "btn-primary shadow-xs"
									: "btn-ghost opacity-70"
							}`}>
							This Month ({monthTripCount})
						</button>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="table table-sm table-zebra w-full text-xs">
						<thead>
							<tr className="uppercase tracking-wider text-base-content/60 bg-base-200/50">
								<th>Time / Date</th>
								<th>Orders Carried</th>
								<th>Order Numbers</th>
								<th>Notes</th>
								<th className="text-right">Trip Fee</th>
							</tr>
						</thead>
						<tbody>
							{tripsLoading ? (
								<tr>
									<td colSpan={5} className="text-center py-10">
										<span className="loading loading-spinner text-primary"></span>
									</td>
								</tr>
							) : (activeViewTab === "today" ? staffTodayTrips : staffMonthlyTrips)
									.length === 0 ? (
								<tr>
									<td colSpan={5} className="text-center py-12 text-base-content/40">
										<p className="font-semibold text-sm">
											No trips recorded for this period
										</p>
										<p className="text-xs mt-0.5">
											{activeViewTab === "today"
												? "No delivery trips recorded today yet."
												: `No trips found for ${format(selectedDate, "MMMM yyyy")}.`}
										</p>
									</td>
								</tr>
							) : (
								(activeViewTab === "today" ? staffTodayTrips : staffMonthlyTrips).map(
									(trip) => {
										const tripDate = trip.created_at
											? new Date(trip.created_at)
											: null;
										const timeStr = tripDate
											? activeViewTab === "today"
												? format(tripDate, "HH:mm")
												: format(tripDate, "dd MMM yyyy, HH:mm")
											: "—";

										const orderNumbers =
											trip.orders && trip.orders.length > 0
												? trip.orders
														.map((o) => `#${o.order_number || o.id.slice(0, 5)}`)
														.join(", ")
												: "—";

										return (
											<tr key={trip.id} className="hover">
												<td className="font-mono font-medium text-base-content/80 whitespace-nowrap">
													{timeStr}
												</td>
												<td>
													<span className="badge badge-ghost badge-sm font-bold">
														{trip.order_count || 1} order(s)
													</span>
												</td>
												<td className="font-medium max-w-[240px] truncate" title={orderNumbers}>
													{orderNumbers}
												</td>
												<td className="text-base-content/50 italic max-w-[150px] truncate">
													{trip.notes || "—"}
												</td>
												<td className="text-right font-black text-sm text-success whitespace-nowrap">
													฿{Number(trip.trip_fee || 20).toFixed(2)}
												</td>
											</tr>
										);
									}
								)
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default StaffTripSummary;
