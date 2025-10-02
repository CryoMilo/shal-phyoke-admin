// components/SubscriberOrders/SubscriberOrderCard.js
import { MapPin, Clock, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useOrderCreationStore } from "../../stores/subscriberOrderStore";

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

	const statusOptions = [
		{
			value: "Cooking",
			label: "Cooking",
			color: "badge-warning",
			bgColor: "bg-warning",
		},
		{
			value: "Ready",
			label: "Ready",
			color: "badge-success",
			bgColor: "bg-success",
		},
		{
			value: "Delivered",
			label: "Delivered",
			color: "badge-info",
			bgColor: "bg-info",
		},
		{
			value: "Archived",
			label: "Archived",
			color: "badge-neutral",
			bgColor: "bg-neutral",
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

	return (
		<div className="card bg-base-100 shadow border">
			<div className="card-body p-4">
				{/* Header */}
				<div className="flex justify-between items-start mb-3">
					<div className="flex-1">
						<h3 className="card-title text-lg mb-1">{order.subscriber_name}</h3>
						<p className="text-sm text-gray-500">{order.plan_name}</p>
					</div>

					{/* Clickable Status Badge */}
					<div className="relative" ref={dropdownRef}>
						<button
							onClick={() => setShowStatusDropdown(!showStatusDropdown)}
							disabled={updating}
							className={`btn btn-xs gap-1 ${
								currentStatus?.bgColor
							} text-white border-0 hover:opacity-80 transition-opacity ${
								updating ? "loading" : ""
							}`}>
							{updating ? (
								"Updating..."
							) : (
								<>
									{order.status}
									<ChevronDown className="w-3 h-3" />
								</>
							)}
						</button>

						{/* Status Dropdown */}
						{showStatusDropdown && (
							<div className="absolute top-8 right-0 z-10 mt-1 w-32 bg-base-100 border rounded-lg shadow-lg">
								<ul className="py-1">
									{statusOptions
										.filter((option) => option.value !== order.status)
										.map((option) => (
											<li key={option.value}>
												<button
													onClick={() => handleStatusChange(option.value)}
													className={`w-full text-left px-3 py-2 text-sm hover:bg-base-200 transition-colors flex items-center gap-2`}>
													<span
														className={`badge badge-xs ${option.color}`}></span>
													{option.label}
												</button>
											</li>
										))}
								</ul>
							</div>
						)}
					</div>
				</div>

				{/* Menu Items - Clean Style */}
				<div className="space-y-2 mb-3">
					{/* Main Dishes */}
					{mainDishes.map((dish) => (
						<div key={dish.id} className="flex items-center gap-2 text-sm">
							<span className="badge badge-primary badge-sm">Main</span>
							<div>
								<p className="font-medium">{dish.name_burmese}</p>
								<p className="text-xs text-gray-500">{dish.name_english}</p>
							</div>
						</div>
					))}

					{/* Side Dishes */}
					{sideDishes.map((dish) => (
						<div key={dish.id} className="flex items-center gap-2 text-sm">
							<span className="badge badge-secondary badge-sm">Side</span>
							<div>
								<p className="font-medium">{dish.name_burmese}</p>
								<p className="text-xs text-gray-500">{dish.name_english}</p>
							</div>
						</div>
					))}
				</div>

				{/* Order Details */}
				<div className="flex justify-between items-center text-sm text-gray-600">
					<div className="flex items-center gap-1">
						<MapPin className="w-3 h-3" />
						<span>{order.eat_in ? "Dine-in" : "Delivery"}</span>
					</div>
					<div className="flex items-center gap-1">
						<Clock className="w-3 h-3" />
						<span>{new Date(order.order_date).toLocaleDateString()}</span>
					</div>
				</div>

				{order.note && (
					<div className="mt-2 p-2 bg-base-200 rounded text-sm">
						<span className="font-medium">Note:</span> {order.note}
					</div>
				)}
			</div>
		</div>
	);
};
