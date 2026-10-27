// src/components/procurement/TheoreticalVarianceTable.jsx
import React from "react";
import { Scale, AlertTriangle, CheckCircle, Package } from "lucide-react";

const TheoreticalVarianceTable = ({
	theoreticalConsumption,
	stockAudits,
	inventoryItems,
}) => {
	// Consolidate data per inventory item
	const itemsWithData = inventoryItems
		.map((item) => {
			const theory = theoreticalConsumption[item.id];
			const theoryUnits = theory ? theory.total_units : 0;
			const theoryCost = theory ? theory.total_cost : 0;

			// Find latest audit in date range for this item
			const itemAudits = stockAudits.filter(
				(a) => a.inventory_item_id === item.id
			);
			const auditVarianceQty = itemAudits.reduce(
				(sum, a) => sum + (Number(a.variance_qty) || 0),
				0
			);
			const auditVarianceCost = itemAudits.reduce(
				(sum, a) => sum + (Number(a.variance_cost) || 0),
				0
			);

			return {
				item,
				theoryUnits: Math.round(theoryUnits * 1000) / 1000,
				theoryCost: Math.round(theoryCost * 100) / 100,
				hasAudit: itemAudits.length > 0,
				auditVarianceQty: Math.round(auditVarianceQty * 1000) / 1000,
				auditVarianceCost: Math.round(auditVarianceCost * 100) / 100,
				audits: itemAudits,
			};
		})
		.filter((row) => row.theoryUnits > 0 || row.hasAudit);

	return (
		<div className="bg-base-100 rounded-2xl border border-base-200 overflow-hidden shadow-sm space-y-3 p-4 sm:p-5">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
				<div>
					<h3 className="font-bold text-base leading-relaxed text-base-content flex items-center gap-2">
						<Scale className="w-5 h-5 text-primary" />
						Theoretical Consumption vs. Staff Physical Audit Variance
					</h3>
					<p className="text-xs text-base-content/60">
						Compares expected recipe consumption calculated from POS orders against physical counts.
					</p>
				</div>
				<span className="badge badge-ghost badge-sm">
					{itemsWithData.length} Ingredients Tracked
				</span>
			</div>

			{itemsWithData.length > 0 ? (
				<div className="overflow-x-auto">
					<table className="table table-sm w-full">
						<thead>
							<tr className="border-b border-base-200 text-xs">
								<th>Ingredient (ကုန်ကြမ်း)</th>
								<th>Current Stock</th>
								<th>Theoretical Consumed</th>
								<th>Physical Audit Variance</th>
								<th className="text-right">Financial Discrepancy</th>
							</tr>
						</thead>
						<tbody>
							{itemsWithData.map((row) => {
								const hasDiscrepancy = row.hasAudit && row.auditVarianceQty !== 0;

								return (
									<tr key={row.item.id} className="hover">
										<td>
											<div className="flex items-center gap-2.5">
												<div className="w-8 h-8 rounded-lg bg-base-200 border border-base-300 flex items-center justify-center flex-shrink-0">
													<Package className="w-4 h-4 text-base-content/40" />
												</div>
												<div>
													<p className="font-bold text-xs leading-relaxed">
														{row.item.name_burmese}
													</p>
													<p className="text-[11px] text-base-content/60">
														{row.item.name_english}
													</p>
												</div>
											</div>
										</td>

										<td>
											<span className="font-semibold text-xs">
												{row.item.quantity || 0} {row.item.unit}
											</span>
										</td>

										<td>
											<span className="font-bold text-xs text-primary">
												{row.theoryUnits} {row.item.unit}
											</span>
											<span className="text-[10px] text-base-content/60 block">
												~฿{row.theoryCost}
											</span>
										</td>

										<td>
											{row.hasAudit ? (
												<div>
													<span
														className={`badge badge-xs font-bold ${
															row.auditVarianceQty < 0
																? "badge-error"
																: row.auditVarianceQty > 0
																? "badge-warning"
																: "badge-success"
														}`}>
														{row.auditVarianceQty > 0 ? `+${row.auditVarianceQty}` : row.auditVarianceQty} {row.item.unit}
													</span>
													{row.audits[0]?.waste_reason && (
														<span className="text-[10px] text-base-content/50 block truncate max-w-[160px]">
															{row.audits[0].waste_reason}
														</span>
													)}
												</div>
											) : (
												<span className="text-xs text-base-content/40 italic">
													No physical audit logged
												</span>
											)}
										</td>

										<td className="text-right font-bold text-xs">
											{hasDiscrepancy ? (
												<span
													className={
														row.auditVarianceCost < 0
															? "text-rose-500"
															: "text-amber-500"
													}>
													{row.auditVarianceCost < 0
														? `-฿${Math.abs(row.auditVarianceCost)}`
														: `+฿${row.auditVarianceCost}`}
												</span>
											) : (
												<span className="text-emerald-500 flex items-center justify-end gap-1">
													<CheckCircle className="w-3.5 h-3.5" /> ฿0.00
												</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			) : (
				<div className="p-8 text-center text-base-content/40 border border-dashed border-base-300 rounded-xl space-y-1">
					<Scale className="w-8 h-8 mx-auto opacity-30" />
					<p className="text-xs font-semibold">No sales or audits in selected date range.</p>
					<p className="text-[11px]">Select a date range with completed POS sales to view theoretical usage.</p>
				</div>
			)}
		</div>
	);
};

export default TheoreticalVarianceTable;
