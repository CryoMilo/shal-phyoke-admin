// components/ActiveOrdersTab.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../services/supabase";
import {
	Users,
	CheckCircle2,
	CreditCard,
	Banknote,
	Phone,
	MapPin,
	Building2,
	Truck,
	RefreshCw,
	Bike,
	Zap,
	ClipboardList,
	Check,
} from "lucide-react";
import PrintKitchenTicketButton from "./PrintKitchenTicketButton";
import DeliveryPagerModal from "./DeliveryPagerModal";
import DeliveryTripSelectModal from "../delivery/DeliveryTripSelectModal";
import TodayTripsModal from "../delivery/TodayTripsModal";
import { showToast } from "../../utils/toastUtils";
import {
	getBangkokISOString,
	toBangkokDateString,
} from "../../utils/dateUtils";
import PaymentModal from "../common/PaymentModal";
import OrderRequestsSection from "./OrderRequestsSection";
import { useAuth } from "../../contexts/AuthContext";
import useDeliveryTripStore from "../../stores/deliveryTripStore";
import CopyableText from "../common/CopyableText";

// Synchronous guard to prevent duplicate order completions across re-renders
const inProgressOrders = new Set();

const ActiveOrdersTab = () => {
	const { isAdmin } = useAuth();
	const { recordStaffTrip, recordBoltDelivery } = useDeliveryTripStore();

	const [activeOrders, setActiveOrders] = useState([]);
	const [selectedTableId, setSelectedTableId] = useState(null);
	const [pagerOrder, setPagerOrder] = useState(null);
	const [isPagerOpen, setIsPagerOpen] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const debounceTimerRef = useRef(null);

	// In-house delivery trip selection states
	const [isTripModalOpen, setIsTripModalOpen] = useState(false);
	const [isTodayTripsOpen, setIsTodayTripsOpen] = useState(false);
	const [tripSelectionConfig, setTripSelectionConfig] = useState(null); // { type: 'staff'|'bolt', employee, tripFee }
	const [selectedDeliveryOrderIds, setSelectedDeliveryOrderIds] = useState([]);
	const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);

	const fetchActiveOrders = async (isManual = false) => {
		try {
			if (isManual) setIsRefreshing(true);
			const { data, error } = await supabase
				.from("orders")
				.select("*, customers(building_info)")
				.in("pos_order_status", ["pending", "preparing", "ready"])
				.order("created_at", { ascending: true });

			if (error) throw error;
			setActiveOrders(data || []);
		} catch (error) {
			console.error("Error fetching active orders:", error);
			showToast.error("Failed to load active orders");
		} finally {
			if (isManual) setIsRefreshing(false);
		}
	};

	useEffect(() => {
		fetchActiveOrders();

		const debouncedFetch = () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
			debounceTimerRef.current = setTimeout(() => {
				fetchActiveOrders();
			}, 350);
		};

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
					debouncedFetch();
				}
			)
			.subscribe((status) => {
				console.log("Active Orders Realtime status:", status);
			});

		return () => {
			if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
			supabase.removeChannel(channel);
		};
	}, []);

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

	const pendingDeliveryOrdersCount = useMemo(() => {
		return singularOrders.filter(
			(o) => o.order_type === "delivery" && !o.delivery_fee_paid
		).length;
	}, [singularOrders]);

	const handleConfirmTripSelection = async () => {
		if (!tripSelectionConfig || selectedDeliveryOrderIds.length === 0) return;
		setIsSubmittingTrip(true);
		try {
			if (tripSelectionConfig.type === "staff") {
				const res = await recordStaffTrip({
					employeeId: tripSelectionConfig.employee.id,
					orderIds: selectedDeliveryOrderIds,
					tripFee: tripSelectionConfig.tripFee,
				});
				if (res.success) {
					setTripSelectionConfig(null);
					setSelectedDeliveryOrderIds([]);
					await fetchActiveOrders();
				}
			} else if (tripSelectionConfig.type === "bolt") {
				const res = await recordBoltDelivery({
					orderIds: selectedDeliveryOrderIds,
				});
				if (res.success) {
					setTripSelectionConfig(null);
					setSelectedDeliveryOrderIds([]);
					await fetchActiveOrders();
				}
			}
		} finally {
			setIsSubmittingTrip(false);
		}
	};

	return (
		<div className="space-y-8 pb-20">
			{/* SECTION 0: INCOMING ORDER REQUESTS */}
			<OrderRequestsSection />

			{/* SECTION 1: SINGULAR ORDERS (Takeaway & Delivery) */}
			<section>
				<div className="flex flex-wrap justify-between items-center gap-2 mb-4">
					<div className="flex items-center gap-2">
						<h2 className="text-xl font-black uppercase tracking-tight text-secondary">
							Takeaway & Delivery
						</h2>
						<span className="badge badge-secondary badge-sm font-bold">
							{singularOrders.length}
						</span>
					</div>

					<div className="flex items-center gap-2">
						{!tripSelectionConfig && (
							<>
								{isAdmin && (
									<button
										type="button"
										onClick={() => setIsTripModalOpen(true)}
										className="btn btn-primary btn-xs sm:btn-sm gap-1.5 font-bold shadow-sm">
										<Bike className="w-3.5 h-3.5" />
										<span>Record Trip</span>
										{pendingDeliveryOrdersCount > 0 && (
											<span className="badge badge-warning badge-xs font-bold">
												{pendingDeliveryOrdersCount}
											</span>
										)}
									</button>
								)}
								<button
									type="button"
									onClick={() => setIsTodayTripsOpen(true)}
									className="btn btn-outline btn-xs sm:btn-sm gap-1 opacity-80 hover:opacity-100">
									<ClipboardList className="w-3.5 h-3.5" />
									<span className="hidden sm:inline">Today's Trips</span>
								</button>
							</>
						)}
						<button
							onClick={() => fetchActiveOrders(true)}
							disabled={isRefreshing}
							className="btn btn-ghost btn-xs gap-1 opacity-70 hover:opacity-100"
							title="Sync active orders with server">
							<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
							<span className="text-xs hidden sm:inline">Refresh</span>
						</button>
					</div>
				</div>

				{/* Trip Selection Mode Banner */}
				{tripSelectionConfig && (
					<div className="bg-primary/10 border-2 border-primary/50 rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
						<div className="flex items-center gap-3">
							<div
								className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
									tripSelectionConfig.type === "bolt"
										? "bg-amber-500 text-black"
										: "bg-primary text-primary-content"
								}`}>
								{tripSelectionConfig.type === "bolt" ? (
									<Zap className="w-5 h-5 fill-current" />
								) : (
									<Bike className="w-5 h-5" />
								)}
							</div>
							<div>
								<h4 className="font-bold text-sm text-base-content">
									{tripSelectionConfig.type === "bolt"
										? "Selecting Orders for Bolt Delivery"
										: `Assigning Trip to ${tripSelectionConfig.employee?.name}`}
								</h4>
								<p className="text-xs text-base-content/70">
									<span className="font-bold text-primary">
										{selectedDeliveryOrderIds.length}
									</span>{" "}
									delivery order(s) selected
									{tripSelectionConfig.type === "staff" && (
										<span> • Fixed Payout: ฿{tripSelectionConfig.tripFee}</span>
									)}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => {
									setTripSelectionConfig(null);
									setSelectedDeliveryOrderIds([]);
								}}
								disabled={isSubmittingTrip}
								className="btn btn-sm btn-ghost">
								Cancel
							</button>
							<button
								type="button"
								onClick={handleConfirmTripSelection}
								disabled={selectedDeliveryOrderIds.length === 0 || isSubmittingTrip}
								className="btn btn-sm btn-primary font-bold gap-1.5 shadow-md">
								{isSubmittingTrip ? (
									<span className="loading loading-spinner loading-xs"></span>
								) : (
									<CheckCircle2 className="w-4 h-4" />
								)}
								Done ({selectedDeliveryOrderIds.length})
							</button>
						</div>
					</div>
				)}

				{singularOrders.length > 0 ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
						{singularOrders.map((order) => {
							const isSelectionMode = !!tripSelectionConfig;
							const isEligibleDelivery =
								order.order_type === "delivery" && !order.delivery_fee_paid;
							const isSelected = selectedDeliveryOrderIds.includes(order.id);

							const handleCardClick = () => {
								if (isSelectionMode) {
									if (!isEligibleDelivery) return;
									setSelectedDeliveryOrderIds((prev) =>
										prev.includes(order.id)
											? prev.filter((id) => id !== order.id)
											: [...prev, order.id]
									);
								} else {
									setSelectedTableId(`singular-${order.id}`);
								}
							};

							return (
								<div
									key={order.id}
									className={`card shadow-sm border-2 transition-all cursor-pointer relative
										${
											isSelectionMode
												? isEligibleDelivery
													? isSelected
														? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-1 scale-[1.02]"
														: "border-primary/40 bg-base-100 hover:border-primary hover:scale-[1.02]"
													: "opacity-30 grayscale cursor-not-allowed pointer-events-none border-base-300 bg-base-200/50"
												: order.payment_status === "unpaid"
												? "border-warning/30 bg-warning/5 hover:scale-[1.02] active:scale-95"
												: "border-secondary/20 bg-base-100 hover:scale-[1.02] active:scale-95"
										}`}
									onClick={handleCardClick}>
									<div className="card-body p-3 items-center text-center">
										{/* Selection Checkbox */}
										{isSelectionMode && isEligibleDelivery && (
											<div className="absolute top-2 left-2">
												<div
													className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
														isSelected
															? "bg-primary text-primary-content border-primary"
															: "bg-base-100 border-base-300"
													}`}>
													{isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
												</div>
											</div>
										)}

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
												{(order.building_info || order.customers?.building_info) && (
													<div className="text-[9px] text-primary font-medium truncate w-full flex items-center justify-center gap-0.5">
														<Building2 className="w-2.5 h-2.5 shrink-0" />
														<span className="truncate">
															{order.building_info || order.customers?.building_info}
														</span>
													</div>
												)}
											</div>
										)}

										<div className="flex flex-wrap gap-1 mt-1 justify-center">
											<span
												className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold
												${
													order.payment_status === "paid"
														? "bg-success/20 text-success"
														: "bg-error/20 text-error"
												}`}>
												{order.payment_status === "paid" ? "PAID" : "UNPAID"}
											</span>

											{order.order_type === "delivery" && (
												<span
													className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
														order.delivery_fee_paid
															? order.delivery_provider === "bolt"
																? "bg-amber-500/20 text-amber-600"
																: "bg-primary/20 text-primary"
															: "bg-warning/20 text-warning"
													}`}>
													{order.delivery_fee_paid
														? order.delivery_provider === "bolt"
															? "⚡ Bolt"
															: "🛵 Trip Done"
														: "🛵 Trip Needed"}
												</span>
											)}
										</div>
									</div>
								</div>
							);
						})}
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
						onOpenPager={(ord) => {
							setPagerOrder(ord);
							setIsPagerOpen(true);
						}}
					/>
				) : currentTableData ? (
					<TableBillsModal
						table={currentTableData}
						onClose={() => setSelectedTableId(null)}
						onUpdate={fetchActiveOrders}
					/>
				) : null)}

			<DeliveryPagerModal
				isOpen={isPagerOpen}
				onClose={() => {
					setIsPagerOpen(false);
					setPagerOrder(null);
				}}
				order={pagerOrder}
			/>

			{isAdmin && (
				<DeliveryTripSelectModal
					isOpen={isTripModalOpen}
					onClose={() => setIsTripModalOpen(false)}
					onStartSelection={(config) => {
						setTripSelectionConfig(config);
						setSelectedDeliveryOrderIds([]);
					}}
				/>
			)}

			<TodayTripsModal
				isOpen={isTodayTripsOpen}
				onClose={() => setIsTodayTripsOpen(false)}
			/>
		</div>
	);
};

