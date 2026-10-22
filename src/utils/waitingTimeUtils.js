// utils/waitingTimeUtils.js

export const KITCHEN_ACTIVE_WINDOW_MS = 25 * 60 * 1000; // 25 minutes
export const BASE_WAIT_MINUTES = 10;
export const MINUTES_PER_DISH = 1.2;

/**
 * Checks if an item in order_items is a drink or beverage that doesn't occupy hot kitchen burners
 */
export const isDrinkItem = (item = {}) => {
	const category = (item.category || "").toLowerCase();
	const nameEn = (item.name_english || "").toLowerCase();
	const nameBurmese = item.name_burmese || "";

	// Known food categories are NEVER drinks
	const foodCategories = ["salad", "rice", "noodles", "snack", "combo"];
	if (foodCategories.includes(category)) {
		return false;
	}

	if (category === "drink" || category === "regular_drinks") {
		return true;
	}

	// Word boundary checks for english drink names
	const drinkRegex = /\b(coke|cola|water|beer|juice|tea|coffee|soda|sprite|fanta|beverage|pepsi|drink)\b/i;
	if (drinkRegex.test(nameEn) && !nameEn.includes("salad") && !nameEn.includes("leaf")) {
		return true;
	}

	// Burmese common drink indicators (when not part of a salad/food dish)
	if (
		(nameBurmese.includes("ဖျော်ရည်") || nameBurmese.includes("လက်ဖက်ရည်")) &&
		!nameBurmese.includes("သုပ်")
	) {
		return true;
	}

	return false;
};

/**
 * Calculates total active cooking dishes from active orders within the 25-minute window
 */
export const countActiveCookingDishes = (orders = [], now = Date.now()) => {
	let count = 0;

	orders.forEach((order) => {
		// Only consider pending, preparing, or ready orders
		if (!["pending", "preparing", "ready"].includes(order.pos_order_status)) {
			return;
		}

		// Only orders placed within the last 25 minutes
		const orderTime = order.created_at ? new Date(order.created_at).getTime() : now;
		if (now - orderTime > KITCHEN_ACTIVE_WINDOW_MS) {
			return;
		}

		const items = Array.isArray(order.order_items) ? order.order_items : [];
		items.forEach((item) => {
			if (!isDrinkItem(item)) {
				count += Math.max(1, Number(item.quantity) || 1);
			}
		});
	});

	return count;
};

/**
 * Formats dish volume into estimated waiting time window
 */
export const getEstimatedTimeWindow = (dishCount = 0) => {
	if (dishCount >= 21) {
		return {
			timeWindow: "45 – 50 mins",
			status: "rush",
			label: "Heavy Rush",
			badgeColor: "badge-error text-error-content",
			textColor: "text-error",
			bgColor: "bg-error/10 border-error/30",
		};
	}
	if (dishCount >= 15) {
		return {
			timeWindow: "30 – 40 mins",
			status: "busy",
			label: "Busy",
			badgeColor: "badge-warning text-warning-content",
			textColor: "text-warning",
			bgColor: "bg-warning/10 border-warning/30",
		};
	}
	if (dishCount >= 9) {
		return {
			timeWindow: "20 – 30 mins",
			status: "moderate",
			label: "Moderate",
			badgeColor: "badge-warning text-warning-content",
			textColor: "text-warning",
			bgColor: "bg-warning/10 border-warning/30",
		};
	}
	if (dishCount >= 4) {
		return {
			timeWindow: "15 – 20 mins",
			status: "normal",
			label: "Normal",
			badgeColor: "badge-success text-success-content",
			textColor: "text-success",
			bgColor: "bg-success/10 border-success/30",
		};
	}
	return {
		timeWindow: "10 – 15 mins",
		status: "quick",
		label: "Quick",
		badgeColor: "badge-success text-success-content",
		textColor: "text-success",
		bgColor: "bg-success/10 border-success/30",
	};
};

/**
 * Main calculation helper
 */
export const calculateWaitingTime = (orders = [], now = Date.now()) => {
	const dishCount = countActiveCookingDishes(orders, now);
	const windowData = getEstimatedTimeWindow(dishCount);
	const rawMinutes = Math.round(BASE_WAIT_MINUTES + dishCount * MINUTES_PER_DISH);

	return {
		dishCount,
		rawMinutes,
		...windowData,
	};
};
