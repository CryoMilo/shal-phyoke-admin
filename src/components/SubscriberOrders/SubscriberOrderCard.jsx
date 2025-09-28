import React, { useEffect, useState } from "react";
import useSubscribersStore from "../../stores/useSubscriberStore";
import useMenuStore from "../../stores/menuStore";

export const SubscriberOrderCard = ({ order }) => {
	const { fetchSubscriberWithId } = useSubscribersStore();
	const { fetchMenuWithId } = useMenuStore();

	const [subscriber, setSubscriber] = useState(null);
	const [menus, setMenus] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			setLoading(true);

			// subscriber
			const { data: subscriberData } = await fetchSubscriberWithId(
				order.subscriber_id
			);
			setSubscriber(subscriberData);

			// menu items in parallel
			const menuResults = await Promise.all(
				order.menu_items.map((id) => fetchMenuWithId(id))
			);

			setMenus(menuResults.map((r) => r.data).filter(Boolean));
			setLoading(false);
		};

		if (order) loadData();
	}, [order, fetchSubscriberWithId, fetchMenuWithId]);

	if (loading) {
		return (
			<div className="border border-gray-700 bg-gray-900 rounded-xl p-4 text-gray-400">
				Loading order...
			</div>
		);
	}

	return (
		<div className="border border-gray-700 bg-gray-900 rounded-xl p-4 space-y-3 hover:border-gray-500 transition-colors">
			{/* Header */}
			<div className="flex justify-between items-center">
				<h3 className="font-semibold text-white">
					{subscriber?.name || "Unnamed Subscriber"}
				</h3>
				<span className="text-xs px-2 py-1 rounded-full border border-gray-500 text-gray-300">
					{order.day_selection === "today" ? "Today" : "Tomorrow"}
				</span>
			</div>

			{/* Menu Items */}
			<div className="text-sm text-gray-300">
				<strong>Menu:</strong>{" "}
				{menus.length
					? menus.map((m) => m.name_burmese).join(", ")
					: "No selections"}
			</div>

			{/* Eat In / Delivery */}
			<div className="text-sm text-gray-400">
				<strong>Type:</strong> {order.eat_in ? "Dine-In" : "Delivery"}
			</div>

			{/* Note */}
			{order.note && (
				<p className="text-sm text-gray-400 border-t border-gray-700 pt-2">
					{order.note}
				</p>
			)}
		</div>
	);
};
