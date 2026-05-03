// src/components/orders/PrintKitchenTicketButton.jsx
import React, { useState } from "react";
import { Printer } from "lucide-react";
import { supabase } from "../../services/supabase";
import { showToast } from "../../utils/toastUtils";

const PrintKitchenTicketButton = ({ order, size = "sm" }) => {
	const [status, setStatus] = useState("idle");

	const handlePrint = async () => {
		setStatus("sending");

		const items = order.order_items.map((item) => ({
			name: item.name_burmese,
			qty: item.quantity,
			note: order.item_notes?.[item.cart_id] ?? null,
		}));

		const tableNo =
			order.order_type === "dine_in"
				? `T-${order.table_number}`
				: order.order_type === "takeaway"
				? "Takeaway"
				: "Delivery";

		const { error } = await supabase.from("print_jobs").insert({
			order_no: order.order_number ?? order.id.slice(0, 8),
			table_no: tableNo,
			items,
			note: order.notes ?? null,
			status: "pending",
		});

		if (error) {
			showToast.error("Failed to send to printer");
			setStatus("error");
		} else {
			showToast.success("Ticket sent to kitchen printer");
			setStatus("sent");
		}

		setTimeout(() => setStatus("idle"), 3000);
	};

	return (
		<button
			onClick={handlePrint}
			disabled={status === "sending"}
			className={`btn btn-${size} btn-outline gap-2 ${
				status === "sent"
					? "btn-success"
					: status === "error"
					? "btn-error"
					: ""
			}`}>
			{status === "sending" ? (
				<span className="loading loading-spinner loading-xs" />
			) : (
				<Printer className="w-4 h-4" />
			)}
			{status === "idle" && "Print Ticket"}
			{status === "sending" && "Sending..."}
			{status === "sent" && "Sent!"}
			{status === "error" && "Failed"}
		</button>
	);
};

export default PrintKitchenTicketButton;
