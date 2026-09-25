// src/components/orders/OrderRequestCard.jsx
import React from "react";
import {
	Clock,
	Phone,
	Building2,
	AlertTriangle,
	Receipt,
	Banknote,
	QrCode,
} from "lucide-react";

const OrderRequestCard = ({ request, onClick }) => {
	const getTimeElapsed = (startTime) => {
		const diff = Math.floor((new Date() - new Date(startTime)) / 60000);
		if (diff < 1) return "Just now";
		if (diff < 60) return `${diff}m ago`;
		const hours = Math.floor(diff / 60);
		return `${hours}h ago`;
	};

	const items = Array.isArray(request.items) ? request.items : [];
	const uncertainItemsCount = items.filter((i) => i.requires_stock_check).length;

	// Visual theme based on status
	const isStockCheck = request.status === "stock_checking";
	const isPaymentCheck = request.status === "paid_pending_approval";
	const isAwaitingPayment = request.status === "awaiting_payment";
	const isCancelled = request.status === "cancelled";

	let cardBorder = "border-base-300 bg-base-100";
	if (isCancelled) {
		cardBorder = "border-error/40 bg-error/5 hover:border-error";
	} else if (isStockCheck) {
		cardBorder = "border-warning/40 bg-warning/5 hover:border-warning";
	} else if (isPaymentCheck) {
		cardBorder = "border-info/40 bg-info/5 hover:border-info";
	} else if (isAwaitingPayment) {
		cardBorder = "border-base-300 bg-base-100/60 opacity-80";
	}

	return (
		<div
			onClick={onClick}
			className={`card shadow-sm border-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-95 p-3 rounded-2xl ${cardBorder}`}>
			<div className="flex items-start justify-between gap-2">
				{/* Top Left: Reference & Status */}
				<div className="flex items-center gap-1.5 flex-wrap">
					<span className="font-mono font-bold text-xs text-base-content/90 tracking-tight">
						#{request.request_number?.slice(-8) || request.id.slice(0, 6)}
					</span>

					{isCancelled && (
						<span className="badge badge-error badge-xs font-bold gap-1">
							⚠️ Cancelled by Customer
						</span>
					)}

					{isStockCheck && (
						<span className="badge badge-warning badge-xs font-bold gap-1 animate-pulse">
							<AlertTriangle className="w-2.5 h-2.5" />
							Stock Check
						</span>
					)}

					{isPaymentCheck && (
						<span className="badge badge-info badge-xs font-bold gap-1">
							<Receipt className="w-2.5 h-2.5" />
							Payment Review
						</span>
					)}

					{isAwaitingPayment && (
						<span className="badge badge-ghost badge-xs font-semibold">
							Awaiting Pay
						</span>
					)}
				</div>

				{/* Top Right: Time ago */}
				<div className="flex items-center gap-1 text-[10px] text-base-content/50 font-mono shrink-0">
					<Clock className="w-3 h-3" />
					<span>{getTimeElapsed(request.created_at)}</span>
				</div>
			</div>

			{/* Center: Customer Name & Destination */}
			<div className="mt-2 space-y-1">
				<div className="flex items-center justify-between">
					<div className="font-bold text-sm text-base-content truncate">
						{request.customer_name || "Customer"}
					</div>
					<div className="font-mono font-extrabold text-sm text-primary">
						฿{Number(request.total_amount || 0).toFixed(2)}
					</div>
				</div>

				{/* Phone */}
				{request.customer_phone && (
					<div className="flex items-center gap-1 text-[11px] text-base-content/70">
						<Phone className="w-3 h-3 text-base-content/40 shrink-0" />
						<span className="font-mono">{request.customer_phone}</span>
					</div>
				)}

				{/* Destination: Building / Address */}
				{(request.clean_building_info || request.clean_address || request.delivery_address) && (
					<div className="flex items-center gap-1 text-[11px] text-base-content/70 truncate">
						<Building2 className="w-3 h-3 text-primary shrink-0" />
						<span className="truncate">
							{request.clean_building_info
								? `${request.clean_building_info}${request.clean_address ? ` (${request.clean_address})` : ""}`
								: request.delivery_address}
						</span>
					</div>
				)}
			</div>

			{/* Footer: Items count & Payment indicator */}
			<div className="mt-2.5 pt-2 border-t border-base-200/60 flex items-center justify-between text-[11px] text-base-content/60">
				<div className="flex items-center gap-1.5 truncate">
					<span>
						{items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)} items
					</span>
					{uncertainItemsCount > 0 && (
						<span className="text-warning font-semibold text-[10px] flex items-center gap-0.5">
							⚠️ {uncertainItemsCount} uncertain
						</span>
					)}
				</div>

				<div className="flex items-center gap-1 shrink-0 font-medium">
					{request.payment_type === "cod" ? (
						<span className="badge badge-sm badge-ghost gap-1 text-[10px]">
							<Banknote className="w-3 h-3" />
							COD
						</span>
					) : (
						<span className="badge badge-sm badge-outline gap-1 text-[10px]">
							<QrCode className="w-3 h-3 text-info" />
							{request.payment_slip_url ? "Slip Attached" : "QR"}
						</span>
					)}
				</div>
			</div>
		</div>
	);
};

export default OrderRequestCard;
