// src/components/procurement/VendorAccordion.jsx
import React, { useState } from "react";
import { ChevronDown, ChevronUp, Download, CheckCircle } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import MarketListItem from "./MarketListItem";
import { generateVendorPDF } from "../../utils/pdfGenerator";
import { showToast } from "../../utils/toastUtils";
import ConfirmOrderModal from "./ConfirmOrderModal";
import { vendorColors } from "../../constants";

// Get consistent color based on vendor id
const getVendorColor = (vendorId) => {
	if (vendorId === "tbd") {
		return {
			bg: "bg-gray-50",
			border: "border-gray-200",
			hover: "hover:bg-gray-100",
			text: "text-gray-700",
		};
	}
	const index =
		vendorId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
		vendorColors.length;
	return vendorColors[index];
};

const VendorAccordion = ({ vendor, isExpanded }) => {
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const { toggleVendor } = useProcurementStore();
	const colors = getVendorColor(vendor.id);

	const handleExport = async (e) => {
		e.stopPropagation();
		try {
			await generateVendorPDF(vendor);
			showToast.pdfExported(vendor.name);
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			showToast.error("Failed to generate PDF");
		}
	};

	const handleConfirm = (e) => {
		e.stopPropagation();
		setShowConfirmModal(true);
	};

	return (
		<>
			<div className={`card shadow-sm border ${colors.border} overflow-hidden`}>
				{/* Accordion Header */}
				<div
					className={`card-body p-4 cursor-pointer transition-colors rounded-t-xl ${colors.bg} ${colors.hover}`}
					onClick={() => toggleVendor(vendor.id)}>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<h3 className={`font-semibold text-lg ${colors.text}`}>
								{vendor.name}
							</h3>
							<span
								className={`badge ${colors.bg} ${colors.text} border ${colors.border}`}>
								{vendor.items.length} items
							</span>
						</div>

						<div className="flex items-center gap-2">
							{/* Export Button - Only PDF */}
							<button
								onClick={handleExport}
								className="btn btn-ghost btn-sm gap-1"
								title="Export as PDF">
								<Download className="w-4 h-4" />
								<span className="hidden sm:inline">Export</span>
							</button>

							{/* Confirm Button - Creates Order */}
							<button
								onClick={handleConfirm}
								className="btn btn-primary btn-sm gap-1"
								title="Confirm order">
								<CheckCircle className="w-4 h-4" />
								<span className="hidden sm:inline">Confirm</span>
							</button>

							{/* Expand/Collapse Icon */}
							{isExpanded ? (
								<ChevronUp className="w-5 h-5 text-gray-500" />
							) : (
								<ChevronDown className="w-5 h-5 text-gray-500" />
							)}
						</div>
					</div>

					{/* Summary line when collapsed */}
					{!isExpanded && (
						<div className="mt-1 text-sm text-gray-600">
							Total:{" "}
							{vendor.items.reduce((sum, item) => sum + item.quantity, 0)} units
						</div>
					)}
				</div>

				{/* Accordion Content */}
				{isExpanded && (
					<div className="border-t border-base-200">
						<div className="p-4 space-y-2">
							{vendor.items.map((item) => (
								<MarketListItem key={item.id} item={item} />
							))}

							{/* Footer with totals */}
							<div className="mt-4 pt-2 border-t border-base-200 flex justify-end">
								<div className="text-sm">
									<span className="text-gray-500">Total items: </span>
									<span className="font-medium">{vendor.items.length}</span>
									<span className="text-gray-500 ml-4">Total quantity: </span>
									<span className="font-medium">
										{vendor.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
										units
									</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Confirm Order Modal */}
			{showConfirmModal && (
				<ConfirmOrderModal
					isOpen={showConfirmModal}
					onClose={() => setShowConfirmModal(false)}
					vendor={vendor}
					items={vendor.items}
				/>
			)}
		</>
	);
};

export default VendorAccordion;
