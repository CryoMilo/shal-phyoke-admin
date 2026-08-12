// components/ActiveOrdersTab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../services/supabase";
import {
	Users,
	CheckCircle2,
	CreditCard,
	Banknote,
	Phone,
	MapPin,
} from "lucide-react";
import PrintKitchenTicketButton from "./PrintKitchenTicketButton";
import { showToast } from "../../utils/toastUtils";
import {
	getBangkokISOString,
	toBangkokDateString,
} from "../../utils/dateUtils";
import PaymentModal from "../common/PaymentModal";
import useMenuStore from "../../stores/menuStore";

// Synchronous guard to prevent duplicate order completions across re-renders
const inProgressOrders = new Set();

const ActiveOrdersTab = () => {
	const [activeOrders, setActiveOrders] = useState([]);
	const [selectedTableId, setSelectedTableId] = useState(null);

	useEffect(() => {
		fetchActiveOrders();

		const channel = supabase
			.channel("orders-active-realtime")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "orders",
				},
				() => {
					fetchActiveOrders();
				}
			)
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

	const { tableGroups, singularOrders } = useMemo(() => {
		const hubs = {};
		const singulars = [];

		activeOrders.forEach((order) => {
			if (order.order_type === "dine_in") {
				const key = order.table_number || "?";
				if (!hubs[key]) {
					hubs[key] = {
						id: key,
						isDineIn: true,
						orders: [],
						total: 0,
						unpaidCount: 0,
						oldestOrder: order.created_at,
					};
				}
				hubs[key].orders.push(order);
				// Hub total should exclude delivery fees for business accounting consistency
				hubs[key].total +=
					Number(order.total_amount) - Number(order.delivery_fee || 0);
				if (order.payment_status === "unpaid") hubs[key].unpaidCount++;
				if (new Date(order.created_at) < new Date(hubs[key].oldestOrder)) {
					hubs[key].oldestOrder = order.created_at;
				}
			} else {
				// Takeaway and Delivery are singular
				singulars.push(order);
			}
		});

		const sortedHubs = Object.values(hubs).sort(
			(a, b) => Number(a.id) - Number(b.id)
		);
		const sortedSingulars = singulars.sort(
			(a, b) => new Date(a.created_at) - new Date(b.created_at)
		);

		return { tableGroups: sortedHubs, singularOrders: sortedSingulars };
	}, [activeOrders]);

	const currentTableData = useMemo(() => {
		// This now only needs to handle Dine-in Hubs for the modal
		return tableGroups.find((g) => g.id === selectedTableId);
	}, [tableGroups, selectedTableId]);

	const getTimeElapsed = (startTime) => {
		const diff = Math.floor((new Date() - new Date(startTime)) / 60000);
		return `${diff}m`;
	};

	return (
		<div className="space-y-8 pb-20">
			{/* SECTION 1: SINGULAR ORDERS (Takeaway & Delivery) */}
			<section>
				<div className="flex justify-between items-center mb-4">
					<div className="flex items-center gap-2">
						<h2 className="text-xl font-black uppercase tracking-tight text-secondary">
							Takeaway & Delivery
						</h2>
						<span className="badge badge-secondary badge-sm font-bold">
							{singularOrders.length}
						</span>
					</div>
				</div>

				{singularOrders.length > 0 ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
						{singularOrders.map((order) => (
							<div
								key={order.id}
								className={`card shadow-sm border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95
									${
										order.payment_status === "unpaid"
											? "border-warning/30 bg-warning/5"
											: "border-secondary/20 bg-base-100"
									}`}
								onClick={() => {
									// For singular orders, we can open a simplified "Direct Action" modal
									// or just reuse the existing one by wrapping the order in a fake group
									setSelectedTableId(`singular-${order.id}`);
								}}>
								<div className="card-body p-3 items-center text-center">
									<div className="absolute top-2 right-2">
										<div className="text-[10px] opacity-40 font-mono">
											{getTimeElapsed(order.created_at)}
										</div>
									</div>

									<div
										className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl mb-1
										${
											order.order_type === "delivery"
												? "bg-accent text-accent-content"
												: "bg-secondary text-secondary-content"
										}`}>
										{order.table_number ||
											order.customer_name?.substring(0, 2).toUpperCase() ||
											"?"}
									</div>

									<div className="text-xs font-bold truncate w-full px-1">
										{order.customer_name ||
											(order.order_type === "takeaway" && order.table_number
												? `Table ${order.table_number}`
												: order.order_type.toUpperCase())}
									</div>

									{order.order_type === "delivery" && (
										<div className="flex flex-col items-center mt-1 w-full px-1 overflow-hidden">
											{order.delivery_address && (
												<div className="text-[10px] opacity-60 truncate w-full">
													{order.delivery_address}
												</div>
											)}
										</div>
									)}

									<div className="flex gap-1 mt-1">
										<span
											className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold
											${
												order.payment_status === "paid"
													? "bg-success/20 text-success"
													: "bg-error/20 text-error"
											}`}>
											{order.payment_status === "paid" ? "PAID" : "UNPAID"}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="py-8 text-center bg-base-200/50 rounded-2xl border-2 border-dashed border-base-300">
						<p className="text-sm opacity-40 font-medium">No active buzzers</p>
					</div>
				)}
			</section>

			<div className="divider opacity-50"></div>

			{/* SECTION 2: DINE-IN HUBS */}
			<section>
				<div className="flex justify-between items-center mb-4">
					<div className="flex items-center gap-2">
						<h2 className="text-xl font-black uppercase tracking-tight text-primary">
							Table Hubs
						</h2>
						<span className="badge badge-primary badge-sm font-bold">
							{tableGroups.length}
						</span>
					</div>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
					{tableGroups.map((group) => (
						<div
							key={group.id}
							className="card bg-base-100 border-2 border-primary/20 hover:border-primary transition-all cursor-pointer shadow-sm"
							onClick={() => setSelectedTableId(group.id)}>
							<div className="card-body p-3">
								<div className="flex justify-between items-start">
									<div className="w-10 h-10 rounded-lg bg-primary text-primary-content flex items-center justify-center font-black text-xl">
										{group.id}
									</div>
									<div className="text-right">
										<div className="text-[10px] opacity-40 font-mono">
											{getTimeElapsed(group.oldestOrder)}
										</div>
										{group.unpaidCount > 0 && (
											<div className="badge badge-error badge-xs font-bold animate-pulse text-[8px]">
												UNPAID
											</div>
										)}
									</div>
								</div>

								<div className="mt-2 flex justify-between items-end">
									<div className="flex flex-col">
										<span className="text-[10px] opacity-50 font-bold uppercase">
											Bills
										</span>
										<span className="font-bold text-sm leading-none">
											{group.orders.length}
										</span>
									</div>
									<div className="text-right">
										<span className="text-[10px] opacity-50 font-bold uppercase block">
											Total
										</span>
										<span className="font-bold text-primary text-sm leading-none">
											฿{group.total.toFixed(0)}
										</span>
									</div>
								</div>
							</div>
						</div>
					))}

					{tableGroups.length === 0 && (
						<div className="col-span-full py-8 text-center bg-base-200/50 rounded-2xl border-2 border-dashed border-base-300">
							<p className="text-sm opacity-40 font-medium">No active tables</p>
						</div>
					)}
				</div>
			</section>

			{/* MODAL HANDLING */}
			{selectedTableId &&
				(String(selectedTableId).startsWith("singular-") ? (
					<SingularOrderModal
						order={singularOrders.find(
							(o) => o.id === String(selectedTableId).replace("singular-", "")
						)}
						onClose={() => setSelectedTableId(null)}
						onUpdate={fetchActiveOrders}
					/>
				) : currentTableData ? (
					<TableBillsModal
						table={currentTableData}
						onClose={() => setSelectedTableId(null)}
						onUpdate={fetchActiveOrders}
					/>
				) : null)}
		</div>
	);
};

const SingularOrderModal = ({ order, onClose, onUpdate }) => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [pendingPaymentData, setPendingPaymentData] = useState(null);
	const [confirmAction, setConfirmAction] = useState(null);

	if (!order) return null;

	const handleCompleteOrder = async () => {
		if (inProgressOrders.has(order.id) || isProcessing) return;
		inProgressOrders.add(order.id);
		setIsProcessing(true);

		try {
			// Record to sales if not already recorded
			const { data: existingSales } = await supabase
				.from("monthly_sales")
				.select("id")
				.eq("order_id", order.id)
				.limit(1);

			if (!existingSales || existingSales.length === 0) {
				const menuItemIds = order.order_items.map((item) => item.id);
				const { data: menuItems } = await supabase
					.from("menu_items")
					.select("id, category")
					.in("id", menuItemIds);

				const categoryMap = {};
				menuItems?.forEach((m) => (categoryMap[m.id] = m.category));

				const bangkokDate = toBangkokDateString();
				const bangkokISO = getBangkokISOString();

				const salesRecords = order.order_items.map((item) => ({
					sale_date: bangkokDate,
					sale_timestamp: bangkokISO,
					menu_item_id: item.id,
					menu_item_name_burmese: item.name_burmese,
					menu_item_category: categoryMap[item.id] || null,
					menu_item_price: item.price,
					quantity_sold: item.quantity,
					total_revenue: (item.final_price || item.price) * item.quantity,
					order_id: order.id,
					order_number: order.order_number,
					order_type: order.order_type,
					payment_method: order.payment_method,
					payment_status: order.payment_status,
					delivery_fee: order.delivery_fee || 0,
				}));

				await supabase.from("monthly_sales").insert(salesRecords);
			}

			await supabase
				.from("orders")
				.update({ pos_order_status: "completed" })
				.eq("id", order.id);

			showToast.success("Order completed");
			onUpdate();
			onClose();
		} catch (error) {
			console.error("Error:", error);
			showToast.error("Failed to complete order");
		} finally {
			inProgressOrders.delete(order.id);
			setIsProcessing(false);
		}
	};

	const handlePaymentClick = (method) => {
		setPendingPaymentData({
			orderId: order.id,
			amount: order.total_amount,
			method: method,
			updates: { payment_status: "paid", payment_method: method },
		});
		setShowPaymentModal(true);
	};

	const handlePaymentConfirm = async () => {
		if (!pendingPaymentData) return;
		setIsProcessing(true);
		try {
			await supabase
				.from("orders")
				.update(pendingPaymentData.updates)
				.eq("id", order.id);
			showToast.success("Payment recorded");
			onUpdate();
			setShowPaymentModal(false);
		} catch (error) {
			console.error(error);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleCancelRefund = async (status) => {
		try {
			await supabase
				.from("orders")
				.update({ pos_order_status: status })
				.eq("id", order.id);

			showToast.success(`Order ${status}`);
			onUpdate();
			onClose();
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			console.error("Error cancelling/refunding order:", error);
			showToast.error("Update failed");
		}
	};

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-lg p-0 overflow-hidden bg-base-100">
				<div className="p-4 bg-base-200 border-b border-base-300 flex justify-between items-center">
					<div className="flex items-center gap-3">
						<div
							className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
							${
								order.order_type === "delivery"
									? "bg-accent text-accent-content"
									: "bg-secondary text-secondary-content"
							}`}>
							{order.table_number ||
								order.customer_name?.substring(0, 2).toUpperCase() ||
								"?"}
						</div>
						<h3 className="font-bold">
							{order.customer_name ||
								(order.order_type === "takeaway" && order.table_number
									? `Table ${order.table_number}`
									: `${
											order.order_type.charAt(0).toUpperCase() +
											order.order_type.slice(1)
									  } Order`)}
						</h3>
					</div>
					<button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
						✕
					</button>
				</div>

				<div className="p-6 space-y-6">
					<div className="flex justify-between items-start">
						<div>
							<div className="text-[10px] font-bold opacity-40 uppercase mb-1">
								Order #
							</div>
							<div className="flex items-center gap-2">
								<span className="font-mono font-bold text-lg">
									{order.order_number?.slice(-4) || order.id.slice(0, 4)}
								</span>
								<PrintKitchenTicketButton order={order} size="xs" />
							</div>
						</div>
						<div className="text-right">
							<div className="text-[10px] font-bold opacity-40 uppercase mb-1">
								Status
							</div>
							<span
								className={`badge font-bold ${
									order.payment_status === "paid"
										? "badge-success"
										: "badge-warning"
								}`}>
								{order.payment_status.toUpperCase()}
							</span>
						</div>
					</div>

					{/* Customer Details Section */}
					{(order.customer_phone || order.delivery_address) && (
						<div className="bg-base-200/50 p-4 rounded-xl space-y-3">
							<div className="grid grid-cols-2 gap-2">
								{order.customer_phone && (
									<div>
										<div className="text-[10px] opacity-40 mb-0.5 flex items-center gap-1">
											<Phone className="w-2.5 h-2.5" /> Phone
										</div>
										<div className="text-sm font-bold font-mono">
											{order.customer_phone}
										</div>
									</div>
								)}
								{order.delivery_address && (
									<div className="col-span-2 border-base-300/50">
										<div className="text-[10px] opacity-40 mb-0.5 flex items-center gap-1">
											<MapPin className="w-2.5 h-2.5" /> Delivery Address
										</div>
										<div className="text-sm font-medium leading-relaxed">
											{order.delivery_address}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					<div className="space-y-3">
						<h4 className="text-[10px] font-bold opacity-40 uppercase">
							Order Items
						</h4>
						{order.order_items.map((item, idx) => (
							<div key={idx} className="flex flex-col gap-1">
								<div className="flex justify-between text-sm">
									<span className="font-medium">
										{item.quantity}x {item.name_burmese}
									</span>
									<span className="font-mono">
										฿{(item.final_price || item.price) * item.quantity}
									</span>
								</div>
								{(item.note || order.item_notes?.[item.cart_id]) && (
									<div className="ml-4 text-[10px] opacity-60 italic">
										{item.note || order.item_notes?.[item.cart_id]}
									</div>
								)}
							</div>
						))}
					</div>

					<div className="divider my-0 opacity-50"></div>

					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span className="opacity-60">Subtotal</span>
							<span className="font-mono text-sm">฿{order.subtotal}</span>
						</div>
						{order.discount_amount > 0 && (
							<div className="flex justify-between text-sm">
								<span className="opacity-60">Discount</span>
								<span className="font-mono text-sm text-error">
									-฿{order.discount_amount}
								</span>
							</div>
						)}
						{order.delivery_fee > 0 && (
							<div className="flex justify-between text-sm">
								<span className="opacity-60 font-bold text-accent">
									Delivery Fee
								</span>
								<span className="font-mono text-sm text-accent">
									+฿{order.delivery_fee}
								</span>
							</div>
						)}
						<div className="flex justify-between font-bold text-xl pt-2 border-t border-base-200">
							<span>Total Amount</span>
							<span className="text-primary text-2xl">
								฿{order.total_amount}
							</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3 mt-8">
						{order.payment_status !== "paid" ? (
							<>
								<button
									className="btn btn-success gap-2"
									onClick={() => handlePaymentClick("cash")}>
									<Banknote className="w-4 h-4" /> Cash
								</button>
								<button
									className="btn btn-info gap-2"
									onClick={() => handlePaymentClick("qr")}>
									<CreditCard className="w-4 h-4" /> QR
								</button>
							</>
						) : (
							<button
								className="btn btn-primary col-span-2 gap-2 h-16 text-lg"
								onClick={handleCompleteOrder}
								disabled={isProcessing}>
								{isProcessing ? (
									<span className="loading loading-spinner"></span>
								) : (
									<CheckCircle2 className="w-6 h-6" />
								)}
								Complete & Close
							</button>
						)}

						<div className="col-span-2 flex justify-center mt-2">
							{confirmAction ? (
								<div className="flex gap-2 w-full">
									<button
										className="btn btn-sm btn-error flex-1"
										onClick={() => handleCancelRefund(confirmAction)}>
										Confirm{" "}
										{confirmAction === "cancelled" ? "Cancel" : "Refund"}
									</button>
									<button
										className="btn btn-sm btn-ghost flex-1"
										onClick={() => setConfirmAction(null)}>
										Back
									</button>
								</div>
							) : (
								<button
									className="btn btn-xs btn-ghost text-error opacity-50"
									onClick={() =>
										setConfirmAction(
											order.payment_status === "paid" ? "refunded" : "cancelled"
										)
									}>
									{order.payment_status === "paid"
										? "Refund Bill"
										: "Cancel Bill"}
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			<PaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				onConfirm={handlePaymentConfirm}
				amount={order.total_amount}
				paymentMethod={pendingPaymentData?.method}
				loading={isProcessing}
			/>
			<div className="modal-backdrop bg-black/50" onClick={onClose}></div>
		</div>
	);
};

const TableBillsModal = ({ table, onClose, onUpdate }) => {
	const [confirmAction, setConfirmAction] = useState(null);
	const [processingOrders, setProcessingOrders] = useState(new Set());
	const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

	// Payment Confirmation Modal State
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [pendingPaymentData, setPendingPaymentData] = useState(null);

	const handleCompleteOrder = async (orderId) => {
		// Synchronous check using module-level Set (not affected by React render cycle)
		if (inProgressOrders.has(orderId)) return;
		inProgressOrders.add(orderId);

		// Also update UI state to show loading spinner
		setProcessingOrders((prev) => new Set(prev).add(orderId));

		try {
			const { data: order, error: fetchError } = await supabase
				.from("orders")
				.select("*")
				.eq("id", orderId)
				.single();

			if (fetchError) throw fetchError;

			const { data: existingSales, error: existingError } = await supabase
				.from("monthly_sales")
				.select("id")
				.eq("order_id", orderId)
				.limit(1);

			if (existingError) throw existingError;

			if (!existingSales || existingSales.length === 0) {
				const menuItemIds = order.order_items.map((item) => item.id);
				const { data: menuItems, error: menuError } = await supabase
					.from("menu_items")
					.select("id, category")
					.in("id", menuItemIds);

				if (menuError) throw menuError;

				const categoryMap = {};
				menuItems.forEach((item) => {
					categoryMap[item.id] = item.category;
				});

				const bangkokDate = toBangkokDateString();
				const bangkokISO = getBangkokISOString();

				const salesRecords = order.order_items.map((item) => ({
					sale_date: bangkokDate,
					sale_timestamp: bangkokISO,
					menu_item_id: item.id,
					menu_item_name_burmese: item.name_burmese,
					menu_item_name_english: item.name_english || null,
					menu_item_category: categoryMap[item.id] || null,
					menu_item_price: item.price,
					quantity_sold: item.quantity,
					total_revenue: (item.final_price || item.price) * item.quantity,
					order_id: order.id,
					order_number: order.order_number,
					order_type: order.order_type,
					payment_method: order.payment_method,
					payment_status: order.payment_status,
					delivery_fee: order.delivery_fee || 0,
				}));

				const { error: salesError } = await supabase
					.from("monthly_sales")
					.insert(salesRecords);

				if (salesError) throw salesError;
			}

			const { error: updateError } = await supabase
				.from("orders")
				.update({ pos_order_status: "completed" })
				.eq("id", orderId);

			if (updateError) throw updateError;

			showToast.success("Order completed and recorded successfully");
			onUpdate();
		} catch (error) {
			console.error("Error completing order:", error);
			showToast.error(
				"Failed to complete order: " + (error.message || "Unknown error")
			);
		} finally {
			// Remove from both guards
			inProgressOrders.delete(orderId);
			setProcessingOrders((prev) => {
				const newSet = new Set(prev);
				newSet.delete(orderId);
				return newSet;
			});
		}
	};

	const handlePaymentClick = (order, method) => {
		setPendingPaymentData({
			orderId: order.id,
			amount: order.total_amount,
			method: method,
			updates: {
				payment_status: "paid",
				payment_method: method,
			},
		});
		setShowPaymentModal(true);
	};

	const handlePaymentConfirm = async () => {
		if (!pendingPaymentData || isPaymentProcessing) return;

		setIsPaymentProcessing(true);
		try {
			const { orderId, updates } = pendingPaymentData;
			await handleAction(orderId, updates);
			setShowPaymentModal(false);
			setPendingPaymentData(null);
		} catch (error) {
			console.error("Payment confirmation error:", error);
		} finally {
			setIsPaymentProcessing(false);
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
							{table.isDineIn
								? `Table ${table.id}`
								: table.id === "Delivery"
								? "Delivery Hub"
								: "Takeaway Hub"}
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
										<div className="flex items-center gap-2">
											<h4 className="font-bold text-sm font-mono">
												#{order.order_number?.slice(-4) || order.id.slice(0, 4)}
											</h4>
											<PrintKitchenTicketButton order={order} size="xs" />
										</div>
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
												onClick={() => handlePaymentClick(order, "cash")}>
												<Banknote className="w-4 h-4" /> Cash
											</button>
											<button
												className="btn btn-sm btn-info gap-2"
												onClick={() => handlePaymentClick(order, "qr")}>
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

			<PaymentModal
				isOpen={showPaymentModal}
				onClose={() => !isPaymentProcessing && setShowPaymentModal(false)}
				onConfirm={handlePaymentConfirm}
				amount={pendingPaymentData?.amount || 0}
				paymentMethod={pendingPaymentData?.method}
				loading={isPaymentProcessing}
			/>

			<div
				className="modal-backdrop bg-black/50"
				onClick={() => !isPaymentProcessing && onClose()}></div>
		</div>
	);
};

export default ActiveOrdersTab;
