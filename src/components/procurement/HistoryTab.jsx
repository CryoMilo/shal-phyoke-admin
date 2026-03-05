// src/components/procurement/HistoryTab.jsx
import { useEffect, useState } from "react";
import {
	Calendar,
	Filter,
	CheckCircle,
	XCircle,
	AlertCircle,
	Eye,
} from "lucide-react";
import useProcurementStore from "../../stores/useProcurementStore";
import OrderDetailsModal from "./OrderDetailsModal";

const HistoryTab = () => {
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [dateFilter, setDateFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");

	const { marketLists, fetchHistory } = useProcurementStore();

	useEffect(() => {
		fetchHistory();
	}, []);

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

	const filterHistory = () => {
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
	};

	const filteredHistory = filterHistory();

	return (
		<>
			<div className="space-y-4">
				{/* Filters */}
				<div className="flex flex-col sm:flex-row gap-3">
					<div className="flex items-center gap-2">
						<Filter className="w-4 h-4 text-gray-500" />
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="select select-bordered select-sm">
							<option value="all">All Status</option>
							<option value="Arrived">Arrived</option>
							<option value="Cancelled">Cancelled</option>
						</select>
					</div>

					<div className="flex items-center gap-2">
						<Calendar className="w-4 h-4 text-gray-500" />
						<select
							value={dateFilter}
							onChange={(e) => setDateFilter(e.target.value)}
							className="select select-bordered select-sm">
							<option value="all">All Time</option>
							<option value="today">Today</option>
							<option value="week">Last 7 Days</option>
							<option value="month">Last 30 Days</option>
						</select>
					</div>
				</div>

				{/* History List */}
				<div className="space-y-3">
					{filteredHistory.length === 0 ? (
						<div className="text-center py-12 bg-base-200 rounded-lg">
							<Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
							<p className="text-gray-500">No order history found</p>
						</div>
					) : (
						filteredHistory.map((order) => (
							<div
								key={order.id}
								className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
								<div className="card-body p-4">
									<div className="flex items-start justify-between">
										<div className="flex items-start gap-3">
											{getStatusIcon(order.status)}
											<div>
												<h3 className="font-medium">
													{order.vendor?.name} - {order.order_number}
												</h3>
												<p className="text-sm text-gray-600">
													{new Date(order.created_at).toLocaleDateString()} at{" "}
													{new Date(order.created_at).toLocaleTimeString()}
												</p>
												<div className="flex items-center gap-3 mt-2 text-xs">
													<span>{order.total_items} items</span>
													{order.missed_items?.length > 0 && (
														<span className="text-orange-600 flex items-center gap-1">
															<AlertCircle className="w-3 h-3" />
															{order.missed_items.length} missed
														</span>
													)}
												</div>
												{order.notes && (
													<p className="text-xs text-gray-500 mt-2">
														Note: {order.notes}
													</p>
												)}
											</div>
										</div>

										<button
											onClick={() => setSelectedOrder(order)}
											className="btn btn-ghost btn-sm">
											<Eye className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						))
					)}
				</div>
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
