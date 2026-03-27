// components/ActiveOrdersTab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../services/supabase";
import {
	Users,
	Clock,
	Receipt,
	CheckCircle2,
	CreditCard,
	Banknote,
} from "lucide-react";
import { showToast } from "../../utils/toastUtils";

const ActiveOrdersTab = () => {
	const [activeOrders, setActiveOrders] = useState([]);
	const [selectedTableId, setSelectedTableId] = useState(null);

	useEffect(() => {
		fetchActiveOrders();

		const channel = supabase
			.channel("orders:changes", { config: { private: false } })
			.on("broadcast", { event: "INSERT" }, () => fetchActiveOrders())
			.on("broadcast", { event: "UPDATE" }, () => fetchActiveOrders())
			.on("broadcast", { event: "DELETE" }, () => fetchActiveOrders())
			.subscribe((status) => {
				console.log("Active Orders Realtime status:", status);
			});

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	const fetchActiveOrders = async () => {
		try {
			const { data, error } = await supabase
				.from("orders")
				.select("*")
				.in("pos_order_status", ["pending", "preparing", "ready"])
				.order("created_at", { ascending: true });

			if (error) throw error;
			setActiveOrders(data || []);
		} catch (error) {
			console.error("Error fetching active orders:", error);
			showToast.error("Failed to load active orders");
		}
	};

	const tableGroups = useMemo(() => {
		const groups = {};
		activeOrders.forEach((order) => {
			const key =
				order.order_type === "dine_in"
					? order.table_number || "Unknown"
					: "Takeaway";
			if (!groups[key]) {
				groups[key] = {
					id: key,
					isDineIn: order.order_type === "dine_in",
					orders: [],
					total: 0,
					unpaidCount: 0,
					oldestOrder: null,
				};
			}
			groups[key].orders.push(order);
			groups[key].total += Number(order.total_amount);
			if (order.payment_status === "unpaid") groups[key].unpaidCount++;

			const orderTime = new Date(order.created_at);
			if (
				!groups[key].oldestOrder ||
				orderTime < new Date(groups[key].oldestOrder)
			) {
				groups[key].oldestOrder = order.created_at;
			}
		});
		return Object.values(groups).sort((a, b) => {
			if (a.id === "Takeaway") return 1;
			if (b.id === "Takeaway") return -1;
			return Number(a.id) - Number(b.id);
		});
	}, [activeOrders]);

	const currentTableData = useMemo(() => {
		return tableGroups.find((g) => g.id === selectedTableId);
	}, [tableGroups, selectedTableId]);

	const getTimeElapsed = (startTime) => {
		const diff = Math.floor((new Date() - new Date(startTime)) / 60000);
		return `${diff}m`;
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-bold">Active Tables & Bills</h2>
				<div className="flex gap-2">
					<span className="badge badge-warning gap-1 p-3">
						{activeOrders.filter((o) => o.payment_status === "unpaid").length}{" "}
						Unpaid
					</span>
					<span className="badge badge-neutral gap-1 p-3">
						{tableGroups.length} Active Hubs
					</span>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
				{tableGroups.map((group) => (
					<div
						key={group.id}
						className="card bg-base-100 border border-base-300 hover:border-primary transition-all cursor-pointer shadow-sm"
						onClick={() => setSelectedTableId(group.id)}>
						<div className="card-body p-4">
							<div className="flex justify-between items-start">
								<div
									className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg 
									${
										group.isDineIn
											? "bg-primary text-primary-content"
											: "bg-secondary text-secondary-content"
									}`}>
									{group.isDineIn ? group.id : "TA"}
								</div>
								<div className="text-right">
									<div className="text-[10px] opacity-50 flex items-center justify-end gap-1 font-bold">
										<Clock className="w-3 h-3" />{" "}
										{getTimeElapsed(group.oldestOrder)}
									</div>
									{group.unpaidCount > 0 && (
										<span className="text-[10px] text-error font-bold uppercase">
											Pending Pay
										</span>
									)}
								</div>
							</div>

							<div className="mt-4 space-y-1">
								<div className="flex justify-between text-sm">
									<span className="opacity-60">Bills</span>
									<span className="font-bold">{group.orders.length}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="opacity-60">Total</span>
									<span className="font-bold text-primary">
										฿{group.total.toFixed(2)}
									</span>
								</div>
							</div>

							<div className="card-actions justify-end mt-4">
								<button className="btn btn-xs btn-ghost no-animation opacity-50">
									View Details
								</button>
							</div>
						</div>
					</div>
				))}

				{tableGroups.length === 0 && (
					<div className="col-span-full py-12 text-center rounded-xl">
						<Receipt className="w-12 h-12 mx-auto opacity-20 mb-2" />
						<p className="opacity-50 font-medium">
							No active tables or takeaway orders
						</p>
					</div>
				)}
			</div>

			{currentTableData && (
				<TableBillsModal
					table={currentTableData}
					onClose={() => setSelectedTableId(null)}
					onUpdate={fetchActiveOrders}
				/>
			)}
		</div>
	);
};

const TableBillsModal = ({ table, onClose, onUpdate }) => {
	const [confirmAction, setConfirmAction] = useState(null);
	const [processingOrders, setProcessingOrders] = useState(new Set());

	const handleCompleteOrder = async (orderId) => {
		// Prevent multiple clicks
		if (processingOrders.has(orderId)) return;

		setProcessingOrders((prev) => new Set(prev).add(orderId));

		try {
			// First, get the order details with menu items
			const { data: order, error: fetchError } = await supabase
				.from("orders")
				.select("*")
				.eq("id", orderId)
				.single();

			if (fetchError) throw fetchError;

			// Get all menu items to get their categories
			const menuItemIds = order.order_items.map((item) => item.id);
			const { data: menuItems, error: menuError } = await supabase
				.from("menu_items")
				.select("id, category")
				.in("id", menuItemIds);

			if (menuError) throw menuError;

			// Create a map of menu item categories
			const categoryMap = {};
			menuItems.forEach((item) => {
				categoryMap[item.id] = item.category;
			});

			// Prepare sales records for each menu item
			const salesRecords = order.order_items.map((item) => {
				// Get the category and ensure it's a valid enum value
				const category = categoryMap[item.id];

				// If the category isn't a valid enum value, you might need to map it
				// Check what values are in your menu_category enum
				const validCategory = category; // Ensure this matches one of your enum values

				return {
					sale_date: new Date().toISOString().split("T")[0],
					sale_timestamp: new Date().toISOString(),
					menu_item_id: item.id,
					menu_item_name_burmese: item.name_burmese,
					menu_item_name_english: item.name_english || null,
					menu_item_category: validCategory, // This must match the enum type
					menu_item_price: item.price,
					quantity_sold: item.quantity,
					total_revenue: (item.final_price || item.price) * item.quantity,
					order_id: order.id,
					order_number: order.order_number,
					order_type: order.order_type,
					payment_method: order.payment_method,
					payment_status: order.payment_status,
				};
			});

			// Insert sales records
			const { error: salesError } = await supabase
				.from("monthly_sales")
				.insert(salesRecords);

			if (salesError) throw salesError;

			// Update order status to completed
			const { error: updateError } = await supabase
				.from("orders")
				.update({ pos_order_status: "completed" })
				.eq("id", orderId);

			if (updateError) throw updateError;

			showToast.success("Order completed and recorded successfully");
			onUpdate();
		} catch (error) {
			console.error("Error completing order:", error);

			// Handle specific error types
			if (error.code === "42804") {
				showToast.error(
					"Category type mismatch. Please check menu categories."
				);
				console.error("Category mapping issue:", error);
			} else {
				showToast.error(
					"Failed to complete order: " + (error.message || "Unknown error")
				);
			}
		} finally {
			setProcessingOrders((prev) => {
				const newSet = new Set(prev);
				newSet.delete(orderId);
				return newSet;
			});
		}
	};

	const handleAction = async (orderId, updates) => {
		try {
			// If this is a payment update, just update the order
			if (updates.payment_status === "paid") {
				const { error } = await supabase
					.from("orders")
					.update(updates)
					.eq("id", orderId);

				if (error) throw error;
				showToast.success("Payment recorded successfully");
				onUpdate();
			}
			// If this is cancel/refund
			else if (
				updates.pos_order_status === "cancelled" ||
				updates.pos_order_status === "refunded"
			) {
				const { error } = await supabase
					.from("orders")
					.update(updates)
					.eq("id", orderId);

				if (error) throw error;
				showToast.success(
					`Order ${
						updates.pos_order_status === "cancelled" ? "cancelled" : "refunded"
					} successfully`
				);
				onUpdate();
			}
		} catch (error) {
			console.error("Error updating order:", error);
			showToast.error("Update failed: " + (error.message || "Unknown error"));
		}
	};

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-4xl p-0 overflow-hidden bg-base-200">
				<div className="p-4 bg-base-100 border-b border-base-300 flex justify-between items-center">
					<div className="flex items-center gap-3">
						<div className="badge badge-primary badge-lg p-4 font-bold">
							{table.isDineIn ? `Table ${table.id}` : "Takeaway Hub"}
						</div>
						<div className="text-sm opacity-60 font-medium">
							{table.orders.length} Bills • Total ฿{table.total.toFixed(2)}
						</div>
					</div>
					<button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
						✕
					</button>
				</div>

				<div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
					{table.orders.map((order) => (
						<div
							key={order.id}
							className="card bg-base-100 border border-base-300 shadow-sm">
							<div className="card-body p-4">
								<div className="flex justify-between items-start">
									<div>
										<h4 className="font-bold text-sm font-mono">
											#{order.order_number?.slice(-4) || order.id.slice(0, 4)}
										</h4>
										{order.customer_name && (
											<p className="text-xs opacity-60 flex items-center gap-1">
												<Users className="w-3 h-3" /> {order.customer_name}
											</p>
										)}
									</div>
									<div className="flex flex-col items-end gap-1">
										<span
											className={`badge badge-sm font-bold ${
												order.payment_status === "paid"
													? "badge-success"
													: "badge-warning"
											}`}>
											{order.payment_status === "paid" ? "PAID" : "UNPAID"}
										</span>
									</div>
								</div>

								<div className="divider my-1"></div>

								<div className="space-y-2">
									{order.order_items.map((item, idx) => {
										const itemNote =
											item.note || order.item_notes?.[item.cart_id];
										return (
											<div key={idx} className="flex flex-col text-xs">
												<div className="flex justify-between">
													<span className="font-medium">
														{item.quantity}x {item.name_burmese}
													</span>
													<span className="font-mono">
														฿{(item.final_price || item.price) * item.quantity}
													</span>
												</div>
												{itemNote && (
													<ul className="ml-4 mt-0.5 space-y-0.5 opacity-70 italic text-[10px]">
														{itemNote.split(", ").map((note, nIdx) => (
															<li key={nIdx} className="flex items-start gap-1">
																<span className="mt-1 w-1 h-1 rounded-full bg-base-content shrink-0"></span>
																{note}
															</li>
														))}
													</ul>
												)}
											</div>
										);
									})}
								</div>

								<div className="flex justify-between items-center mt-3 pt-2 border-t border-base-200">
									<span className="font-bold">Total Bill</span>
									<span className="font-bold text-primary">
										฿{order.total_amount}
									</span>
								</div>

								<div className="card-actions grid grid-cols-2 gap-2 mt-4">
									{order.payment_status !== "paid" ? (
										<>
											<button
												className="btn btn-sm btn-success gap-2"
												onClick={() =>
													handleAction(order.id, {
														payment_status: "paid",
														payment_method: "cash",
													})
												}>
												<Banknote className="w-4 h-4" /> Cash
											</button>
											<button
												className="btn btn-sm btn-info gap-2"
												onClick={() =>
													handleAction(order.id, {
														payment_status: "paid",
														payment_method: "qr",
													})
												}>
												<CreditCard className="w-4 h-4" /> QR
											</button>
										</>
									) : (
										<button
											className="btn btn-sm btn-primary col-span-2 gap-2"
											onClick={() => handleCompleteOrder(order.id)}
											disabled={processingOrders.has(order.id)}>
											{processingOrders.has(order.id) ? (
												<span className="loading loading-spinner loading-xs"></span>
											) : (
												<CheckCircle2 className="w-4 h-4" />
											)}
											Complete & Close Bill
										</button>
									)}

									{confirmAction?.orderId === order.id ? (
										<div className="col-span-2 mt-2 flex gap-2">
											<button
												className="btn btn-xs btn-error flex-1"
												onClick={() => {
													const isPaid = order.payment_status === "paid";
													handleAction(order.id, {
														pos_order_status: isPaid ? "refunded" : "cancelled",
													});
													setConfirmAction(null);
												}}>
												Confirm{" "}
												{order.payment_status === "paid" ? "Refund" : "Cancel"}
											</button>
											<button
												className="btn btn-xs btn-ghost flex-1"
												onClick={() => setConfirmAction(null)}>
												No, keep it
											</button>
										</div>
									) : (
										<button
											className="btn btn-xs btn-ghost text-error col-span-2 mt-2 opacity-50 hover:opacity-100"
											onClick={() => {
												const isPaid = order.payment_status === "paid";
												setConfirmAction({
													orderId: order.id,
													type: isPaid ? "refund" : "cancel",
												});
											}}>
											{order.payment_status === "paid"
												? "Refund Bill"
												: "Cancel Bill"}
										</button>
									)}
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="p-4 bg-base-100 border-t border-base-300 flex justify-end gap-2">
					<button className="btn btn-ghost" onClick={onClose}>
						Close
					</button>
				</div>
			</div>
			<div className="modal-backdrop bg-black/50" onClick={onClose}></div>
		</div>
	);
};

export default ActiveOrdersTab;
