// src/components/orders/PrintKitchenTicketButton.jsx
import React, { useState } from "react";
import { Printer } from "lucide-react";
import { showToast } from "../../utils/toastUtils";
import { sendToKitchenPrinter } from "../../services/printerService";

const PrintKitchenTicketButton = ({ order, size = "sm" }) => {
	const [status, setStatus] = useState("idle");

	const handlePrint = async () => {
		setStatus("sending");

		const { success } = await sendToKitchenPrinter(order);

		if (!success) {
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
