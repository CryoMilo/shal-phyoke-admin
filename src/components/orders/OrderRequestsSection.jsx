// src/components/orders/OrderRequestsSection.jsx
import React, { useState, useEffect } from "react";
import {
	Inbox,
	ChevronDown,
	ChevronUp,
	RefreshCw,
	AlertTriangle,
	Receipt,
	MessageSquare,
} from "lucide-react";
import useOrderRequestStore from "../../stores/orderRequestStore";
import OrderRequestCard from "./OrderRequestCard";
import OrderRequestDetailModal from "./OrderRequestDetailModal";

const OrderRequestsSection = () => {
	const {
		orderRequests,
		loading,
		fetchOrderRequests,
		subscribeToOrderRequests,
		selectedRequest,
		setSelectedRequest,
	} = useOrderRequestStore();

	const [isCollapsed, setIsCollapsed] = useState(false);

	useEffect(() => {
		fetchOrderRequests();
		const unsubscribe = subscribeToOrderRequests();
		return () => {
			unsubscribe?.();
		};
	}, [fetchOrderRequests, subscribeToOrderRequests]);

	// Auto-expand if new urgent requests arrive and section was collapsed
	useEffect(() => {
		if (orderRequests.length > 0 && isCollapsed) {
			// keep user preference unless new items
		}
	}, [orderRequests.length, isCollapsed]);

	const stockCheckCount = orderRequests.filter(
		(r) => r.status === "stock_checking" && r.stock_status !== "change_requested"
	).length;
	const changeRequestedCount = orderRequests.filter(
		(r) => r.status === "stock_checking" && r.stock_status === "change_requested"
	).length;
	const paymentReviewCount = orderRequests.filter(
		(r) => r.status === "paid_pending_approval"
	).length;

	// If no order requests at all, render a quiet, compact bar
	if (orderRequests.length === 0) {
		return null;
	}

	return (
		<section className="bg-base-200/50 border-2 border-primary/20 rounded-3xl p-4 sm:p-5 shadow-xs transition-all">
			{/* Header */}
			<div className="flex items-center justify-between gap-3">
				<div
					onClick={() => setIsCollapsed(!isCollapsed)}
					className="flex items-center gap-2.5 cursor-pointer select-none">
					<div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<Inbox className="w-4 h-4" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-base-content">
								Incoming Order Requests
							</h2>
							<span className="badge badge-primary font-black text-xs">
								{orderRequests.length}
							</span>
						</div>

						{/* Subtitle breakdown */}
						<div className="flex items-center gap-2 mt-0.5 text-[11px] flex-wrap">
							{stockCheckCount > 0 && (
								<span className="text-warning font-bold flex items-center gap-1">
									<AlertTriangle className="w-3 h-3" />
									{stockCheckCount} Stock Check
								</span>
							)}
							{changeRequestedCount > 0 && (
								<span className="text-secondary font-bold flex items-center gap-1">
									<MessageSquare className="w-3 h-3" />
									{changeRequestedCount} Change Requested
								</span>
							)}
							{paymentReviewCount > 0 && (
								<span className="text-info font-bold flex items-center gap-1">
									<Receipt className="w-3 h-3" />
									{paymentReviewCount} Payment Review
								</span>
							)}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={() => fetchOrderRequests()}
						disabled={loading}
						className="btn btn-ghost btn-xs btn-circle"
						title="Refresh order requests">
						<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
					</button>

					<button
						type="button"
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="btn btn-ghost btn-xs btn-circle"
						title={isCollapsed ? "Expand section" : "Collapse section"}>
						{isCollapsed ? (
							<ChevronDown className="w-4 h-4" />
						) : (
							<ChevronUp className="w-4 h-4" />
						)}
					</button>
				</div>
			</div>

			{/* Cards Grid */}
			{!isCollapsed && (
				<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-fadeIn">
					{orderRequests.map((request) => (
						<OrderRequestCard
							key={request.id}
							request={request}
							onClick={() => setSelectedRequest(request)}
						/>
					))}
				</div>
			)}

			{/* Detail Modal */}
			<OrderRequestDetailModal
				isOpen={Boolean(selectedRequest)}
				request={selectedRequest}
				onClose={() => setSelectedRequest(null)}
			/>
		</section>
	);
};

export default OrderRequestsSection;
