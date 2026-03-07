// src/components/procurement/OrderHistoryTab.jsx
import React, { useEffect, useState } from "react";
import {
	History,
	Package,
	Calendar,
	CheckCircle,
	XCircle,
	Eye,
} from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import OrderDetailsModal from "./OrderDetailsModal";

const OrderHistoryTab = () => {
	const [selectedOrder, setSelectedOrder] = useState(null);
	const { procurementOrders, fetchProcurementOrders } = useProcurementStore();

	useEffect(() => {
		fetchProcurementOrders();
	}, []);

	// Filter for completed orders (arrived or cancelled)
	const completedOrders = procurementOrders.filter(
		(order) => order.status === "arrived" || order.status === "cancelled"
	);

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const getStatusBadge = (status) => {
		switch (status) {
			case "arrived":
				return (
					<span className="badge badge-success gap-1">
						<CheckCircle className="w-3 h-3" /> Arrived
					</span>
				);
			case "cancelled":
				return (
					<span className="badge badge-error gap-1">
						<XCircle className="w-3 h-3" /> Cancelled
					</span>
				);
			default:
				return <span className="badge badge-ghost">{status}</span>;
		}
	};

	if (completedOrders.length === 0) {
		return (
			<div className="text-center py-12 bg-base-100 rounded-lg border border-base-200">
				<History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
				<p className="text-gray-500 text-lg mb-2">No order history</p>
				<p className="text-sm text-gray-400">
					Completed orders will appear here
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{completedOrders.map((order) => (
				<div
					key={order.id}
					className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
					<div className="card-body p-5">
						<div className="flex flex-col sm:flex-row justify-between items-start gap-4">
							{/* Left side - Main info */}
							<div className="flex-1">
								<div className="flex items-center gap-3 mb-2 flex-wrap">
									<h3 className="font-semibold text-lg">
										{order.vendor?.name}
									</h3>
									{getStatusBadge(order.status)}
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
									{/* Order Date */}
									<div className="flex items-center gap-2 text-sm">
										<Calendar className="w-4 h-4 text-gray-500" />
										<span className="text-gray-600">Ordered:</span>
										<span className="font-medium">
											{formatDate(order.created_at)}
										</span>
									</div>

									{/* Completion Date (if arrived) */}
									{order.arrived_at && (
										<div className="flex items-center gap-2 text-sm">
											<CheckCircle className="w-4 h-4 text-green-500" />
											<span className="text-gray-600">Arrived:</span>
											<span className="font-medium">
												{formatDate(order.arrived_at)}
											</span>
										</div>
									)}

									{/* Items Count */}
									<div className="flex items-center gap-2 text-sm">
										<Package className="w-4 h-4 text-gray-500" />
										<span className="text-gray-600">Items:</span>
										<span className="font-medium">{order.total_items}</span>
									</div>
								</div>

								{/* Missed items summary (if any) */}
								{order.items?.some((item) => item.is_missed) && (
									<div className="mt-2 text-sm text-orange-600">
										⚠️ {order.items.filter((item) => item.is_missed).length}{" "}
										item(s) were missed and reordered
									</div>
								)}

								{order.notes && (
									<p className="text-sm text-gray-500 mt-2 italic">
										Note: {order.notes}
									</p>
								)}
							</div>

							{/* Right side - View button */}
							<div className="flex items-center gap-2 self-end sm:self-center">
								<button
									onClick={() => setSelectedOrder(order)}
									className="btn btn-outline btn-sm gap-2">
									<Eye className="w-4 h-4" />
									View Details
								</button>
							</div>
						</div>
					</div>
				</div>
			))}

			{/* Order Details Modal - Read Only */}
			{selectedOrder && (
				<OrderDetailsModal
					isOpen={!!selectedOrder}
					onClose={() => setSelectedOrder(null)}
					order={selectedOrder}
					readOnly={true} // New prop for read-only mode
				/>
			)}
		</div>
	);
};

export default OrderHistoryTab;
