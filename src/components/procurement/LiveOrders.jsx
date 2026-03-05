// src/components/procurement/LiveOrders.jsx
import React, { useState } from "react";
import { Truck, Clock, ChevronRight } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import ReceiveOrderModal from "./RecieveOrderModal";

const LiveOrders = () => {
	const [selectedOrder, setSelectedOrder] = useState(null);
	const { marketLists } = useProcurementStore();

	const liveOrders = marketLists.filter((list) => list.status === "Ordered");

	if (liveOrders.length === 0) {
		return null;
	}

	return (
		<>
			<div className="card bg-primary/5 border border-primary/20">
				<div className="card-body p-4">
					<h3 className="font-semibold flex items-center gap-2 text-primary">
						<Truck className="w-5 h-5" />
						Live Incoming Orders ({liveOrders.length})
					</h3>

					<div className="space-y-2 mt-3">
						{liveOrders.map((order) => (
							<div
								key={order.id}
								className="flex items-center justify-between p-3 bg-base-100 rounded-lg border">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
										<Truck className="w-4 h-4 text-primary" />
									</div>
									<div>
										<p className="font-medium">
											{order.vendor?.name} - {order.order_number}
										</p>
										<p className="text-xs text-gray-500 flex items-center gap-1">
											<Clock className="w-3 h-3" />
											{new Date(order.created_at).toLocaleTimeString()} •{" "}
											{order.total_items} items
										</p>
									</div>
								</div>

								<button
									onClick={() => setSelectedOrder(order)}
									className="btn btn-primary btn-sm gap-1">
									Arrived
									<ChevronRight className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
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
