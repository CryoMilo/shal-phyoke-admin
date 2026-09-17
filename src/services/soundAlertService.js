import { supabase } from "./supabase";

let alertChannel = null;

const getAlertChannel = () => {
	if (!alertChannel) {
		alertChannel = supabase.channel("shop-sound-alerts", {
			config: { broadcast: { ack: true } },
		});
		alertChannel.subscribe((status) => {
			if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
				console.warn("Sound alerts broadcast channel disconnected. Will recreate on next trigger.");
				alertChannel = null;
			}
		});
	}
	return alertChannel;
};

export const AVAILABLE_SOUNDS = [
	{
		id: "bolt_arrived",
		title: "Bolt Arrived",
		subtitle: "Delivery rider waiting outside",
		icon: "Zap",
		badge: "Delivery",
		badgeColor: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
		borderColor: "border-emerald-500/30 hover:border-emerald-500",
		activeBg: "bg-emerald-500/10",
		iconBg: "bg-emerald-500/15 text-emerald-400",
		btnHover: "hover:bg-emerald-600",
	},
	{
		id: "makro_arrived",
		title: "Makro Arrived",
		subtitle: "Store supply delivery arrived",
		icon: "ShoppingCart",
		badge: "Supplies",
		badgeColor: "bg-rose-500/15 text-rose-500 border border-rose-500/30",
		borderColor: "border-rose-500/30 hover:border-rose-500",
		activeBg: "bg-rose-500/10",
		iconBg: "bg-rose-500/15 text-rose-400",
		btnHover: "hover:bg-rose-600",
	},
	{
		id: "package_arrived",
		title: "Package Arrived",
		subtitle: "Parcel or mail package at door",
		icon: "Package",
		badge: "Parcel",
		badgeColor: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
		borderColor: "border-amber-500/30 hover:border-amber-500",
		activeBg: "bg-amber-500/10",
		iconBg: "bg-amber-500/15 text-amber-400",
		btnHover: "hover:bg-amber-600",
	},
	{
		id: "pickup_call",
		title: "Please Pick up the call",
		subtitle: "Urgent incoming call announcement",
		icon: "PhoneCall",
		badge: "Phone Call",
		badgeColor: "bg-sky-500/15 text-sky-500 border border-sky-500/30",
		borderColor: "border-sky-500/30 hover:border-sky-500",
		activeBg: "bg-sky-500/10",
		iconBg: "bg-sky-500/15 text-sky-400",
		btnHover: "hover:bg-sky-600",
	},
];

/**
 * Triggers a manual sound alert through Supabase Realtime broadcast channel
 * @param {string} soundId - One of bolt_arrived, makro_arrived, package_arrived, pickup_call
 * @param {string} [soundTitle] - Human readable title
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export const triggerSoundAlert = async (soundId, soundTitle = "") => {
	try {
		const channel = getAlertChannel();

		// Ensure channel subscription
		if (channel.state !== "joined" && channel.state !== "joining") {
			await channel.subscribe();
		}

		if (channel.state === "joining") {
			await new Promise((resolve) => {
				const checkTimer = setInterval(() => {
					if (channel.state === "joined" || channel.state === "error") {
						clearInterval(checkTimer);
						resolve();
					}
				}, 100);
				setTimeout(() => {
					clearInterval(checkTimer);
					resolve();
				}, 2000);
			});
		}

		const response = await channel.send({
			type: "broadcast",
			event: "play_sound",
			payload: {
				sound: soundId,
				title: soundTitle,
				timestamp: new Date().toISOString(),
			},
		});

		if (response === "ok" || response === "timed out") {
			return { success: true, status: response };
		} else {
			return { success: false, error: response };
		}
	} catch (error) {
		console.error("Failed to trigger sound alert:", error);
		return { success: false, error };
	}
};
