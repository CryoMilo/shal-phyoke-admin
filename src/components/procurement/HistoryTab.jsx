// src/components/procurement/HistoryTab.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
	Calendar,
	Filter,
	CheckCircle,
	XCircle,
	AlertCircle,
	Eye,
} from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import OrderDetailsModal from "./OrderDetailsModal";

const HistoryTab = () => {
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [dateFilter, setDateFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");

	const { marketLists, fetchHistory } = useProcurementStore();

	useEffect(() => {
		fetchHistory();
	}, []);

	const filteredHistory = useMemo(() => {
		let filtered = marketLists;

		// Filter by status
		if (statusFilter !== "all") {
			filtered = filtered.filter((list) => list.status === statusFilter);
		}

		// Filter by date
		const now = new Date();
		if (dateFilter === "today") {
			const today = now.toDateString();
			filtered = filtered.filter(
				(list) => new Date(list.created_at).toDateString() === today
			);
		} else if (dateFilter === "week") {
			const weekAgo = new Date(now.setDate(now.getDate() - 7));
			filtered = filtered.filter(
				(list) => new Date(list.created_at) >= weekAgo
			);
		} else if (dateFilter === "month") {
			const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
			filtered = filtered.filter(
				(list) => new Date(list.created_at) >= monthAgo
			);
		}

		return filtered;
	}, [marketLists, statusFilter, dateFilter]);

	const getStatusIcon = (status) => {
		switch (status) {
			case "Arrived":
				return <CheckCircle className="w-4 h-4 text-green-500" />;
			case "Cancelled":
				return <XCircle className="w-4 h-4 text-red-500" />;
			default:
				return <AlertCircle className="w-4 h-4 text-gray-500" />;
		}
	};

	const getStatusBadge = (status) => {
		switch (status) {
			case "Arrived":
				return <span className="badge badge-success badge-sm">Arrived</span>;
			case "Cancelled":
				return <span className="badge badge-error badge-sm">Cancelled</span>;
			default:
				return <span className="badge badge-ghost badge-sm">{status}</span>;
		}
	};

	return (
		<>
			{/* Filters */}
			<div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
				<div className="card-body p-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="w-full sm:w-48">
							<div className="flex items-center gap-2 mb-1">
								<Filter className="w-4 h-4 text-gray-500" />
								<span className="text-sm font-medium">Status</span>
							</div>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="select select-bordered w-full">
								<option value="all">All Status</option>
								<option value="Arrived">Arrived</option>
								<option value="Cancelled">Cancelled</option>
							</select>
						</div>

						<div className="w-full sm:w-48">
							<div className="flex items-center gap-2 mb-1">
								<Calendar className="w-4 h-4 text-gray-500" />
								<span className="text-sm font-medium">Date Range</span>
							</div>
							<select
								value={dateFilter}
								onChange={(e) => setDateFilter(e.target.value)}
								className="select select-bordered w-full">
								<option value="all">All Time</option>
								<option value="today">Today</option>
								<option value="week">Last 7 Days</option>
								<option value="month">Last 30 Days</option>
							</select>
						</div>
					</div>
				</div>
			</div>

			{/* History List */}
			<div className="space-y-3">
				{filteredHistory.length === 0 ? (
					<div className="text-center py-12 bg-base-100 rounded-lg border border-base-200">
						<Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
						<p className="text-gray-500 text-lg">No order history found</p>
					</div>
				) : (
					filteredHistory.map((order) => (
						<div
							key={order.id}
							className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
							<div className="card-body p-4">
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-3">
										{getStatusIcon(order.status)}
										<div>
											<div className="flex items-center gap-2 flex-wrap">
												<h3 className="font-medium">
													{order.vendor?.name} - {order.order_number}
												</h3>
												{getStatusBadge(order.status)}
											</div>
											<p className="text-sm text-gray-500 mt-1">
												{new Date(order.created_at).toLocaleDateString()} at{" "}
												{new Date(order.created_at).toLocaleTimeString()}
											</p>
											<div className="flex items-center gap-3 mt-2 text-sm">
												<span>{order.total_items} items</span>
												{order.missed_items?.length > 0 && (
													<span className="text-orange-600 flex items-center gap-1">
														<AlertCircle className="w-3 h-3" />
														{order.missed_items.length} missed
													</span>
												)}
											</div>
											{order.notes && (
												<p className="text-xs text-gray-400 mt-2">
													Note: {order.notes}
												</p>
											)}
										</div>
									</div>

									<button
										onClick={() => setSelectedOrder(order)}
										className="btn btn-ghost btn-sm btn-circle"
										title="View details">
										<Eye className="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>
					))
				)}
			</div>

			{/* Order Details Modal */}
			{selectedOrder && (
				<OrderDetailsModal
					isOpen={!!selectedOrder}
					onClose={() => setSelectedOrder(null)}
					order={selectedOrder}
				/>
			)}
		</>
	);
};

export default HistoryTab;
