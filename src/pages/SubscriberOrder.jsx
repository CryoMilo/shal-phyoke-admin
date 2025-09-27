import { useState } from "react";
import {
	useSubscriberOrdersStore,
	useSubscribersStore,
} from "../stores/useSubscriberOrderStore";

import React, { useEffect } from "react";
import {
	Plus,
	Edit,
	Trash2,
	Eye,
	X,
	MapPin,
	Phone,
	User,
	ShoppingBag,
	Home,
	Truck,
} from "lucide-react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscriberOrderSchema } from "../validations/subscriberOrderSchema";

export const SubscriberOrder = () => {
	const {
		orders,
		loading,
		fetchOrders,
		createOrder,
		updateOrderById,
		deleteOrderById,
	} = useSubscriberOrdersStore();
	const { fetchSubscribers, fetchMenuItems } = useSubscribersStore();

	const [showModal, setShowModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [editingOrder, setEditingOrder] = useState(null);
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [subscribers, setSubscribers] = useState([]);
	const [menuItems, setMenuItems] = useState([]);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
		setValue,
		control,
	} = useForm({
		resolver: zodResolver(subscriberOrderSchema),
	});

	const { field: menuItemsField } = useController({
		name: "menu_items",
		control,
		defaultValue: [],
	});

	useEffect(() => {
		fetchOrders();
		loadFormData();
	}, []);

	const loadFormData = async () => {
		const [subscribersData, menuItemsData] = await Promise.all([
			fetchSubscribers(),
			fetchMenuItems(),
		]);
		setSubscribers(subscribersData);
		setMenuItems(menuItemsData);
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "Cooking":
				return "badge-warning";
			case "Ready":
				return "badge-info";
			case "Delivering":
				return "badge-primary";
			case "Delivered":
				return "badge-success";
			case "Cancelled":
				return "badge-error";
			default:
				return "badge-ghost";
		}
	};

	const openCreateModal = () => {
		setEditingOrder(null);
		reset({
			subscriber_id: "",
			order_date: new Date().toISOString().split("T")[0],
			menu_items: [],
			eat_in: false,
			point_use: 1,
			add_on: "",
			note: "",
			status: "Cooking",
		});
		setShowModal(true);
	};

	const openEditModal = (order) => {
		setEditingOrder(order);
		setValue("subscriber_id", order.subscriber_id);
		setValue("order_date", order.order_date);
		setValue("menu_items", order.menu_items || []);
		setValue("eat_in", order.eat_in);
		setValue("point_use", order.point_use);
		setValue("add_on", order.add_on || "");
		setValue("note", order.note || "");
		setValue("status", order.status);
		setShowModal(true);
	};

	const onSubmit = async (data) => {
		try {
			let result;
			if (editingOrder) {
				result = await updateOrderById(editingOrder.id, data);
			} else {
				result = await createOrder(data);
			}

			if (result.error) {
				throw result.error;
			}

			setShowModal(false);
			reset();
		} catch (error) {
			console.error("Error saving order:", error);
			alert("Error saving order");
		}
	};

	const handleDelete = async (id) => {
		if (confirm("Are you sure you want to delete this order?")) {
			try {
				const result = await deleteOrderById(id);
				if (result.error) {
					throw result.error;
				}
			} catch (error) {
				console.error("Error deleting order:", error);
				alert("Error deleting order");
			}
		}
	};

	const handleMenuItemToggle = (itemId) => {
		const currentItems = menuItemsField.value || [];
		const newItems = currentItems.includes(itemId)
			? currentItems.filter((id) => id !== itemId)
			: [...currentItems, itemId];
		menuItemsField.onChange(newItems);
	};

	const getSelectedMenuItemsNames = (itemIds) => {
		if (!itemIds || itemIds.length === 0) return "No items selected";
		return itemIds
			.map((id) => {
				const item = menuItems.find((mi) => mi.id === id);
				return item ? item.name_english : "Unknown Item";
			})
			.join(", ");
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<span className="loading loading-spinner loading-lg"></span>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">Subscription Orders</h1>
					<p className="text-gray-600">Manage customer orders</p>
				</div>
				<button className="btn btn-primary" onClick={openCreateModal}>
					<Plus className="w-4 h-4 mr-2" />
					Create Order
				</button>
			</div>

			{/* Orders Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{orders.map((order) => (
					<div key={order.id} className="card bg-base-100 shadow-xl">
						<div className="card-body">
							{/* Subscriber Info */}
							<div className="flex items-start gap-4 mb-4">
								<div className="avatar placeholder">
									<div className="bg-primary text-primary-content rounded-full w-12">
										<span className="text-lg font-bold">
											{order.subscribers?.name?.charAt(0) || "U"}
										</span>
									</div>
								</div>
								<div className="flex-1">
									<h3 className="card-title">
										{order.subscribers?.name || "Unknown"}
									</h3>
									<div className="text-gray-600 text-sm space-y-1">
										<div className="flex items-center gap-1">
											<User className="w-3 h-3" />
											<span>{order.subscribers?.line_id || "No LINE ID"}</span>
										</div>
										<div className="flex items-center gap-1">
											<MapPin className="w-3 h-3" />
											<span className="truncate">
												{order.subscribers?.delivery_address || "No address"}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Order Info */}
							<div className="bg-base-200 rounded-lg p-4 mb-4">
								<h4 className="font-bold mb-2 flex items-center gap-2">
									<ShoppingBag className="w-4 h-4" />
									Order Details
								</h4>
								<div className="text-sm space-y-1">
									<div>
										<strong>Items:</strong>{" "}
										{getSelectedMenuItemsNames(order.menu_items)}
									</div>
									<div>
										<strong>Points Used:</strong> {order.point_use}
									</div>
									<div>
										<strong>Date:</strong>{" "}
										{new Date(order.order_date).toLocaleDateString()}
									</div>
									{order.add_on && (
										<div>
											<strong>Add-on:</strong> {order.add_on}
										</div>
									)}
								</div>
							</div>

							{/* Service Type & Status */}
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
								<span
									className={`badge ${getStatusColor(order.status)} badge-lg`}>
									{order.status}
								</span>
							</div>

							{/* Action Buttons */}
							<div className="card-actions justify-end">
								<button
									className="btn btn-sm btn-ghost"
									onClick={() => {
										setSelectedOrder(order);
										setShowDetailsModal(true);
									}}>
									<Eye className="w-4 h-4" />
								</button>
								<button
									className="btn btn-sm btn-ghost"
									onClick={() => openEditModal(order)}>
									<Edit className="w-4 h-4" />
								</button>
								<button
									className="btn btn-sm btn-ghost text-red-600"
									onClick={() => handleDelete(order.id)}>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{orders.length === 0 && (
				<div className="text-center py-12">
					<p className="text-gray-500 text-lg">No orders found</p>
					<button className="btn btn-primary mt-4" onClick={openCreateModal}>
						Create Your First Order
					</button>
				</div>
			)}

			{/* Create/Edit Modal */}
			{showModal && (
				<div className="modal modal-open">
					<div className="modal-box w-11/12 max-w-4xl">
						<h3 className="font-bold text-lg mb-4">
							{editingOrder ? "Edit Order" : "Create New Order"}
						</h3>

						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="form-control">
									<label className="label">
										<span className="label-text">Subscriber *</span>
									</label>
									<select
										{...register("subscriber_id")}
										className="select select-bordered">
										<option value="">Select a subscriber</option>
										{subscribers.map((sub) => (
											<option key={sub.id} value={sub.id}>
												{sub.name} - {sub.subscription_plans?.plan_name}
											</option>
										))}
									</select>
									{errors.subscriber_id && (
										<span className="text-red-500 text-sm">
											{errors.subscriber_id.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Order Date *</span>
									</label>
									<input
										{...register("order_date")}
										type="date"
										className="input input-bordered"
									/>
									{errors.order_date && (
										<span className="text-red-500 text-sm">
											{errors.order_date.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Points Used *</span>
									</label>
									<input
										{...register("point_use", { valueAsNumber: true })}
										type="number"
										min="1"
										className="input input-bordered"
										placeholder="1"
									/>
									{errors.point_use && (
										<span className="text-red-500 text-sm">
											{errors.point_use.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Status</span>
									</label>
									<select
										{...register("status")}
										className="select select-bordered">
										<option value="Cooking">Cooking</option>
										<option value="Ready">Ready</option>
										<option value="Delivering">Delivering</option>
										<option value="Delivered">Delivered</option>
										<option value="Cancelled">Cancelled</option>
									</select>
								</div>
							</div>

							<div className="form-control">
								<label className="label cursor-pointer justify-start gap-2">
									<input
										{...register("eat_in")}
										type="checkbox"
										className="checkbox"
									/>
									<span className="label-text">
										Dine In (instead of delivery)
									</span>
								</label>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Menu Items *</span>
								</label>
								<div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
									{menuItems.map((item) => (
										<label
											key={item.id}
											className="cursor-pointer label justify-start gap-2">
											<input
												type="checkbox"
												className="checkbox checkbox-sm"
												checked={
													menuItemsField.value?.includes(item.id) || false
												}
												onChange={() => handleMenuItemToggle(item.id)}
											/>
											<span className="text-sm">
												{item.name_english} ({item.name_burmese}) - ฿
												{item.price}
											</span>
										</label>
									))}
								</div>
								{errors.menu_items && (
									<span className="text-red-500 text-sm">
										{errors.menu_items.message}
									</span>
								)}
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Add-on</span>
								</label>
								<input
									{...register("add_on")}
									className="input input-bordered"
									placeholder="Extra requests"
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Note</span>
								</label>
								<textarea
									{...register("note")}
									className="textarea textarea-bordered"
									placeholder="Order notes"
									rows="2"></textarea>
							</div>

							<div className="modal-action">
								<button
									type="button"
									className="btn btn-ghost"
									onClick={() => setShowModal(false)}>
									Cancel
								</button>
								<button
									onClick={handleSubmit(onSubmit)}
									className="btn btn-primary">
									{editingOrder ? "Update" : "Create"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Details Modal */}
			{showDetailsModal && selectedOrder && (
				<div className="modal modal-open">
					<div className="modal-box w-11/12 max-w-lg">
						<div className="flex justify-between items-start mb-4">
							<h3 className="font-bold text-lg">Order Details</h3>
							<button
								className="btn btn-sm btn-ghost"
								onClick={() => setShowDetailsModal(false)}>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="avatar placeholder">
									<div className="bg-primary text-primary-content rounded-full w-12">
										<span>
											{selectedOrder.subscribers?.name?.charAt(0) || "U"}
										</span>
									</div>
								</div>
								<div>
									<div className="font-bold text-lg">
										{selectedOrder.subscribers?.name}
									</div>
									<div className="text-sm text-gray-500">
										{selectedOrder.subscribers?.line_id}
									</div>
								</div>
							</div>

							<div className="divider"></div>

							<div>
								<strong>Order Date:</strong>{" "}
								{new Date(selectedOrder.order_date).toLocaleDateString()}
							</div>

							<div>
								<strong>Service Type:</strong>
								<span
									className={`badge ${
										selectedOrder.eat_in ? "badge-success" : "badge-info"
									} ml-2`}>
									{selectedOrder.eat_in ? "Dine In" : "Delivery"}
								</span>
							</div>

							<div>
								<strong>Status:</strong>
								<span
									className={`badge ${getStatusColor(
										selectedOrder.status
									)} ml-2`}>
									{selectedOrder.status}
								</span>
							</div>

							<div>
								<strong>Points Used:</strong> {selectedOrder.point_use}
							</div>

							<div>
								<strong>Menu Items:</strong>
								<div className="mt-1 text-sm">
									{getSelectedMenuItemsNames(selectedOrder.menu_items)}
								</div>
							</div>

							{selectedOrder.add_on && (
								<div>
									<strong>Add-on:</strong>
									<div className="mt-1 p-2 bg-yellow-50 rounded">
										{selectedOrder.add_on}
									</div>
								</div>
							)}

							{selectedOrder.note && (
								<div>
									<strong>Note:</strong>
									<div className="mt-1 p-2 bg-gray-50 rounded">
										{selectedOrder.note}
									</div>
								</div>
							)}

							<div>
								<strong>Delivery Address:</strong>
								<div className="mt-1 p-2 bg-gray-50 rounded text-sm">
									{selectedOrder.subscribers?.delivery_address}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
