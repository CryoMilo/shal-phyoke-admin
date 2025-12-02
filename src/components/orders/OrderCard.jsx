// components/OrderCard.jsx
import { supabase } from "../../services/supabase";

const OrderCard = ({ order, onUpdate }) => {
	const updateOrderStatus = async (newStatus) => {
		try {
			const { error } = await supabase
				.from("orders")
				.update({ order_status: newStatus })
				.eq("id", order.id);

			if (error) throw error;
			onUpdate();
		} catch (error) {
			console.error("Error updating order status:", error);
		}
	};

	return (
		<div className="bg-base-100 border border-base-300 rounded-lg p-4">
			<div className="flex justify-between items-start mb-2">
				<div>
					<h3 className="font-bold font-mono">{order.table_number}</h3>
					<span className="badge badge-ghost badge-sm">
						{order.order_type === "dine_in"
							? `Dine In${order.table_number ? ` T${order.table_number}` : ""}`
							: order.order_type === "takeaway"
							? "Takeaway"
							: "Delivery"}
					</span>
				</div>
				<span
					className={`badge ${
						order.order_status === "ready"
							? "badge-success"
							: order.order_status === "preparing"
							? "badge-warning"
							: "badge-secondary"
					}`}>
					{order.order_status}
				</span>
			</div>

			{order.customer_name && (
				<p className="text-sm mb-2">{order.customer_name}</p>
			)}

			<div className="text-xs space-y-1 mb-3">
				{order.order_items.map((item, index) => (
					<div key={index} className="flex justify-between">
						<span>
							{item.quantity}x {item.name_burmese}
							{item.item_notes?.[item.id] && (
								<span className="text-warning"> *</span>
							)}
						</span>
						<span>฿{item.price * item.quantity}</span>
					</div>
				))}
			</div>

			<div className="flex justify-between items-center border-t pt-2">
				<span className="font-bold">฿{order.total_amount}</span>
				<div className="flex gap-1">
					{order.order_status === "pending" && (
						<button
							className="btn btn-xs btn-primary"
							onClick={() => updateOrderStatus("preparing")}>
							Start
						</button>
					)}
					{order.order_status === "preparing" && (
						<button
							className="btn btn-xs btn-success"
							onClick={() => updateOrderStatus("ready")}>
							Ready
						</button>
					)}
					{order.order_status === "ready" && (
						<button
							className="btn btn-xs btn-secondary"
							onClick={() => updateOrderStatus("completed")}>
							Complete
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default OrderCard;
