// src/components/procurement/VendorAccordion.jsx
import React from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import MarketListItem from "./MarketListItem";
import { generateVendorPDF } from "../../utils/pdfGenerator";
import { showToast } from "../../utils/toastUtils";
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
	const { toggleVendor } = useProcurementStore();
	const colors = getVendorColor(vendor.id);

	const handleConfirmAndExport = async (e) => {
		e.stopPropagation(); // Prevent toggling accordion

		try {
			// Show loading toast
			const toastId = showToast.info(`Generating PDF for ${vendor.name}...`, {
				autoClose: false,
				isLoading: true,
			});

			// Generate PDF
			await generateVendorPDF(vendor);

			// Dismiss loading toast
			showToast.dismiss(toastId);

			// Show success toasts
			showToast.orderConfirmed(vendor.name, true);
			showToast.pdfExported(vendor.name);
		} catch (error) {
			console.error("Error generating PDF:", error);
			showToast.error(`Failed to generate PDF: ${error.message}`);
		}
	};

	return (
		<div className={`card shadow-sm border ${colors.border}`}>
			{/* Accordion Header */}
			<div
				className={`card-body p-4 cursor-pointer transition-colors ${colors.bg} rounded-2xl ${colors.hover}`}
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
						{/* Confirm & Export Button */}
						<button
							onClick={handleConfirmAndExport}
							className="btn btn-primary btn-sm gap-1"
							title="Confirm order and export PDF">
							<Download className="w-4 h-4" />
							<span className="hidden sm:inline">Confirm & Export</span>
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
						Total: {vendor.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
						units
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
	);
};

export default VendorAccordion;
