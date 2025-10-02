// pages/SubscriberOrder.js
import React, { useState, useEffect } from "react";
import { Plus, Archive } from "lucide-react";
import { useOrderCreationStore } from "../stores/subscriberOrderStore";
import useSubscribersStore from "../stores/useSubscriberStore";
import { CreateOrderModal } from "../components/SubscriberOrders/CreateOrderModal/CreateOrderModal";
import { OrdersGrid } from "../components/SubscriberOrders/OrdersGrid";
import { Link } from "@tanstack/react-router";

export const SubscriberOrder = () => {
	const { orders, loadingOrders, fetchSubscriberOrders, resetSelections } =
		useOrderCreationStore();

	const { fetchSubscribers } = useSubscribersStore();

	const [showCreateModal, setShowCreateModal] = useState(false);

	useEffect(() => {
		fetchSubscribers();
		fetchSubscriberOrders();
	}, [fetchSubscribers, fetchSubscriberOrders]);

	const closeModal = () => {
		setShowCreateModal(false);
		resetSelections();
	};

	// Filter out archived orders for the main page
	const activeOrders = orders.filter((order) => order.status !== "Archived");

	return (
		<div className="container mx-auto p-6">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">Subscription Orders</h1>
					<p className="text-gray-600">Manage customer orders</p>
				</div>
				<div className="flex gap-2">
					<Link
						to="/subscriber-orders/archived-orders"
						className="btn btn-outline">
						<Archive className="w-4 h-4 mr-2" />
						View Archived
					</Link>

					<button
						className="btn btn-primary"
						onClick={() => setShowCreateModal(true)}>
						<Plus className="w-4 h-4 mr-2" /> Create Order
					</button>
				</div>
			</div>

			<OrdersGrid loading={loadingOrders} orders={activeOrders} />

			<CreateOrderModal
				showModal={showCreateModal}
				onClose={closeModal}
				onOrderCreated={fetchSubscriberOrders}
			/>
		</div>
	);
};
