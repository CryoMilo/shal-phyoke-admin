import { create } from "zustand";
import { supabase } from "../services/supabase";
import {
	calculateWaitingTime,
	KITCHEN_ACTIVE_WINDOW_MS,
} from "../utils/waitingTimeUtils";

const useWaitingTimeStore = create((set, get) => ({
	dishCount: 0,
	timeWindow: "10 – 15 mins",
	status: "quick",
	label: "Quick",
	badgeColor: "badge-success text-success-content",
	textColor: "text-success",
	bgColor: "bg-success/10 border-success/30",
	rawMinutes: 10,
	loading: false,
	lastUpdated: null,

	fetchWaitingTime: async () => {
		try {
			set({ loading: true });
			const cutoffTime = new Date(
				Date.now() - KITCHEN_ACTIVE_WINDOW_MS
			).toISOString();

			const { data, error } = await supabase
				.from("orders")
				.select("id, created_at, order_items, pos_order_status")
				.in("pos_order_status", ["pending", "preparing", "ready"])
				.gte("created_at", cutoffTime);

			if (error) throw error;

			const waitInfo = calculateWaitingTime(data || []);

			set({
				...waitInfo,
				loading: false,
				lastUpdated: new Date(),
			});

			return waitInfo;
		} catch (error) {
			console.error("Error calculating kitchen waiting time:", error);
			set({ loading: false });
			return get();
		}
	},

	subscribeToOrders: () => {
		// Initial fetch
		get().fetchWaitingTime();

		// Realtime subscription to auto-update whenever orders change
		const channel = supabase
			.channel("waiting-time-orders-channel")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "orders" },
				() => {
					get().fetchWaitingTime();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	},
}));

export default useWaitingTimeStore;
