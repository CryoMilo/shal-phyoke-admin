// src/components/procurement/MarketListTab.jsx
import React from "react";
import { Maximize2, Minimize2, ShoppingBag } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import VendorAccordion from "./VendorAccordion";

const MarketListTab = ({ userId }) => {
	const {
		getItemsByVendor,
		expandedVendors,
		expandAllVendors,
		collapseAllVendors,
		loading,
	} = useProcurementStore();

	const vendorsWithItems = getItemsByVendor();

	if (loading) {
		return <div className="text-center py-8">Loading market list...</div>;
	}

	return (
		<div className="space-y-4">
			{/* Header with expand/collapse controls */}
			<div className="flex justify-between items-center">
				<h2 className="text-lg font-semibold">Items to Buy</h2>
				<div className="flex gap-2">
					<button
						onClick={expandAllVendors}
						className="btn btn-ghost btn-sm gap-1"
						title="Expand all">
						<Maximize2 className="w-4 h-4" />
						<span className="hidden sm:inline">Expand All</span>
					</button>
					<button
						onClick={collapseAllVendors}
						className="btn btn-ghost btn-sm gap-1"
						title="Collapse all">
						<Minimize2 className="w-4 h-4" />
						<span className="hidden sm:inline">Collapse All</span>
					</button>
				</div>
			</div>

			{/* Vendor Accordions */}
			{vendorsWithItems.length === 0 ? (
				<div className="text-center py-12 bg-base-100 rounded-lg border border-base-200">
					<ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
					<p className="text-gray-500 text-lg mb-2">
						Your market list is empty
					</p>
					<p className="text-sm text-gray-400">
						Items added from Inventory will appear here
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{vendorsWithItems.map((vendor) => (
						<VendorAccordion
							key={vendor.id}
							vendor={vendor}
							isExpanded={expandedVendors.includes(vendor.id)}
							userId={userId}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default MarketListTab;
