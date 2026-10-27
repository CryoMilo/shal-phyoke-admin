// src/components/procurement/SmartOrderGeneratorCard.jsx
import React, { useState, useEffect } from "react";
import { Sparkles, ShoppingCart, Store, ArrowRight, Check } from "lucide-react";
import useProcurementInsightsStore from "../../stores/procurementInsightsStore";
import { showToast } from "../../utils/toastUtils";

const SmartOrderGeneratorCard = ({ suggestedOrders }) => {
	const { pushToMarketList } = useProcurementInsightsStore();
	const [orderQuantities, setOrderQuantities] = useState({});
	const [selectedItems, setSelectedItems] = useState({});
	const [pushing, setPushing] = useState(false);

	useEffect(() => {
		const initialQty = {};
		const initialSelected = {};
		suggestedOrders.forEach((entry) => {
			initialQty[entry.item.id] = entry.suggestedQty || 1;
			initialSelected[entry.item.id] = true;
		});
		setOrderQuantities(initialQty);
		setSelectedItems(initialSelected);
	}, [suggestedOrders]);

	const handleQtyChange = (itemId, val) => {
		const parsed = parseFloat(val);
		setOrderQuantities((prev) => ({
			...prev,
			[itemId]: isNaN(parsed) ? "" : parsed,
		}));
	};

	const toggleSelect = (itemId) => {
		setSelectedItems((prev) => ({
			...prev,
			[itemId]: !prev[itemId],
		}));
	};

	// Group suggestions by vendor
	const vendorGroups = {};
	suggestedOrders.forEach((entry) => {
		const vId = entry.vendor_id || "unassigned";
		if (!vendorGroups[vId]) {
			vendorGroups[vId] = {
				vendor: entry.vendor || { id: "unassigned", name: "Unassigned Vendor" },
				entries: [],
			};
		}
		vendorGroups[vId].entries.push(entry);
	});

	// Push selected to market list
	const handlePush = async () => {
		const toPush = suggestedOrders
			.filter((e) => selectedItems[e.item.id])
			.map((e) => ({
				...e,
				orderQty: parseFloat(orderQuantities[e.item.id]) || e.suggestedQty,
			}))
			.filter((e) => e.orderQty > 0);

		if (toPush.length === 0) {
			showToast.error("No items selected to push");
			return;
		}

		setPushing(true);
		try {
			await pushToMarketList(toPush);
		} finally {
			setPushing(false);
		}
	};

	const totalSelectedCost = suggestedOrders
		.filter((e) => selectedItems[e.item.id])
		.reduce((sum, e) => {
			const qty = parseFloat(orderQuantities[e.item.id]) || e.suggestedQty || 0;
			return sum + qty * (e.item.cost_per_unit || 0);
		}, 0);

	return (
		<div className="bg-base-100 rounded-2xl border border-base-200 p-4 sm:p-5 shadow-sm space-y-4">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div>
					<h3 className="font-bold text-base leading-relaxed text-base-content flex items-center gap-2">
						<Sparkles className="w-5 h-5 text-amber-500" />
						Smart Next-Grocery-Cycle Order Generator (အလိုအလျောက် ဈေးဝယ်စာရင်း တွက်ချက်မှု)
					</h3>
					<p className="text-xs text-base-content/60">
						Calculated via: (7-Day Avg Daily Need × Order Cycle Days) + Threshold − Current Stock.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<div className="text-right">
						<span className="text-[11px] text-base-content/60 block font-medium">
							Estimated Budget
						</span>
						<span className="text-base font-bold text-primary">
							฿{Math.round(totalSelectedCost).toLocaleString()}
						</span>
					</div>

					<button
						type="button"
						onClick={handlePush}
						disabled={pushing || suggestedOrders.length === 0}
						className="btn btn-primary btn-sm gap-1.5 shadow-sm">
						{pushing ? (
							<span className="loading loading-spinner loading-xs"></span>
						) : (
							<ShoppingCart className="w-4 h-4" />
						)}
						Push to Market List
					</button>
				</div>
			</div>

			{Object.keys(vendorGroups).length > 0 ? (
				<div className="space-y-4 pt-2">
					{Object.values(vendorGroups).map(({ vendor, entries }) => (
						<div
							key={vendor.id}
							className="rounded-2xl border border-base-200 bg-base-200/30 overflow-hidden">
							{/* Vendor Group Header */}
							<div className="p-3 bg-base-200/70 border-b border-base-200 flex items-center justify-between">
								<div className="flex items-center gap-2 font-bold text-xs text-base-content">
									<Store className="w-4 h-4 text-primary" />
									<span>{vendor.name}</span>
									<span className="badge badge-sm badge-ghost">{entries.length} items</span>
								</div>

								<span className="text-xs font-semibold text-base-content/70">
									Subtotal: ฿
									{Math.round(
										entries
											.filter((e) => selectedItems[e.item.id])
											.reduce((sum, e) => {
												const q = parseFloat(orderQuantities[e.item.id]) || e.suggestedQty || 0;
												return sum + q * (e.item.cost_per_unit || 0);
											}, 0)
									).toLocaleString()}
								</span>
							</div>

							{/* Items Table */}
							<div className="p-2 overflow-x-auto">
								<table className="table table-xs w-full">
									<thead>
										<tr className="border-b border-base-200">
											<th className="w-8"></th>
											<th>Ingredient</th>
											<th>Stock / Safety</th>
											<th>Daily Need</th>
											<th>Cycle</th>
											<th className="w-32">Suggested Order</th>
											<th className="text-right">Unit Price</th>
										</tr>
									</thead>
									<tbody>
										{entries.map((entry) => {
											const isSelected = !!selectedItems[entry.item.id];
											const currentQtyVal = orderQuantities[entry.item.id] ?? entry.suggestedQty;

											return (
												<tr key={entry.item.id} className="hover">
													<td>
														<input
															type="checkbox"
															checked={isSelected}
															onChange={() => toggleSelect(entry.item.id)}
															className="checkbox checkbox-primary checkbox-xs"
														/>
													</td>

													<td>
														<div className="flex items-center gap-1.5 flex-wrap">
															<p className="font-bold text-xs leading-relaxed">
																{entry.item.name_burmese}
															</p>
															{entry.itemType === "packaging" ? (
																<span className="badge badge-xs bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
																	Packaging
																</span>
															) : entry.itemType === "operational_supply" ? (
																<span className="badge badge-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
																	Supply
																</span>
															) : null}
														</div>
														<p className="text-[10px] text-base-content/60">
															{entry.item.name_english}
														</p>
													</td>

													<td>
														<span className="font-semibold text-xs">
															{entry.currentQty} {entry.item.unit}
														</span>
														<span className="text-[10px] text-base-content/50 block">
															Min: {entry.item.threshold || 0}
														</span>
													</td>

													<td>
														<span className="text-xs font-medium">
															{entry.dailyAvg} {entry.item.unit}/day
														</span>
													</td>

													<td>
														<span className="badge badge-ghost badge-xs">
															{entry.cycleDays}d cycle
														</span>
													</td>

													<td>
														<div className="flex items-center gap-1.5">
															<input
																type="number"
																step="any"
																min="0"
																value={currentQtyVal}
																onChange={(e) => handleQtyChange(entry.item.id, e.target.value)}
																className="input input-bordered input-xs w-20 font-bold text-center"
															/>
															<span className="text-xs text-base-content/70">
																{entry.item.unit}
															</span>
														</div>
													</td>

													<td className="text-right font-medium text-xs">
														฿{Number(entry.item.cost_per_unit || 0).toFixed(2)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="p-8 text-center text-base-content/40 border border-dashed border-base-300 rounded-xl space-y-1">
					<Check className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
					<p className="text-xs font-semibold">Inventory Stock Levels are Optimal!</p>
					<p className="text-[11px]">All items exceed cycle safety thresholds. No replenishment orders currently suggested.</p>
				</div>
			)}
		</div>
	);
};

export default SmartOrderGeneratorCard;
