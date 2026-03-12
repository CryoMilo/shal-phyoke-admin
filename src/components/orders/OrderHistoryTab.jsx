// components/OrderHistoryTab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../services/supabase";
import {
	Search,
	Receipt,
	User,
	Clock,
	CheckCircle2,
	MoreVertical,
	Eye,
} from "lucide-react";

const OrderHistoryTab = () => {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedOrder, setSelectedOrder] = useState(null);

	useEffect(() => {
		fetchHistory();

		const channel = supabase
			.channel("orders:changes", { config: { private: false } })
			.on("broadcast", { event: "UPDATE" }, () => fetchHistory())
			.on("broadcast", { event: "INSERT" }, () => fetchHistory())
			.on("broadcast", { event: "DELETE" }, () => fetchHistory())
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	const fetchHistory = async () => {
		try {
			const { data, error } = await supabase
				.from("orders")
				.select("*")
				.eq("pos_order_status", "completed")
				.order("created_at", { ascending: false })
				.limit(100);

			if (error) throw error;
			setOrders(data || []);
		} catch (error) {
			console.error("Error fetching history:", error);
		} finally {
			setLoading(false);
		}
	};

	const filteredOrders = useMemo(() => {
		return orders.filter(
			(o) =>
				o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				o.table_number?.toString().includes(searchTerm)
		);
	}, [orders, searchTerm]);

	return (
		<div className="space-y-4">
			{/* Header & Search */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<h2 className="text-xl font-bold">Order History (Completed)</h2>
				<div className="relative w-full md:w-72">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
					<input
						type="text"
						placeholder="Search order, name, table..."
						className="input input-bordered input-sm w-full pl-10"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			{/* Table Card */}
			<div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<table className="table table-sm w-full">
						<thead className="bg-base-200/50">
							<tr>
								<th className="font-bold">Order</th>
								<th className="font-bold">Table/Type</th>
								<th className="font-bold">Customer</th>
								<th className="font-bold">Total</th>
								<th className="font-bold">Payment</th>
								<th className="font-bold">Time</th>
								<th className="font-bold text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan="7" className="text-center py-10">
										<span className="loading loading-spinner loading-md"></span>
									</td>
								</tr>
							) : filteredOrders.length > 0 ? (
								filteredOrders.map((order) => (
									<tr
										key={order.id}
										className="hover:bg-base-200/30 transition-colors">
										<td className="font-mono font-bold text-[10px]">
											#{order.order_number?.slice(-6) || order.id.slice(0, 4)}
										</td>
										<td>
											<div className="flex items-center gap-2">
												<span
													className={`badge badge-xs font-bold ${
														order.order_type === "dine_in"
															? "badge-primary"
															: "badge-secondary"
													}`}>
													{order.order_type === "dine_in" ? "DINE" : "TA"}
												</span>
												{order.table_number && (
													<span className="font-bold text-sm">
														T-{order.table_number}
													</span>
												)}
											</div>
										</td>
										<td>
											<span className="text-sm">
												{order.customer_name || "—"}
											</span>
										</td>
										<td className="font-bold">฿{order.total_amount}</td>
										<td>
											<span className="badge badge-outline badge-success badge-xs font-bold uppercase p-2">
												{order.payment_method || "Paid"}
											</span>
										</td>
										<td>
											<div className="text-[10px] opacity-60">
												{new Date(order.created_at).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</div>
										</td>
										<td className="text-right">
											<button
												className="btn btn-ghost btn-xs"
												onClick={() => setSelectedOrder(order)}>
												<Eye className="w-3.5 h-3.5" />
											</button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="7" className="text-center py-20 opacity-50">
										No completed orders found
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Detailed View Modal */}
			{selectedOrder && (
				<div className="modal modal-open">
					<div className="modal-box max-w-lg p-0 overflow-hidden">
						<div className="p-4 bg-base-200 border-b border-base-300 flex justify-between items-center">
							<h3 className="font-bold">Order Details</h3>
							<button
								className="btn btn-sm btn-circle btn-ghost"
								onClick={() => setSelectedOrder(null)}>
								✕
							</button>
						</div>

						<div className="p-6 space-y-4">
							<div className="flex justify-between items-start">
								<div>
									<div className="text-xs font-bold opacity-40 uppercase">
										Order Number
									</div>
									<div className="font-mono font-bold text-lg">
										#{selectedOrder.order_number}
									</div>
								</div>
								<div className="text-right">
									<div className="text-xs font-bold opacity-40 uppercase">
										Status
									</div>
									<div className="badge badge-success gap-1 font-bold">
										<CheckCircle2 className="w-3 h-3" /> COMPLETED
									</div>
								</div>
							</div>

							<div className="divider my-0"></div>

							<div className="space-y-3">
								<h4 className="text-xs font-bold opacity-40 uppercase">
									Items
								</h4>
								{selectedOrder.order_items.map((item, idx) => (
									<div key={idx} className="flex flex-col gap-1">
										<div className="flex justify-between text-sm">
											<span className="font-medium">
												{item.quantity}x {item.name_burmese}
											</span>
											<span className="font-mono">
												฿{(item.final_price || item.price) * item.quantity}
											</span>
										</div>
										{(item.note ||
											selectedOrder.item_notes?.[item.cart_id]) && (
											<div className="ml-4 text-[10px] opacity-60 italic">
												{item.note || selectedOrder.item_notes?.[item.cart_id]}
											</div>
										)}
									</div>
								))}
							</div>

							<div className="divider my-0"></div>

							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="opacity-60">Subtotal</span>
									<span className="font-mono text-sm">
										฿{selectedOrder.subtotal}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="opacity-60">Discount</span>
									<span className="font-mono text-sm text-error">
										-฿{selectedOrder.discount_amount}
									</span>
								</div>
								<div className="flex justify-between font-bold text-lg pt-2">
									<span>Total</span>
									<span className="text-primary">
										฿{selectedOrder.total_amount}
									</span>
								</div>
							</div>

							<div className="bg-base-200 p-3 rounded-lg grid grid-cols-2 gap-4">
								<div>
									<div className="text-[10px] font-bold opacity-40 uppercase mb-1">
										Payment Method
									</div>
									<div className="text-sm font-bold flex items-center gap-2">
										<CheckCircle2 className="w-4 h-4 text-success" />
										{selectedOrder.payment_method?.toUpperCase()}
									</div>
								</div>
								<div>
									<div className="text-[10px] font-bold opacity-40 uppercase mb-1">
										Order Time
									</div>
									<div className="text-sm font-bold flex items-center gap-2">
										<Clock className="w-4 h-4 opacity-40" />
										{new Date(selectedOrder.created_at).toLocaleString()}
									</div>
								</div>
							</div>
						</div>
						<div className="p-4 bg-base-100 border-t border-base-300 flex justify-end">
							<button
								className="btn btn-sm"
								onClick={() => setSelectedOrder(null)}>
								Close
							</button>
						</div>
					</div>
					<div
						className="modal-backdrop bg-black/50"
						onClick={() => setSelectedOrder(null)}></div>
				</div>
			)}
		</div>
	);
};

export default OrderHistoryTab;
