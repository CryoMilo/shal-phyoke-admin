import React, { useState, useEffect } from "react";
import { Plus, Archive } from "lucide-react";
import { useOrderCreationStore } from "../stores/subscriberOrderStore";
import useSubscribersStore from "../stores/useSubscriberStore";
import { CreateOrderModal } from "../components/SubscriberOrders/CreateOrderModal/CreateOrderModal";
import { OrdersGrid } from "../components/SubscriberOrders/OrdersGrid";
import { PageHeader } from "../components/common/PageHeader";

export const SubscriberOrder = () => {
	const { orders, loadingOrders, fetchSubscriberOrders, resetSelections } =
		useOrderCreationStore();

	const { fetchSubscribers } = useSubscribersStore();

	const [showCreateModal, setShowCreateModal] = useState(false);

	useEffect(() => {
		fetchSubscribers();
		fetchSubscriberOrders();
	}, [fetchSubscribers, fetchSubscriberOrders]);

	// Filter out archived orders for the main page
	const activeOrders = orders.filter((order) => order.status !== "Archived");
	console.log(activeOrders);

	const closeModal = () => {
		setShowCreateModal(false);
		resetSelections();
	};

	return (
		<div className="container mx-auto p-6">
			<PageHeader
				title="Subscription Orders"
				description="Manage customer orders"
				buttons={[
					{
						type: "link",
						to: "/subscriber-orders/archived-orders",
						label: "View Archived",
						shortLabel: "Archived",
						icon: Archive,
						variant: "outline",
					},
					{
						type: "button",
						label: "Create Order",
						shortLabel: "Create",
						icon: Plus,
						onClick: () => setShowCreateModal(true),
						variant: "primary",
					},
				]}
			/>
			<OrdersGrid loading={loadingOrders} orders={activeOrders} />

			<CreateOrderModal
				showModal={showCreateModal}
				onClose={closeModal}
				onOrderCreated={fetchSubscriberOrders}
			/>
		</div>
	);
};
