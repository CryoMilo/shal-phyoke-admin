import React, { useEffect, useState } from "react";
import {
	User,
	MapPin,
	Home,
	Truck,
	Clock,
	CheckCircle,
	ShoppingBag,
	Edit,
	Trash2,
} from "lucide-react";
import useSubscribersStore from "../../stores/useSubscriberStore";
import useMenuStore from "../../stores/menuStore";
import { useOrderCreationStore } from "../../stores/subscriberOrderStore";
import { avatar_placeholder } from "../../constants";

export const SubscriberOrderCard = ({ order }) => {
	const { fetchSubscriberWithId } = useSubscribersStore();
	const { fetchMenuWithId } = useMenuStore();
	const { updateOrderStatus, deleteOrder } = useOrderCreationStore();

	const [subscriber, setSubscriber] = useState(null);
	const [menus, setMenus] = useState([]);
	const [loading, setLoading] = useState(true);
	const [updatingStatus, setUpdatingStatus] = useState(false);

	useEffect(() => {
		const loadData = async () => {
			setLoading(true);

			try {
				// Fetch subscriber data
				const { data: subscriberData } = await fetchSubscriberWithId(
					order.subscriber_id
				);
				setSubscriber(subscriberData);

				// Fetch menu items in parallel
				const menuResults = await Promise.all(
					order.menu_items.map((id) => fetchMenuWithId(id))
				);

				setMenus(menuResults.map((r) => r.data).filter(Boolean));
			} catch (error) {
				console.error("Error loading order data:", error);
			} finally {
				setLoading(false);
			}
		};

		if (order) loadData();
	}, [order, fetchSubscriberWithId, fetchMenuWithId]);

	const getStatusColor = (status) => {
		switch (status) {
			case "Cooking":
				return "select-warning";
			case "Ready":
				return "select-info";
			case "Delivering":
				return "select-primary";
			case "Delivered":
				return "select-success";
			case "Cancelled":
				return "select-error";
			default:
				return "select-ghost";
		}
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (date.toDateString() === today.toDateString()) {
			return "Today";
		} else if (date.toDateString() === tomorrow.toDateString()) {
			return "Tomorrow";
		} else {
			return date.toLocaleDateString();
		}
	};

	const handleStatusChange = async (newStatus) => {
		setUpdatingStatus(true);
		try {
			await updateOrderStatus(order.id, newStatus);
		} catch (error) {
			console.error("Error updating status:", error);
			alert("Error updating order status");
		} finally {
			setUpdatingStatus(false);
		}
	};

	const handleDelete = async () => {
		if (confirm("Are you sure you want to delete this order?")) {
			try {
				await deleteOrder(order.id);
			} catch (error) {
				console.error("Error deleting order:", error);
				alert("Error deleting order");
			}
		}
	};

	const handleEdit = () => {
		// This would typically open an edit modal
		// For now, just show an alert - you can implement the edit modal later
		alert("Edit functionality to be implemented");
	};

	if (loading) {
		return (
			<div className="card bg-base-100 shadow-lg">
				<div className="card-body">
					<div className="flex justify-center items-center py-8">
						<span className="loading loading-spinner loading-md"></span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-200">
			<div className="card-body">
				{/* Customer Info Header */}
				<div className="flex items-start gap-4 mb-4">
					<div className="avatar">
						<div className="w-20 rounded-full">
							<img src={subscriber?.image_url || avatar_placeholder} />
						</div>
					</div>
					<div className="flex-1">
						<h3 className="card-title text-lg">
							{subscriber?.name || "Unknown Customer"}
						</h3>
						<div className="text-gray-600 text-sm space-y-1">
							{subscriber?.line_id && (
								<div className="flex items-center gap-1">
									<User className="w-3 h-3" />
									<span>{subscriber.line_id}</span>
								</div>
							)}
							{subscriber?.delivery_address && (
								<div className="flex items-center gap-1">
									<MapPin className="w-3 h-3" />
									<span className="truncate max-w-48">
										{subscriber.delivery_address}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Order Details */}
				<div className="bg-base-200 rounded-lg p-4 mb-4">
					<h4 className="font-bold mb-3 flex items-center gap-2">
						<ShoppingBag className="w-4 h-4" />
						Order Details
					</h4>
					<div className="space-y-2">
						<div className="text-sm">
							<strong>Date:</strong> {formatDate(order.order_date)}
						</div>
						<div className="text-sm">
							<strong>Items:</strong>
							{menus.length > 0 ? (
								<div className="mt-1 space-y-1">
									{menus.map((menu, index) => (
										<div
											key={index}
											className="flex justify-between items-center bg-base-100 px-2 py-1 rounded text-xs">
											<span className="font-medium">{menu.name_burmese}</span>
											<span className="text-gray-500">{menu.name_english}</span>
										</div>
									))}
								</div>
							) : (
								<span className="text-gray-500 ml-1">No items selected</span>
							)}
						</div>
						{/* <div className="text-sm">
							<strong>Points Used:</strong>{" "}
							<span className="font-mono">{order.point_use || 1}</span>
						</div> */}
					</div>
				</div>

				{/* Service Type & Status Changer */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						{order.eat_in ? (
							<>
								<Home className="w-5 h-5 text-success" />
								<span className="font-medium text-success">Dine In</span>
							</>
						) : (
							<>
								<Truck className="w-5 h-5 text-info" />
								<span className="font-medium text-info">Delivery</span>
							</>
						)}
					</div>
					<div className="relative">
						<select
							className={`select select-bordered select-sm ${getStatusColor(
								order.status
							)}`}
							value={order.status || "Cooking"}
							onChange={(e) => handleStatusChange(e.target.value)}
							disabled={updatingStatus}>
							<option value="Cooking">Cooking</option>
							<option value="Ready">Ready</option>
							<option value="Delivering">Delivering</option>
							<option value="Delivered">Delivered</option>
							<option value="Cancelled">Cancelled</option>
						</select>
						{updatingStatus && (
							<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
								<span className="loading loading-spinner loading-xs"></span>
							</div>
						)}
					</div>
				</div>

				{/* Notes */}
				{order.note && (
					<div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mb-4">
						<div className="text-sm">
							<strong className="text-yellow-800">Note:</strong>
							<p className="text-yellow-700 mt-1">{order.note}</p>
						</div>
					</div>
				)}

				{/* Add-on */}
				{/* {order.add_on && (
					<div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mb-4">
						<div className="text-sm">
							<strong className="text-blue-800">Add-on:</strong>
							<p className="text-blue-700 mt-1">{order.add_on}</p>
						</div>
					</div>
				)} */}

				{/* Action Buttons */}
				<div className="card-actions justify-end mb-3">
					<button
						className="btn btn-sm btn-ghost"
						onClick={handleEdit}
						title="Edit Order">
						<Edit className="w-4 h-4" />
					</button>
					<button
						className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
						onClick={handleDelete}
						title="Delete Order">
						<Trash2 className="w-4 h-4" />
					</button>
				</div>

				{/* Footer Info */}
				<div className="text-xs text-gray-500 pt-3 border-t">
					Order #{order.id?.slice(-6) || "Unknown"} • Created{" "}
					{new Date(order.created_at || order.order_date).toLocaleDateString()}
				</div>
			</div>
		</div>
	);
};
