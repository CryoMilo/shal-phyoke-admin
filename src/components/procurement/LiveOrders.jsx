// src/components/procurement/LiveOrders.jsx
import { useState } from "react";
import { Truck, Clock, AlertCircle, ChevronRight } from "lucide-react";
import useProcurementStore from "../../stores/useProcurementStore";
import ReceiveOrderModal from "./RecieveOrderModal";

const LiveOrders = () => {
	const [selectedOrder, setSelectedOrder] = useState(null);
	const { marketLists } = useProcurementStore();

	// Filter only 'Ordered' status orders
	const liveOrders = marketLists.filter((list) => list.status === "Ordered");

	const getStatusIcon = () => {
		// You can add logic here for different statuses if needed
		return <Truck className="w-4 h-4" />;
	};

	const getStatusColor = () => {
		// Default styling
		return "bg-blue-50 border-blue-200";
	};

	if (liveOrders.length === 0) {
		return null; // Don't show section if no live orders
	}

	return (
		<>
			<div className="bg-base-200 rounded-lg p-4">
				<h3 className="font-semibold mb-3 flex items-center gap-2">
					<Truck className="w-5 h-5" />
					Live Incoming Orders ({liveOrders.length})
				</h3>

				<div className="space-y-2">
					{liveOrders.map((order) => (
						<div
							key={order.id}
							className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(
								order
							)}`}>
							<div className="flex items-center gap-3">
								{getStatusIcon(order)}
								<div>
									<p className="font-medium">
										{order.vendor?.name} - {order.order_number}
									</p>
									<p className="text-sm text-gray-600">
										{order.total_items} items • {order.notes || "No notes"}
									</p>
								</div>
							</div>

							<button
								onClick={() => setSelectedOrder(order)}
								className="btn btn-primary btn-sm gap-2">
								Arrived
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					))}
				</div>
			</div>

			{/* Receive Order Modal */}
			{selectedOrder && (
				<ReceiveOrderModal
					isOpen={!!selectedOrder}
					onClose={() => setSelectedOrder(null)}
					order={selectedOrder}
				/>
			)}
		</>
	);
};

export default LiveOrders;