const SingularOrderModal = ({ order, onClose, onUpdate, onOpenPager }) => {
	const { recordBoltDelivery, unmarkBoltDelivery } = useDeliveryTripStore();
	const [isProcessing, setIsProcessing] = useState(false);
	const [isBoltProcessing, setIsBoltProcessing] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [pendingPaymentData, setPendingPaymentData] = useState(null);
	const [confirmAction, setConfirmAction] = useState(null);

	if (!order) return null;

	const isDeliveryUnassigned =
		order.order_type === "delivery" && !order.delivery_fee_paid;

	const handleAssignBolt = async () => {
		if (isBoltProcessing) return;
		setIsBoltProcessing(true);
		try {
			const res = await recordBoltDelivery({ orderIds: [order.id] });
			if (res.success) {
				await onUpdate();
			}
		} finally {
			setIsBoltProcessing(false);
		}
	};

	const handleUnmarkBolt = async () => {
		if (isBoltProcessing) return;
		setIsBoltProcessing(true);
		try {
			const res = await unmarkBoltDelivery(order.id);
			if (res.success) {
				await onUpdate();
			}
		} finally {
			setIsBoltProcessing(false);
		}
	};

	const handleCompleteOrder = async () => {
		if (isDeliveryUnassigned) {
			showToast.error(
				"This delivery order must be assigned to a staff trip or Bolt first"
			);
			return;
		}
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
		} catch (error) {
			console.error("Error cancelling/refunding order:", error);
			showToast.error("Update failed");
		}
	};

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-lg p-0 overflow-hidden bg-base-100 max-h-[90vh] flex flex-col">
				{/* 1. Static Header */}
				<div className="p-4 bg-base-200 border-b border-base-300 flex justify-between items-center shrink-0">
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
					<div className="flex items-center gap-2">
						{order.order_type === "delivery" && (
							order.delivery_provider === "bolt" ? (
								<button
									type="button"
									disabled={isBoltProcessing}
									onClick={handleUnmarkBolt}
									title="Click to cancel Bolt assignment"
									className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-black border-none font-bold gap-1 shadow-sm">
									{isBoltProcessing ? (
										<span className="loading loading-spinner loading-xs text-black"></span>
									) : (
										<Zap className="w-3.5 h-3.5 fill-current" />
									)}
									<span>Bolt Trip ✓</span>
								</button>
							) : !order.delivery_fee_paid ? (
								<button
									type="button"
									disabled={isBoltProcessing}
									onClick={handleAssignBolt}
									className="btn btn-sm btn-warning text-black font-bold gap-1 shadow-sm">
									{isBoltProcessing ? (
										<span className="loading loading-spinner loading-xs text-black"></span>
									) : (
										<Zap className="w-3.5 h-3.5 fill-current" />
									)}
									<span>Bolt Trip</span>
								</button>
							) : (
								<span className="badge badge-primary badge-sm font-bold gap-1 py-3 px-2.5">
									<Bike className="w-3 h-3" /> Staff Trip
								</span>
							)
						)}
						<button
							className="btn btn-sm btn-circle btn-ghost"
							onClick={onClose}
							type="button">
							✕
						</button>
					</div>
				</div>

				{/* 2. Static Top Details: Order #, Status, Customer Address */}
				<div className="p-6 pb-2 space-y-4 shrink-0">
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
								{order.order_type === "delivery" && (
									<button
										className="btn btn-xs btn-primary gap-1 active:scale-95 transition-transform duration-100 ease-out"
										onClick={(e) => {
											e.stopPropagation();
											onOpenPager(order);
										}}>
										<Truck className="w-3.5 h-3.5" /> Dispatch
									</button>
								)}
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
					{(order.customer_phone ||
						order.delivery_address ||
						order.building_info ||
						order.customers?.building_info) && (
						<div className="bg-base-200/50 p-4 rounded-xl space-y-3">
							<div className="grid grid-cols-2 gap-2">
								{order.customer_phone && (
									<div>
										<div className="text-[10px] opacity-40 mb-0.5 flex items-center gap-1">
											<Phone className="w-2.5 h-2.5" /> Phone
										</div>
										<CopyableText text={order.customer_phone} label="phone number">
											<span className="text-sm font-bold font-mono">
												{order.customer_phone}
											</span>
										</CopyableText>
									</div>
								)}
								{(order.delivery_address ||
									order.building_info ||
									order.customers?.building_info) && (
									<div className="col-span-2 border-base-300/50">
										<div className="text-[10px] opacity-40 mb-0.5 flex items-center gap-1">
											<MapPin className="w-2.5 h-2.5" /> Delivery Address
										</div>
										<div className="text-sm font-medium leading-relaxed flex flex-wrap items-center gap-2">
											{order.delivery_address && (
												<CopyableText text={order.delivery_address} label="delivery address">
													<span>{order.delivery_address}</span>
												</CopyableText>
											)}
											{(order.building_info ||
												order.customers?.building_info) && (
												<CopyableText
													text={order.building_info || order.customers?.building_info}
													label="building info">
													<span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-base-300/70 text-base-content/80 font-normal">
														<Building2 className="w-3 h-3 text-primary shrink-0" />
														{order.building_info ||
															order.customers?.building_info}
													</span>
												</CopyableText>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* 3. Scrollable Order Items Section */}
				<div className="px-6 py-2 overflow-y-auto flex-1 min-h-0 space-y-2.5 max-h-56 border-y border-base-200">
					<h4 className="text-[10px] font-bold opacity-40 uppercase sticky top-0 bg-base-100 py-1 z-10">
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

				{/* 4. Static Bottom Section: Totals & Action Buttons */}
				<div className="p-6 pt-3 space-y-4 shrink-0 bg-base-100">
					<div className="space-y-1.5">
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

					<div className="grid grid-cols-2 gap-3 pt-1">
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
							<>
								<button
									className="btn btn-primary col-span-2 gap-2 h-14 text-lg font-bold"
									onClick={handleCompleteOrder}
									disabled={isProcessing || isDeliveryUnassigned}
									title={
										isDeliveryUnassigned
											? "Assign to Staff Trip or Bolt before completing"
											: ""
									}>
									{isProcessing ? (
										<span className="loading loading-spinner"></span>
									) : (
										<CheckCircle2 className="w-6 h-6" />
									)}
									Complete & Close
								</button>
								{isDeliveryUnassigned && (
									<div className="col-span-2 text-center p-2 bg-warning/10 border border-warning/30 rounded-xl">
										<span className="text-xs font-bold text-warning flex items-center justify-center gap-1.5">
											⚠️ Assign to Staff Trip or Bolt (top right) before completing
										</span>
									</div>
								)}
							</>
						)}

						<div className="col-span-2 flex justify-center mt-1">
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
										: "Cancel Order"}
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

			if (order.order_type === "delivery" && !order.delivery_fee_paid) {
				showToast.error(
					"This delivery order must be assigned to a staff trip or Bolt first"
				);
				inProgressOrders.delete(orderId);
				setProcessingOrders((prev) => {
					const next = new Set(prev);
					next.delete(orderId);
					return next;
				});
				return;
			}

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
										<>
											<button
												className="btn btn-sm btn-primary col-span-2 gap-2"
												onClick={() => handleCompleteOrder(order.id)}
												disabled={
													processingOrders.has(order.id) ||
													(order.order_type === "delivery" && !order.delivery_fee_paid)
												}
												title={
													order.order_type === "delivery" && !order.delivery_fee_paid
														? "Assign to Staff Trip or Bolt before completing"
														: ""
												}>
												{processingOrders.has(order.id) ? (
													<span className="loading loading-spinner loading-xs"></span>
												) : (
													<CheckCircle2 className="w-4 h-4" />
												)}
												Complete & Close Bill
											</button>
											{order.order_type === "delivery" && !order.delivery_fee_paid && (
												<div className="col-span-2 text-center p-1.5 bg-warning/10 border border-warning/30 rounded-lg">
													<span className="text-[11px] font-bold text-warning flex items-center justify-center gap-1">
														⚠️ Assign to Staff Trip or Bolt before completing
													</span>
												</div>
											)}
										</>
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
