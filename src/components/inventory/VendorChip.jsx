// src/components/inventory/VendorChip.jsx
import React from "react";

const VendorChip = ({ vendor, selected, onClick, count }) => {
	return (
		<button
			onClick={onClick}
			className={`badge badge-lg gap-2 py-3 px-4 cursor-pointer transition-all ${
				selected
					? "badge-primary text-primary-content"
					: "badge-ghost hover:bg-base-300"
			}`}>
			<span>{vendor.name}</span>
			{count !== undefined && (
				<span
					className={`text-xs ${selected ? "opacity-90" : "text-gray-500"}`}>
					{count}
				</span>
			)}
		</button>
	);
};

export default VendorChip;
