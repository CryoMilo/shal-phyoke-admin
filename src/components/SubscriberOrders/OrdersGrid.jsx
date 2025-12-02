// components/SubscriberOrders/OrdersGrid.js - Simplified Version
import { useState } from "react";
import { SubscriberOrderCard } from "./SubscriberOrderCard";
import { useOrderCreationStore } from "../../stores/subscriberOrderStore";
import { Archive } from "lucide-react";

export const OrdersGrid = ({ loading, orders }) => {
	const { fetchSubscriberOrders, updateOrderStatus } = useOrderCreationStore();
	const [isArchivingAll, setIsArchivingAll] = useState(false);

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

	// Function to archive all orders
	const handleArchiveAll = async () => {
		if (orders.length === 0) return;

		const confirmArchive = window.confirm(
			`Are you sure you want to archive all ${orders.length} orders?`
		);

		if (!confirmArchive) return;

		setIsArchivingAll(true);

		try {
			// Archive each order one by one
			for (const order of orders) {
				await updateOrderStatus(order.id, "Archived");
			}

			// Refresh the orders list
			await fetchSubscriberOrders();

			alert(`Successfully archived ${orders.length} orders!`);
		} catch (error) {
			console.error("Error archiving all orders:", error);
			alert("Error archiving orders. Please try again.");
		} finally {
			setIsArchivingAll(false);
		}
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
			{/* Archive All Button */}
			<div className="flex justify-between items-center mb-6 p-4 bg-base-200 rounded-lg">
				<div>
					<h3 className="font-semibold">
						Total Active Orders: {orders.length}
					</h3>
					<p className="text-sm text-base-content/70 mt-1">
						Click the button below to archive all orders at once
					</p>
				</div>

				<button
					onClick={handleArchiveAll}
					disabled={isArchivingAll || orders.length === 0}
					className="btn btn-error btn-md">
					{isArchivingAll ? (
						<>
							<span className="loading loading-spinner loading-sm"></span>
							Archiving...
						</>
					) : (
						<>
							<Archive className="w-5 h-5 mr-2" />
							Archive All Orders
						</>
					)}
				</button>
			</div>

			{/* Orders grouped by address */}
			{Object.entries(groupedOrders).map(([address, addressOrders]) => (
				<div key={address} className="space-y-4">
					{/* Address Header */}
					<div className="border-b border-gray-200 pb-2">
						<h3 className="text-xl font-semibold text-secondary">{address}</h3>
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
