// src/components/procurement/OrderStatusTab.jsx
import React, { useEffect } from "react";
import { Clock, Package, Calendar, Eye } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import OrderDetailsModal from "./OrderDetailsModal";

const OrderStatusTab = () => {
	const {
		fetchProcurementOrders,
		selectedOrder,
		setSelectedOrder,
		getOrdersByStatus,
	} = useProcurementStore();

	useEffect(() => {
		fetchProcurementOrders();
	}, []);

	const orderedOrders = getOrdersByStatus("ordered");

	const formatDateTime = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (orderedOrders.length === 0) {
		return (
			<div className="text-center py-12 bg-base-100 rounded-lg border border-base-200">
				<Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
				<p className="text-gray-500 text-lg mb-2">No active orders</p>
				<p className="text-sm text-gray-400">
					Confirmed orders will appear here
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{orderedOrders.map((order) => (
				<div
					key={order.id}
					className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
					<div className="card-body p-5">
						<div className="flex flex-col sm:flex-row justify-between items-start gap-4">
							{/* Left side - Main info */}
							<div className="flex-1">
								<div className="flex items-center gap-3 mb-2">
									<h3 className="font-semibold text-lg">
										{order.vendor?.name}
									</h3>
									<span className="badge badge-primary badge-sm">
										{order.order_number || `ORD-${order.id.slice(0, 8)}`}
									</span>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
									{/* Estimated Arrival */}
									<div className="flex items-center gap-2 text-sm">
										<Calendar className="w-4 h-4 text-gray-500" />
										<span className="text-gray-600">Est. Arrival:</span>
										<span className="font-medium">
											{formatDateTime(order.estimated_arrival)}
										</span>
									</div>

									{/* Items Count */}
									<div className="flex items-center gap-2 text-sm">
										<Package className="w-4 h-4 text-gray-500" />
										<span className="text-gray-600">Items:</span>
										<span className="font-medium">{order.total_items}</span>
									</div>

									{/* Ordered Time */}
									<div className="flex items-center gap-2 text-sm">
										<Clock className="w-4 h-4 text-gray-500" />
										<span className="text-gray-600">Ordered:</span>
										<span className="font-medium">
											{formatDateTime(order.confirmed_at)}
										</span>
									</div>
								</div>

								{order.notes && (
									<p className="text-sm text-gray-500 mt-2 italic">
										Note: {order.notes}
									</p>
								)}
							</div>

							{/* Right side - Action button */}
							<div className="flex items-center gap-2 self-end sm:self-center">
								<button
									onClick={() => setSelectedOrder(order)}
									className="btn btn-primary gap-2">
									<Eye className="w-4 h-4" />
									View Details
								</button>
							</div>
						</div>

						{/* Progress indicator (optional) */}
						<div className="mt-3 pt-3 border-t border-base-200">
							<div className="flex items-center gap-2 text-xs text-gray-500">
								<div className="w-2 h-2 rounded-full bg-warning"></div>
								<span>Awaiting arrival</span>
							</div>
						</div>
					</div>
				</div>
			))}

			{/* Order Details Modal */}
			{selectedOrder && (
				<OrderDetailsModal
					isOpen={!!selectedOrder}
					onClose={() => setSelectedOrder(null)}
					order={selectedOrder}
				/>
			)}
		</div>
	);
};

export default OrderStatusTab;
