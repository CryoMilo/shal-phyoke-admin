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
		// You can replace this with actual payment logic from your database
		return order.payment_for_extra ? "paid" : "unpaid";
	};

	const paymentStatus = getAddOnPaymentStatus();

	const statusOptions = [
		{
			value: "Cooking",
			label: "Cooking",
			color: "bg-yellow-500",
			textColor: "text-yellow-800",
		},
		{
			value: "Ready",
			label: "Ready",
			color: "bg-blue-500",
			textColor: "text-blue-800",
		},
		{
			value: "Delivered",
			label: "Delivered",
			color: "bg-green-500",
			textColor: "text-green-800",
		},
		{
			value: "Archived",
			label: "Archived",
			color: "bg-gray-500",
			textColor: "text-gray-800",
		},
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
		<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
			{/* Header Section */}
			<div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
				<div className="flex items-center justify-between">
					{/* Subscriber Info */}
					<div className="flex items-center space-x-3">
						{/* Subscriber Image */}
						<div className="relative">
							<div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
								{order.subscriber_name?.charAt(0) || "U"}
							</div>
						</div>

						<div>
							<h3 className="font-bold text-gray-900 text-lg">
								{order.subscriber_name}
							</h3>
							<div className="flex items-center space-x-2 mt-1">
								<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
									{order.plan_name}
								</span>
								<span className="flex items-center text-xs text-gray-600">
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
								className={`px-3 py-1.5 rounded-full text-white font-medium text-sm shadow-sm transition-all duration-200 flex items-center space-x-2 ${
									currentStatus?.color
								} ${updating ? "opacity-50" : "hover:shadow-md"}`}>
								{updating ? (
									<div className="flex items-center space-x-2">
										<div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
										<span>Updating...</span>
									</div>
								) : (
									<>
										<div className="w-2 h-2 bg-white rounded-full"></div>
										<span>{order.status}</span>
									</>
								)}
							</button>

							{/* Status Dropdown */}
							{showStatusDropdown && (
								<div className="absolute top-10 right-0 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-xl">
									{statusOptions
										.filter((option) => option.value !== order.status)
										.map((option) => (
											<button
												key={option.value}
												onClick={() => handleStatusChange(option.value)}
												className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-2 first:rounded-t-lg last:rounded-b-lg">
												<div
													className={`w-2 h-2 rounded-full ${option.color}`}></div>
												<span>{option.label}</span>
											</button>
										))}
								</div>
							)}
						</div>

						{/* Action Buttons */}
						{/* <div className="flex space-x-2">
							{order.status !== "Delivered" && order.status !== "Archived" && (
								<button
									onClick={handleDelivered}
									disabled={updating}
									className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-1 shadow-sm">
									<CheckCircle className="w-4 h-4" />
									<span>Deliver</span>
								</button>
							)}

							<button
								onClick={() => onEdit?.(order)}
								className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
								title="Edit Order">
								<Edit className="w-4 h-4" />
							</button>
						</div> */}
					</div>
				</div>
			</div>

			{/* Content Section */}
			<div className="p-4">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center space-x-2 text-sm">
						<div
							className={`flex items-center space-x-1 px-3 py-1.5 rounded-full ${
								order.eat_in
									? "bg-orange-100 text-orange-800"
									: "bg-purple-100 text-purple-800"
							}`}>
							{order.eat_in ? (
								<>
									<MapPin className="w-4 h-4" />
									<span>Pickup</span>
								</>
							) : (
								<>
									<Truck className="w-4 h-4" />
									<span>Delivery</span>
								</>
							)}
						</div>
						{order.delivery_address && !order.eat_in && (
							<span className="text-gray-600 text-sm">
								{order.delivery_address}
							</span>
						)}
					</div>

					{/* Order Date */}
					<div className="text-sm text-gray-500">
						{new Date(order.order_date).toLocaleDateString("en-US", {
							weekday: "short",
							month: "short",
							day: "numeric",
						})}
					</div>
				</div>

				{/* Menu Items */}
				<div className="space-y-3">
					{/* Main Dishes */}
					{mainDishes.length > 0 && (
						<div>
							<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
								Main Dishes
							</h4>
							<div className="space-y-2">
								{mainDishes.map((dish) => (
									<div
										key={dish.id}
										className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
										<div className="flex-1">
											<p className="font-medium text-gray-900">
												{dish.name_burmese}
											</p>
											{dish.name_english && (
												<p className="text-sm text-gray-600">
													{dish.name_english}
												</p>
											)}
										</div>
										{/* <span className="text-sm font-medium text-gray-700">
											฿{dish.price}
										</span> */}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Side Dishes */}
					{sideDishes.length > 0 && (
						<div>
							<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
								Side Dishes
							</h4>
							<div className="space-y-2">
								{sideDishes.map((dish) => (
									<div
										key={dish.id}
										className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
										<div className="flex-1">
											<p className="font-medium text-gray-900">
												{dish.name_burmese}
											</p>
											{dish.name_english && (
												<p className="text-sm text-gray-600">
													{dish.name_english}
												</p>
											)}
										</div>
										{/* <span className="text-sm font-medium text-gray-700">
											฿{dish.price}
										</span> */}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Add-Ons Section */}
					{hasAddOns && (
						<div className="border-t pt-3">
							<div className="flex items-center justify-between mb-2">
								<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
									Extra Items
								</h4>
								<div className="flex items-center space-x-2">
									<span className="text-sm font-bold text-gray-900">
										+฿{totalAddOnPrice}
									</span>

									{/* Payment Status Stamp */}
									{paymentStatus && (
										<div
											className={`relative ${
												paymentStatus === "paid"
													? "text-green-600"
													: "text-red-600"
											}`}>
											{/* Stamp Icon - Replace with your actual stamp images */}
											<div
												className={`w-16 h-8 border-2 rounded flex items-center justify-center text-xs font-bold ${
													paymentStatus === "paid"
														? "border-green-400 bg-green-50"
														: "border-red-400 bg-red-50"
												}`}>
												{paymentStatus === "paid" ? (
													<div className="flex items-center space-x-1">
														<CheckCircle className="w-3 h-3" />
														<span>PAID</span>
													</div>
												) : (
													<div className="flex items-center space-x-1">
														<DollarSign className="w-3 h-3" />
														<span>UNPAID</span>
													</div>
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
										className="flex justify-between items-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
										<div className="flex-1">
											<p className="font-medium text-gray-900">
												{addOn.menu_item.name_burmese}
											</p>
											{addOn.menu_item.name_english && (
												<p className="text-sm text-gray-600">
													{addOn.menu_item.name_english}
												</p>
											)}
											{addOn.quantity > 1 && (
												<p className="text-xs text-gray-500">
													Quantity: {addOn.quantity}
												</p>
											)}
										</div>
										<div className="text-right">
											<p className="text-sm font-medium text-gray-700">
												฿{addOn.menu_item.price}
											</p>
											{addOn.quantity > 1 && (
												<p className="text-xs text-gray-500">
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
					<div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-sm text-blue-800">
							<span className="font-semibold">Note:</span> {order.note}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
