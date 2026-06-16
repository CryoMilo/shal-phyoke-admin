// components/OrderCard.jsx
import { supabase } from "../../services/supabase";
import PrintKitchenTicketButton from "./PrintKitchenTicketButton";
import { MapPin } from "lucide-react";

const OrderCard = ({ order, onUpdate }) => {
	const updateOrderStatus = async (newStatus) => {
		try {
			const { error } = await supabase
				.from("orders")
				.update({ pos_order_status: newStatus })
				.eq("id", order.id);

			if (error) throw error;
			onUpdate();
		} catch (error) {
			console.error("Error updating order status:", error);
		}
	};

	return (
		<div className="bg-base-100 border border-base-300 rounded-lg p-4 shadow-sm">
			<div className="flex justify-between items-start mb-2">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<h3 className="font-bold font-mono">
							{order.order_type === "dine_in"
								? `Table ${order.table_number}`
								: order.order_number || `#${order.id.slice(0, 8)}`}
						</h3>
						<PrintKitchenTicketButton order={order} size="xs" />
					</div>
					<span className="badge badge-ghost badge-sm w-fit">
						{order.order_type === "dine_in"
							? `Dine In${order.table_number ? ` T${order.table_number}` : ""}`
							: order.order_type === "takeaway"
							? "Takeaway"
							: "Delivery"}
					</span>
				</div>
				<span
					className={`badge ${
						order.pos_order_status === "ready"
							? "badge-success"
							: order.pos_order_status === "preparing"
							? "badge-warning"
							: "badge-secondary"
					}`}>
					{order.pos_order_status}
				</span>
			</div>

			{order.customer_name && (
				<p className="text-sm font-bold mb-1">{order.customer_name}</p>
			)}
			{order.order_type === "delivery" && (
				<div className="text-[11px] space-y-1 mb-3 bg-base-200/50 p-2 rounded">
					{order.delivery_address && (
						<div className="flex items-start gap-2">
							<MapPin className="w-3 h-3 opacity-50 mt-0.5" />
							<span>{order.delivery_address}</span>
						</div>
					)}
				</div>
			)}

			<div className="text-xs space-y-1 mb-3">
				{order.order_items.map((item, index) => (
					<div key={index} className="flex justify-between">
						<span>
							{item.quantity}x {item.name_burmese || item.name_english}
							{order.item_notes?.[item.cart_id] && (
								<span className="text-warning"> *</span>
							)}
						</span>
						<span>฿{(item.final_price || item.price) * item.quantity}</span>
					</div>
				))}
			</div>

			<div className="flex justify-between items-center border-t pt-2">
				<span className="font-bold">฿{order.total_amount}</span>
				<div className="flex gap-1">
					{order.pos_order_status === "pending" && (
						<button
							className="btn btn-xs btn-primary"
							onClick={() => updateOrderStatus("preparing")}>
							Start
						</button>
					)}
					{order.pos_order_status === "preparing" && (
						<button
							className="btn btn-xs btn-success"
							onClick={() => updateOrderStatus("ready")}>
							Ready
						</button>
					)}
					{order.pos_order_status === "ready" && (
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
