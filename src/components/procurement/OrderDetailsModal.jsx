// src/components/procurement/OrderDetailsModal.jsx
import { X, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
	if (!isOpen) return null;

	const getStatusBadge = (status) => {
		switch (status) {
			case "Arrived":
				return (
					<span className="badge badge-success gap-1">
						<CheckCircle className="w-3 h-3" /> Arrived
					</span>
				);
			case "Cancelled":
				return (
					<span className="badge badge-error gap-1">
						<XCircle className="w-3 h-3" /> Cancelled
					</span>
				);
			default:
				return (
					<span className="badge badge-ghost gap-1">
						<AlertCircle className="w-3 h-3" /> {status}
					</span>
				);
		}
	};

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-2xl">
				<h3 className="font-bold text-lg flex items-center justify-between">
					<span>Order Details</span>
					{getStatusBadge(order.status)}
				</h3>

				<div className="py-4">
					<div className="bg-base-200 rounded-lg p-3 mb-4">
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="text-gray-500">Vendor</p>
								<p className="font-medium">{order.vendor?.name}</p>
								{order.vendor?.line_id && (
									<p className="text-xs text-gray-500">
										LINE: {order.vendor.line_id}
									</p>
								)}
							</div>
							<div>
								<p className="text-gray-500">Order Number</p>
								<p className="font-medium">{order.order_number}</p>
							</div>
							<div>
								<p className="text-gray-500">Date</p>
								<p>{new Date(order.created_at).toLocaleDateString()}</p>
							</div>
							<div>
								<p className="text-gray-500">Time</p>
								<p>{new Date(order.created_at).toLocaleTimeString()}</p>
							</div>
						</div>
					</div>

					<h4 className="font-medium mb-2">Items</h4>
					<div className="space-y-2 max-h-60 overflow-y-auto">
						{order.items?.map((item) => (
							<div
								key={item.id}
								className={`flex items-center justify-between p-3 rounded-lg border ${
									item.is_missed ? "bg-orange-50 border-orange-200" : ""
								}`}>
								<div className="flex items-center gap-2">
									{item.is_missed && (
										<AlertCircle className="w-4 h-4 text-orange-500" />
									)}
									<div>
										<p className="font-medium">
											{item.inventory_item?.name || item.custom_item_name}
										</p>
										<p className="text-sm text-gray-600">
											{item.quantity} {item.unit}
											{item.notes && ` • ${item.notes}`}
										</p>
									</div>
								</div>
								{item.is_missed && (
									<span className="text-xs text-orange-600">Missed</span>
								)}
							</div>
						))}
					</div>

					{order.missed_items?.length > 0 && (
						<div className="alert alert-warning mt-4">
							<AlertCircle className="w-5 h-5" />
							<span>
								{order.missed_items.length} item(s) were missed and added back
								to cart.
							</span>
						</div>
					)}

					{order.notes && (
						<div className="mt-4">
							<p className="text-sm text-gray-500">Order Notes</p>
							<p className="text-sm bg-base-200 p-2 rounded-lg mt-1">
								{order.notes}
							</p>
						</div>
					)}
				</div>

				<div className="modal-action">
					<button onClick={onClose} className="btn">
						Close
					</button>
				</div>
			</div>
			<div className="modal-backdrop" onClick={onClose} />
		</div>
	);
};

export default OrderDetailsModal;
