import { SubscriberOrderCard } from "./SubscriberOrderCard";

export const OrdersGrid = ({ loading, orders }) => {
	if (loading) {
		return (
			<div className="text-center py-12 text-gray-500">Loading orders…</div>
		);
	}

	if (orders.length === 0) {
		return <div className="text-center py-12 text-gray-500">No orders yet</div>;
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{orders.map((o) => (
				<SubscriberOrderCard key={o.id} order={o} />
			))}
		</div>
	);
};
