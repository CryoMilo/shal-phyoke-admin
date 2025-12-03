// components/SubscriberOrders/SubscriberOrderCard.js
import { MapPin, Clock, Truck, CheckCircle, DollarSign } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useOrderCreationStore } from "../../stores/subscriberOrderStore";
import { calculateAddOnTotal } from "../../utils/calculateAddOnTotal";

export const SubscriberOrderCard = ({ order, onStatusUpdate }) => {
	const { updateOrderStatus } = useOrderCreationStore();
	const [showStatusDropdown, setShowStatusDropdown] = useState(false);
	const [updating, setUpdating] = useState(false);
	const dropdownRef = useRef(null);

	const getMenuItemsByType = () => {
		if (order.menu_items_structured) {
			return {
				mainDishes: order.main_dish_details || [],
				sideDishes: order.side_dish_details || [],
			};
		}
		return { mainDishes: [], sideDishes: [] };
	};

	const { mainDishes, sideDishes } = getMenuItemsByType();
	const addOns = order.add_ons_details || [];
	const totalAddOnPrice = calculateAddOnTotal(addOns);
	const hasAddOns = addOns.length > 0;

	// Determine payment status for add-ons
	const getAddOnPaymentStatus = () => {
		if (!hasAddOns) return null;
		return order.addons_paid ? "paid" : "unpaid";
	};

	const paymentStatus = getAddOnPaymentStatus();

	const statusOptions = [
		{ value: "Cooking", label: "Cooking", badge: "badge-warning" },
		{ value: "Ready", label: "Ready", badge: "badge-info" },
		{ value: "Delivered", label: "Delivered", badge: "badge-success" },
		{ value: "Archived", label: "Archived", badge: "badge-neutral" },
	];

	const currentStatus = statusOptions.find((s) => s.value === order.status);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setShowStatusDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleStatusChange = async (newStatus) => {
		setUpdating(true);
		try {
			await updateOrderStatus(order.id, newStatus);
			setShowStatusDropdown(false);
			if (onStatusUpdate) {
				onStatusUpdate();
			}
		} catch (error) {
			console.error("Error updating status:", error);
		} finally {
			setUpdating(false);
		}
	};

	const formatTime = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	return (
		<div className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-all duration-300">
			{/* Header Section */}
			<div className="p-4 border-b border-base-300 bg-base-200 rounded-t-2xl">
				<div className="flex items-center justify-between">
					{/* Subscriber Info */}
					<div className="flex items-center space-x-3">
						{/* Subscriber Image */}
						<div className="avatar">
							<div class="w-24 rounded">
								<img src={order.subscriber_image_url} />
							</div>
						</div>

						<div>
							<h3 className="font-bold text-lg">{order.subscriber_name}</h3>
							<div className="flex items-center space-x-2 mt-1">
								<span className="badge badge-primary">{order.plan_name}</span>
								<span className="flex items-center text-sm text-base-content/70">
									<Clock className="w-3 h-3 mr-1" />
									{formatTime(order.created_at)}
								</span>
							</div>
						</div>
					</div>

					{/* Status & Actions */}
					<div className="flex items-center space-x-3">
						{/* Status Badge */}
						<div className="relative" ref={dropdownRef}>
							<button
								onClick={() => setShowStatusDropdown(!showStatusDropdown)}
								disabled={updating}
								className={`btn btn-sm gap-2 ${
									currentStatus?.badge
								} text-primary ${updating ? "loading" : ""}`}>
								{updating ? (
									"Updating..."
								) : (
									<>
										{order.status}
										<svg
											className="w-3 h-3"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</>
								)}
							</button>

							{/* Status Dropdown */}
							{showStatusDropdown && (
								<div className="absolute top-12 right-0 z-20 w-40 bg-base-100 border border-base-300 rounded-box shadow-lg">
									<ul className="menu menu-sm p-2">
										{statusOptions
											.filter((option) => option.value !== order.status)
											.map((option) => (
												<li key={option.value}>
													<button
														onClick={() => handleStatusChange(option.value)}
														className="flex items-center space-x-2">
														<span
															className={`badge badge-xs ${option.badge}`}></span>
														<span>{option.label}</span>
													</button>
												</li>
											))}
									</ul>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Content Section */}
			<div className="card-body p-4">
				{/* Order Info */}
				<div className="flex items-center justify-between mb-4">
					{/* <div className="flex items-center space-x-2">
						<div
							className={`badge gap-1 ${
								order.eat_in ? "badge-warning" : "badge-info"
							}`}>
							{order.eat_in ? (
								<>
									<MapPin className="w-3 h-3" />
									<span>Pickup</span>
								</>
							) : (
								<>
									<Truck className="w-3 h-3" />
									<span>Delivery</span>
								</>
							)}
						</div>
						{order.delivery_address && !order.eat_in && (
							<span className="text-sm text-base-content/70">
								{order.delivery_address}
							</span>
						)}
					</div> */}

					{/* Order Date */}
					<div className="text-sm text-base-content/70">
						{new Date(order.order_date).toLocaleDateString("en-US", {
							weekday: "short",
							month: "short",
							day: "numeric",
						})}
					</div>
				</div>

				{/* Menu Items */}
				<div className="space-y-4">
					{/* Main Dishes */}
					{mainDishes.length > 0 && (
						<div>
							<h4 className="text-xs font-semibold text-base-content/70 uppercase tracking-wide mb-2">
								Main Dishes
							</h4>
							<div className="space-y-2">
								{mainDishes.map((dish) => (
									<div
										key={dish.id}
										className="flex justify-between items-center p-3 bg-base-200 rounded-box">
										<div className="flex-1">
											<p className="font-medium">{dish.name_burmese}</p>
											{dish.name_english && (
												<p className="text-sm text-base-content/70">
													{dish.name_english}
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Side Dishes */}
					{sideDishes.length > 0 && (
						<div>
							<h4 className="text-xs font-semibold text-base-content/70 uppercase tracking-wide mb-2">
								Side Dishes
							</h4>
							<div className="space-y-2">
								{sideDishes.map((dish) => (
									<div
										key={dish.id}
										className="flex justify-between items-center p-3 bg-base-200 rounded-box">
										<div className="flex-1">
											<p className="font-medium">{dish.name_burmese}</p>
											{dish.name_english && (
												<p className="text-sm text-base-content/70">
													{dish.name_english}
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Add-Ons Section */}
					{hasAddOns && (
						<div className="border-t border-base-300 pt-4">
							<div className="flex items-center justify-between mb-3">
								<h4 className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
									Extra Items
								</h4>
								<div className="flex items-center space-x-3">
									<span className="text-sm font-bold text-primary">
										+฿{totalAddOnPrice}
									</span>

									{/* Payment Status Stamp */}
									{paymentStatus && (
										<div
											className="tooltip"
											data-tip={
												paymentStatus === "paid"
													? "Add-ons Paid"
													: "Add-ons Unpaid"
											}>
											<div
												className={`badge gap-1 ${
													paymentStatus === "paid"
														? "badge-success"
														: "badge-error"
												}`}>
												{paymentStatus === "paid" ? (
													<>
														<CheckCircle className="w-3 h-3" />
														<span>PAID</span>
													</>
												) : (
													<>
														<DollarSign className="w-3 h-3" />
														<span>UNPAID</span>
													</>
												)}
											</div>
										</div>
									)}
								</div>
							</div>

							<div className="space-y-2">
								{addOns.map((addOn) => (
									<div
										key={addOn.id}
										className="flex justify-between items-center p-3 bg-warning/20 rounded-box border border-warning/30">
										<div className="flex-1">
											<p className="font-medium">
												{addOn.menu_item.name_burmese}
											</p>
											{addOn.menu_item.name_english && (
												<p className="text-sm text-base-content/70">
													{addOn.menu_item.name_english}
												</p>
											)}
											{addOn.quantity > 1 && (
												<p className="text-xs text-base-content/50">
													Quantity: {addOn.quantity}
												</p>
											)}
										</div>
										<div className="text-right">
											<p className="text-sm font-medium">
												฿{addOn.menu_item.price}
											</p>
											{addOn.quantity > 1 && (
												<p className="text-xs text-base-content/50">
													฿{addOn.menu_item.price * addOn.quantity}
												</p>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Note */}
				{order.note && (
					<div className="mt-4 p-3 bg-info/20 rounded-box border border-info/30">
						<p className="text-sm">
							<span className="font-semibold">Note:</span> {order.note}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
