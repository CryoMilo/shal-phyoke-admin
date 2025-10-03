// components/SubscriberOrders/OrdersGrid.js
import { SubscriberOrderCard } from "./SubscriberOrderCard";
import { useOrderCreationStore } from "../../stores/subscriberOrderStore";

export const OrdersGrid = ({ loading, orders }) => {
	const { fetchSubscriberOrders } = useOrderCreationStore();

	const handleStatusUpdate = () => {
		fetchSubscriberOrders();
	};

	// Group orders by delivery address
	const groupOrdersByAddress = (orders) => {
		const grouped = {};

		orders.forEach((order) => {
			const address = order.delivery_address || "No Address";

			if (!grouped[address]) {
				grouped[address] = [];
			}

			grouped[address].push(order);
		});

		return grouped;
	};

	const groupedOrders = groupOrdersByAddress(orders);

	if (loading) {
		return (
			<div className="text-center py-12 text-gray-500">Loading orders…</div>
		);
	}

	if (orders.length === 0) {
		return <div className="text-center py-12 text-gray-500">No orders yet</div>;
	}

	return (
		<div className="space-y-8">
			{Object.entries(groupedOrders).map(([address, addressOrders]) => (
				<div key={address} className="space-y-4">
					{/* Address Header */}
					<div className="border-b border-gray-200 pb-2">
						<h3 className="text-xl font-semibold text-gray-50">{address}</h3>
						<p className="text-sm text-gray-500 mt-1">
							{addressOrders.length} order
							{addressOrders.length !== 1 ? "s" : ""}
						</p>
					</div>

					{/* Orders Grid for this address */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{addressOrders.map((order) => (
							<SubscriberOrderCard
								key={order.id}
								order={order}
								onStatusUpdate={handleStatusUpdate}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	);
};
