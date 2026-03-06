// src/utils/toastUtils.js
import { toast } from "react-toastify";

export const showToast = {
	success: (message, options = {}) => {
		toast.success(message, {
			icon: "✅",
			...options,
		});
	},

	error: (message, options = {}) => {
		toast.error(message, {
			icon: "❌",
			...options,
		});
	},

	info: (message, options = {}) => {
		toast.info(message, {
			icon: "ℹ️",
			...options,
		});
	},

	warning: (message, options = {}) => {
		toast.warning(message, {
			icon: "⚠️",
			...options,
		});
	},

	orderConfirmed: (vendorName, pdfGenerated = true) => {
		toast.success(
			<div>
				<p className="font-semibold">Order Confirmed for {vendorName}</p>
				<p className="text-sm">
					{pdfGenerated ? "✓ PDF generated successfully" : "Order recorded"}
				</p>
			</div>,
			{
				icon: "📋",
				autoClose: 5000,
			}
		);
	},

	itemAdded: (itemName, quantity, unit) => {
		toast.info(
			<div>
				<p className="font-semibold">Added to Market List</p>
				<p className="text-sm">
					{itemName} - {quantity} {unit}
				</p>
			</div>,
			{
				icon: "🛒",
				autoClose: 2000,
			}
		);
	},

	itemRemoved: (itemName) => {
		toast.warning(
			<div>
				<p className="font-semibold">Removed from Market List</p>
				<p className="text-sm">{itemName}</p>
			</div>,
			{
				icon: "🗑️",
				autoClose: 2000,
			}
		);
	},

	pdfExported: (vendorName) => {
		toast.success(
			<div>
				<p className="font-semibold">PDF Exported</p>
				<p className="text-sm">{vendorName} shopping list downloaded</p>
			</div>,
			{
				icon: "📄",
				autoClose: 3000,
			}
		);
	},

	dismiss: (toastId) => {
		toast.dismiss(toastId);
	},
};
