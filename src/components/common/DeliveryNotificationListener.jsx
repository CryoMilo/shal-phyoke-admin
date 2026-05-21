import { useEffect } from "react";
import { supabase } from "../../services/supabase";
import { playDeliveryNotificationSound } from "../../utils/soundUtils";

// Keep track of IDs we've already played a sound for to avoid duplicates
const playedOrderIds = new Set();

const DeliveryNotificationListener = () => {
	useEffect(() => {
		const channel = supabase
			.channel("public:orders:delivery-notification")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "orders",
				},
				(payload) => {
					if (payload.new && payload.new.order_type === "delivery") {
						const orderId = payload.new.id;
						if (!playedOrderIds.has(orderId)) {
							playedOrderIds.add(orderId);
							playDeliveryNotificationSound();

							// Cleanup old IDs periodically
							if (playedOrderIds.size > 100) {
								const firstId = playedOrderIds.values().next().value;
								playedOrderIds.delete(firstId);
							}
						}
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	return null;
};

// Export the set so other components can mark an order as "already played"
// eslint-disable-next-line react-refresh/only-export-components
export const markOrderAsPlayed = (id) => {
	playedOrderIds.add(id);
	if (playedOrderIds.size > 100) {
		const firstId = playedOrderIds.values().next().value;
		playedOrderIds.delete(firstId);
	}
};

export default DeliveryNotificationListener;
