// components/OrderHistoryTab.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";

const OrderHistoryTab = () => {
	const [orders, setOrders] = useState([]);

	useEffect(() => {
		fetchOrderHistory();
	}, []);

	const fetchOrderHistory = async () => {
		try {
			const { data, error } = await supabase
				.from("orders")
				.select("*")
				.in("order_status", ["completed", "cancelled"])
				.order("created_at", { ascending: false })
				.limit(50);

			if (error) throw error;
			setOrders(data || []);
		} catch (error) {
			console.error("Error fetching order history:", error);
		}
	};

	return (
		<div>
			<h2 className="text-xl font-bold mb-4">Order History</h2>
			<div className="overflow-x-auto">
				<table className="table table-zebra w-full">
					<thead>
						<tr>
							<th>Order #</th>
							<th>Type</th>
							<th>Total</th>
							<th>Status</th>
							<th>Payment</th>
							<th>Time</th>
						</tr>
					</thead>
					<tbody>
						{orders.map((order) => (
							<tr key={order.id}>
								<td className="font-mono">{order.order_number}</td>
								<td>
									<span className="badge badge-ghost">
										{order.order_type === "dine_in"
											? `Dine In${
													order.table_number ? ` (T${order.table_number})` : ""
											  }`
											: order.order_type === "takeaway"
											? "Takeaway"
											: "Delivery"}
									</span>
								</td>
								<td className="font-mono">฿{order.total_amount}</td>
								<td>
									<span
										className={`badge ${
											order.order_status === "completed"
												? "badge-success"
												: order.order_status === "cancelled"
												? "badge-error"
												: "badge-warning"
										}`}>
										{order.order_status}
									</span>
								</td>
								<td>
									<span
										className={`badge ${
											order.payment_status === "paid"
												? "badge-success"
												: "badge-warning"
										}`}>
										{order.payment_status}
									</span>
								</td>
								<td>{new Date(order.created_at).toLocaleTimeString()}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default OrderHistoryTab;
