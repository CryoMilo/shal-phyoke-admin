// src/components/procurement/StaffStockAuditModal.jsx
import React, { useState } from "react";
import { X, ClipboardCheck, AlertTriangle } from "lucide-react";
import useInventoryStore from "../../stores/inventoryStore";
import useProcurementInsightsStore from "../../stores/procurementInsightsStore";
import { showToast } from "../../utils/toastUtils";

const COMMON_WASTE_REASONS = [
	"Spoilage / Rotting (ပုပ်သိုးပျက်စီးခြင်း)",
	"Dropped / Spilled (ဖိတ်စင်ကျိုးပဲ့ခြင်း)",
	"Expired (သက်တမ်းကုန်ဆုံးခြင်း)",
	"Over-portioning in service (ပွဲချိန်ပိုထည့်မိခြင်း)",
	"Storage temperature failure (ရေခဲသေတ္တာအအေးလျော့ခြင်း)",
	"Physical Count Discrepancy (ရေတွက်မှုကွဲလွဲခြင်း)",
	"Other / Unaccounted (အခြားအကြောင်းအရင်း)",
];

const StaffStockAuditModal = ({ showModal, setShowModal }) => {
	const { inventoryItems } = useInventoryStore();
	const { logStockAudit } = useProcurementInsightsStore();

	const [selectedItemId, setSelectedItemId] = useState("");
	const [actualQty, setActualQty] = useState("");
	const [wasteReason, setWasteReason] = useState(COMMON_WASTE_REASONS[0]);
	const [customReason, setCustomReason] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const selectedItem = inventoryItems.find((i) => i.id === selectedItemId);
	const theoreticalQty = selectedItem?.quantity || 0;
	const parsedActual = actualQty !== "" ? parseFloat(actualQty) : theoreticalQty;
	const varianceQty = parsedActual - theoreticalQty;
	const unitCost = selectedItem?.cost_per_unit || 0;
	const varianceCost = Math.round(varianceQty * unitCost * 100) / 100;

	const handleClose = () => {
		setSelectedItemId("");
		setActualQty("");
		setCustomReason("");
		setShowModal(false);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!selectedItem) {
			showToast.error("Please select an inventory item");
			return;
		}

		if (actualQty === "" || isNaN(parseFloat(actualQty))) {
			showToast.error("Please enter a valid actual closing quantity");
			return;
		}

		setSubmitting(true);
		try {
			const reason = wasteReason.startsWith("Other") && customReason
				? customReason
				: wasteReason;

			const payload = {
				inventory_item_id: selectedItem.id,
				audit_date: new Date().toISOString().split("T")[0],
				theoretical_closing_qty: theoreticalQty,
				actual_closing_qty: parseFloat(actualQty),
				variance_cost: varianceCost,
				waste_reason: varianceQty !== 0 ? reason : null,
			};

			const res = await logStockAudit(payload);
			if (res?.success) {
				handleClose();
			}
		} finally {
			setSubmitting(false);
		}
	};

	if (!showModal) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-lg relative">
				<button
					type="button"
					onClick={handleClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
					<X className="w-4 h-4" />
				</button>

				<div className="flex items-center gap-2 mb-4">
					<ClipboardCheck className="w-6 h-6 text-primary" />
					<div>
						<h3 className="font-bold text-lg leading-relaxed">
							Physical Stock Audit (လက်ကျန်ပစ္စည်း ရေတွက်စစ်ဆေးခြင်း)
						</h3>
						<p className="text-xs text-base-content/60">
							Record physical closing stock count to measure inventory variance.
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Item Selector */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text font-semibold text-xs">
								Select Inventory Item <span className="text-error">*</span>
							</span>
						</label>
						<select
							value={selectedItemId}
							onChange={(e) => {
								setSelectedItemId(e.target.value);
								const found = inventoryItems.find((i) => i.id === e.target.value);
								setActualQty(found ? found.quantity : "");
							}}
							className="select select-bordered select-sm w-full"
							required>
							<option value="">-- Choose Stock Item --</option>
							{inventoryItems.map((item) => (
								<option key={item.id} value={item.id}>
									{item.name_burmese} ({item.name_english}) — System: {item.quantity} {item.unit}
								</option>
							))}
						</select>
					</div>

					{selectedItem && (
						<div className="space-y-4">
							{/* System Expected vs Physical Input */}
							<div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-base-200/60 border border-base-300">
								<div>
									<span className="text-[11px] text-base-content/60 block font-medium">
										System Expected Stock
									</span>
									<span className="text-base font-bold text-base-content">
										{theoreticalQty} {selectedItem.unit}
									</span>
								</div>

								<div>
									<label className="label py-0" htmlFor="actualQtyInput">
										<span className="label-text text-[11px] font-semibold text-primary">
											Staff Counted Stock <span className="text-error">*</span>
										</span>
									</label>
									<div className="flex items-center gap-1.5 mt-0.5">
										<input
											id="actualQtyInput"
											type="number"
											step="any"
											value={actualQty}
											onChange={(e) => setActualQty(e.target.value)}
											className="input input-bordered input-sm w-full font-bold"
											required
											autoFocus
										/>
										<span className="text-xs text-base-content/70">
											{selectedItem.unit}
										</span>
									</div>
								</div>
							</div>

							{/* Variance Calculation Banner */}
							<div
								className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
									varianceQty < 0
										? "bg-rose-500/10 border-rose-500/30 text-rose-500 font-semibold"
										: varianceQty > 0
										? "bg-amber-500/10 border-amber-500/30 text-amber-500 font-semibold"
										: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-semibold"
								}`}>
								<div className="flex items-center gap-1.5">
									{varianceQty !== 0 && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
									<span>
										Variance: {varianceQty > 0 ? `+${varianceQty}` : varianceQty} {selectedItem.unit}
									</span>
								</div>
								<span>
									Financial Impact: {varianceCost < 0 ? `-฿${Math.abs(varianceCost)}` : `+฿${varianceCost}`}
								</span>
							</div>

							{/* Waste Reason (if discrepancy) */}
							{varianceQty !== 0 && (
								<div className="space-y-2">
									<label className="label py-0">
										<span className="label-text text-xs font-semibold">
											Discrepancy / Waste Reason (ကွဲလွဲရသည့် အကြောင်းအရင်း)
										</span>
									</label>
									<select
										value={wasteReason}
										onChange={(e) => setWasteReason(e.target.value)}
										className="select select-bordered select-sm w-full text-xs">
										{COMMON_WASTE_REASONS.map((r) => (
											<option key={r} value={r}>
												{r}
											</option>
										))}
									</select>

									{wasteReason.startsWith("Other") && (
										<input
											type="text"
											value={customReason}
											onChange={(e) => setCustomReason(e.target.value)}
											placeholder="Specify reason..."
											className="input input-bordered input-sm w-full text-xs"
										/>
									)}
								</div>
							)}
						</div>
					)}

					<div className="modal-action">
						<button
							type="button"
							onClick={handleClose}
							className="btn btn-ghost btn-sm"
							disabled={submitting}>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting || !selectedItem}
							className="btn btn-primary btn-sm min-w-[120px]">
							{submitting ? (
								<span className="loading loading-spinner loading-xs"></span>
							) : (
								"Save Stock Audit"
							)}
						</button>
					</div>
				</form>
			</div>
			<div className="modal-backdrop" onClick={handleClose} />
		</div>
	);
};

export default StaffStockAuditModal;
