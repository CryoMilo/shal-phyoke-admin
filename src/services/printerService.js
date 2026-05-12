import { supabase } from "./supabase";

/**
 * Sends an order to the kitchen printer by creating a print job in Supabase
 * @param {Object} order - The processed order object
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const sendToKitchenPrinter = async (order) => {
	try {
		const items = order.order_items.map((item) => ({
			name: item.name_burmese || item.name_english,
			qty: item.quantity,
			price: item.price,
			note: order.item_notes?.[item.cart_id] ?? null,
		}));

		const tableNo =
			order.order_type === "dine_in"
				? `T-${order.table_number}`
				: order.order_type === "takeaway"
				? "Takeaway"
				: "Delivery";

		const { data, error } = await supabase.from("print_jobs").insert({
			order_no: order.order_number ?? (order.id ? order.id.slice(0, 8) : `NEW-${Date.now().toString().slice(-4)}`),
			table_no: tableNo,
			customer_name: order.customer_name,
			delivery_address: order.delivery_address,
			customer_phone: order.customer_phone,
			payment_method: order.payment_method,
			subtotal: order.subtotal,
			total_amount: order.total_amount,
			items,
			note: order.notes ?? null,
			status: "pending",
		});

		if (error) throw error;
		return { success: true, data };
	} catch (error) {
		console.error("Failed to send to kitchen printer:", error);
		return { success: false, error };
	}
};
