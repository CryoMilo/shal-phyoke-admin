import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useOrderCreationStore } from "../stores/subscriberOrderStore";
import useSubscribersStore from "../stores/useSubscriberStore";
import { OrdersGrid } from "../components/SubscriberOrders/OrdersGrid";
import { CreateOrderModal } from "../components/SubscriberOrders/CreateOrderModal/CreateOrderModal";

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

	return (
		<div className="container mx-auto p-6">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">Subscription Orders</h1>
					<p className="text-gray-600">Manage customer orders</p>
				</div>
				<button
					className="btn btn-primary"
					onClick={() => setShowCreateModal(true)}>
					<Plus className="w-4 h-4 mr-2" /> Create Order
				</button>
			</div>

			<OrdersGrid loading={loadingOrders} orders={orders} />

			<CreateOrderModal
				showModal={showCreateModal}
				onClose={closeModal}
				onOrderCreated={fetchSubscriberOrders}
			/>
		</div>
	);
};
