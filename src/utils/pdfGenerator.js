// src/utils/pdfGenerator.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateVendorPDF = async (vendor) => {
	// Create new PDF document
	const doc = new jsPDF();

	// Add title
	doc.setFontSize(20);
	doc.text(`Shopping List - ${vendor.name}`, 14, 22);

	// Add date
	doc.setFontSize(10);
	doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

	// Prepare table data
	const tableColumn = ["Item", "Quantity", "Unit", "Notes"];
	const tableRows = vendor.items.map((item) => [
		item.inventory_item?.name || item.custom_item_name,
		item.quantity.toString(),
		item.unit,
		item.notes || "",
	]);

	// Add totals row
	const totalQuantity = vendor.items.reduce(
		(sum, item) => sum + item.quantity,
		0
	);
	tableRows.push(["", "", "", ""]);
	tableRows.push(["TOTAL", totalQuantity.toString(), "units", ""]);

	// Generate table
	autoTable(doc, {
		head: [tableColumn],
		body: tableRows,
		startY: 40,
		theme: "striped",
		headStyles: { fillColor: [41, 128, 185], textColor: 255 },
		footStyles: { fillColor: [240, 240, 240], textColor: 0 },
		alternateRowStyles: { fillColor: [245, 245, 245] },
	});

	// Add footer
	const pageCount = doc.internal.getNumberOfPages();
	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);
		doc.setFontSize(8);
		doc.text(
			`${vendor.name} - Page ${i} of ${pageCount}`,
			doc.internal.pageSize.width / 2,
			doc.internal.pageSize.height - 10,
			{ align: "center" }
		);
	}

	// Save PDF
	doc.save(
		`${vendor.name.replace(/\s+/g, "_")}_Shopping_List_${
			new Date().toISOString().split("T")[0]
		}.pdf`
	);

	return { success: true };
};
