import { Download, X } from "lucide-react";
import { useState } from "react";

export const ItemDetailsModal = ({
	isOpen,
	onClose,
	itemDetails,
	date,
	onExportCSV,
}) => {
	const [exporting, setExporting] = useState(false);

	const handleExport = async () => {
		setExporting(true);
		try {
			await onExportCSV();
		} finally {
			setExporting(false);
		}
	};

	if (!isOpen) return null;

	const totalQuantity = itemDetails.reduce(
		(sum, item) => sum + item.quantity_sold,
		0
	);
	const totalRevenue = itemDetails.reduce(
		(sum, item) => sum + item.total_revenue,
		0
	);

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-6xl max-h-[90vh] flex flex-col">
				<div className="flex justify-between items-center mb-4">
					<div>
						<h3 className="font-bold text-xl">
							Today's Item Sales Details
							<span className="ml-3 badge badge-primary badge-lg">{date}</span>
						</h3>
						<p className="text-sm text-base-content/70 mt-1">
							{itemDetails.length} items sold • {totalQuantity} total quantity
						</p>
					</div>
					<button className="btn btn-circle btn-ghost btn-sm" onClick={onClose}>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 overflow-hidden">
					<div className="overflow-x-auto h-full">
						<table className="table table-zebra table-pin-rows w-full">
							<thead className="sticky top-0 bg-base-200">
								<tr>
									<th className="w-8">#</th>
									<th>Item Name</th>
									<th>English Name</th>
									<th>Category</th>
									<th className="text-right">Price</th>
									<th className="text-right">Quantity</th>
									<th className="text-right">Total Value</th>
									<th className="text-right">Avg Price</th>
									<th className="text-right">% of Total</th>
								</tr>
							</thead>
							<tbody>
								{itemDetails.map((item, index) => (
									<tr key={index} className="hover">
										<td className="font-mono text-sm">{index + 1}</td>
										<td
											className="font-medium max-w-xs truncate"
											title={item.item_name}>
											{item.item_name}
										</td>
										<td
											className="text-base-content/70 max-w-xs truncate"
											title={item.item_english_name}>
											{item.item_english_name || "-"}
										</td>
										<td>
											<span className="badge badge-outline badge-sm capitalize">
												{item.category?.toLowerCase()}
											</span>
										</td>
										<td className="text-right font-mono">
											฿{item.price.toFixed(2)}
										</td>
										<td className="text-right">
											<span className="badge badge-lg font-mono">
												{item.quantity_sold}
											</span>
										</td>
										<td className="text-right font-mono font-semibold">
											฿{item.total_revenue.toFixed(2)}
										</td>
										<td className="text-right font-mono">
											฿{item.avg_price.toFixed(2)}
										</td>
										<td className="text-right">
											<div className="flex items-center justify-end">
												<span className="font-mono mr-2">
													{item.percentage.toFixed(1)}%
												</span>
											</div>
										</td>
									</tr>
								))}
							</tbody>
							<tfoot className="sticky bottom-0 bg-base-300">
								<tr className="font-bold">
									<td colSpan="5" className="text-right">
										TOTALS
									</td>
									<td className="text-right text-lg">{totalQuantity}</td>
									<td className="text-right text-lg text-primary">
										฿{totalRevenue.toFixed(2)}
									</td>
									<td className="text-right">
										฿{(totalRevenue / totalQuantity).toFixed(2)}
									</td>
									<td className="text-right">100%</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</div>

				<div className="modal-action mt-4">
					<div className="flex-1 text-sm text-base-content/70">
						Showing {itemDetails.length} items • Export includes all data
					</div>
					<div className="flex gap-2">
						<button
							className="btn btn-primary"
							onClick={handleExport}
							disabled={exporting || itemDetails.length === 0}>
							{exporting ? (
								<>
									<span className="loading loading-spinner loading-sm"></span>
									Exporting...
								</>
							) : (
								<>
									<Download className="w-4 h-4 mr-2" />
									Export to CSV
								</>
							)}
						</button>
						<button className="btn btn-ghost" onClick={onClose}>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
