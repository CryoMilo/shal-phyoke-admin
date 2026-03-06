// src/components/procurement/VendorAccordion.jsx
import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import MarketListItem from "./MarketListItem";

const VendorAccordion = ({ vendor, isExpanded, userId }) => {
	const { toggleVendor } = useProcurementStore();

	return (
		<div className="card bg-base-100 shadow-sm border border-base-200">
			{/* Accordion Header */}
			<div
				className="card-body p-4 cursor-pointer hover:bg-base-200 transition-colors"
				onClick={() => toggleVendor(vendor.id)}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<h3 className="font-semibold text-lg">{vendor.name}</h3>
						<span className="badge badge-primary badge-sm">
							{vendor.items.length} items
						</span>
					</div>
					{isExpanded ? (
						<ChevronUp className="w-5 h-5 text-gray-500" />
					) : (
						<ChevronDown className="w-5 h-5 text-gray-500" />
					)}
				</div>
			</div>

			{/* Accordion Content */}
			{isExpanded && (
				<div className="border-t border-base-200">
					<div className="p-4 space-y-2">
						{vendor.items.map((item) => (
							<MarketListItem key={item.id} item={item} userId={userId} />
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default VendorAccordion;
