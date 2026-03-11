// components/OrderHistoryTab.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";
import OrderCard from "./OrderCard";

const OrderHistoryTab = () => {
	const [completedOrders, setCompletedOrders] = useState([]);

	useEffect(() => {
		fetchCompletedOrders();

		// Set up realtime broadcast subscription
		const channel = supabase
			.channel("orders:history", { config: { private: true } })
			.on("broadcast", { event: "UPDATE" }, () => fetchCompletedOrders())
			.on("broadcast", { event: "INSERT" }, () => fetchCompletedOrders())
			.on("broadcast", { event: "DELETE" }, () => fetchCompletedOrders())
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	const fetchCompletedOrders = async () => {
		try {
			const { data, error } = await supabase
				.from("orders")
				.select("*")
				.eq("pos_order_status", "completed") // ✅ Fixed
				.order("created_at", { ascending: false })
				.limit(50);

			if (error) throw error;
			setCompletedOrders(data || []);
		} catch (error) {
			console.error("Error fetching completed orders:", error);
		}
	};

	return (
		<div>
			<h2 className="text-xl font-bold mb-4">Order History</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{completedOrders.map((order) => (
					<OrderCard
						key={order.id}
						order={order}
						onUpdate={fetchCompletedOrders}
					/>
				))}
				{completedOrders.length === 0 && (
					<div className="col-span-full text-center py-8 text-base-content/50">
						No completed orders
					</div>
				)}
			</div>
		</div>
	);
};

export default OrderHistoryTab;
