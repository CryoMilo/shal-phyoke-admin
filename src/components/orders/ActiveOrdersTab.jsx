// components/ActiveOrdersTab.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import OrderCard from "./OrderCard";

const ActiveOrdersTab = () => {
	const [activeOrders, setActiveOrders] = useState([]);

	useEffect(() => {
		fetchActiveOrders();

		// Set up realtime broadcast subscription
		const channel = supabase
			.channel("orders:changes", { config: { private: true } })
			.on(
				"broadcast",
				{ event: "INSERT" },
				() => fetchActiveOrders()
			)
			.on(
				"broadcast",
				{ event: "UPDATE" },
				() => fetchActiveOrders()
			)
			.on(
				"broadcast",
				{ event: "DELETE" },
				() => fetchActiveOrders()
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	const fetchActiveOrders = async () => {
		try {
			const { data, error } = await supabase
				.from("orders")
				.select("*")
				.in("pos_order_status", ["pending", "preparing", "ready"]) // ✅ Fixed
				.order("created_at", { ascending: true });

			if (error) throw error;
			setActiveOrders(data || []);
		} catch (error) {
			console.error("Error fetching active orders:", error);
		}
	};

	return (
		<div>
			<h2 className="text-xl font-bold mb-4">Active Orders</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{activeOrders.map((order) => (
					<OrderCard
						key={order.id}
						order={order}
						onUpdate={fetchActiveOrders}
					/>
				))}
				{activeOrders.length === 0 && (
					<div className="col-span-full text-center py-8 text-base-content/50">
						No active orders
					</div>
				)}
			</div>
		</div>
	);
};

export default ActiveOrdersTab;
