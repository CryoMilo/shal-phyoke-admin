// src/components/procurement/KitchenPrepLogModal.jsx
import React, { useState } from "react";
import { X, Utensils, AlertCircle } from "lucide-react";
import useRecipeStore from "../../stores/recipeStore";
import useProcurementInsightsStore from "../../stores/procurementInsightsStore";
import { showToast } from "../../utils/toastUtils";

const KitchenPrepLogModal = ({ showModal, setShowModal }) => {
	const { recipes } = useRecipeStore();
	const { logKitchenPrep } = useProcurementInsightsStore();

	const [selectedRecipeId, setSelectedRecipeId] = useState("");
	const [batches, setBatches] = useState("1");
	const [quantityProduced, setQuantityProduced] = useState("");
	const [wasteQuantity, setWasteQuantity] = useState("0");
	const [wasteReason, setWasteReason] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

	const handleRecipeChange = (recipeId) => {
		setSelectedRecipeId(recipeId);
		const found = recipes.find((r) => r.id === recipeId);
		if (found) {
			const b = parseFloat(batches) || 1;
			setQuantityProduced(String(b * (found.yield_quantity || 1)));
		}
	};

	const handleBatchesChange = (val) => {
		setBatches(val);
		const b = parseFloat(val) || 0;
		if (selectedRecipe) {
			setQuantityProduced(String(b * (selectedRecipe.yield_quantity || 1)));
		}
	};

	const handleClose = () => {
		setSelectedRecipeId("");
		setBatches("1");
		setQuantityProduced("");
		setWasteQuantity("0");
		setWasteReason("");
		setShowModal(false);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!selectedRecipe) {
			showToast.error("Please select a recipe");
			return;
		}

		const qty = parseFloat(quantityProduced);
		if (isNaN(qty) || qty <= 0) {
			showToast.error("Please enter a valid quantity produced");
			return;
		}

		setSubmitting(true);
		try {
			const payload = {
				recipe_id: selectedRecipe.id,
				log_date: new Date().toISOString().split("T")[0],
				batches_produced: parseFloat(batches) || 1,
				quantity_produced: qty,
				unit: selectedRecipe.yield_unit,
				waste_quantity: parseFloat(wasteQuantity) || 0,
				waste_reason: wasteReason.trim() || null,
			};

			const res = await logKitchenPrep(payload);
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
					<Utensils className="w-6 h-6 text-primary" />
					<div>
						<h3 className="font-bold text-lg leading-relaxed">
							Kitchen Prep & Spoilage Log (မီးဖိုချောင် အနှစ်ချက်လုပ်မှု မှတ်တမ်း)
						</h3>
						<p className="text-xs text-base-content/60">
							Record branch prep batch output and kitchen trimming/prep waste.
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Recipe Selector */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text font-semibold text-xs">
								Select Prepared Recipe <span className="text-error">*</span>
							</span>
						</label>
						<select
							value={selectedRecipeId}
							onChange={(e) => handleRecipeChange(e.target.value)}
							className="select select-bordered select-sm w-full"
							required>
							<option value="">-- Choose Sub-recipe / Dish --</option>
							{recipes.map((r) => (
								<option key={r.id} value={r.id}>
									[{r.recipe_type === "branch_prep" ? "Branch Prep" : "Menu Prep"}] {r.name_burmese} ({r.name_english})
								</option>
							))}
						</select>
					</div>

					{selectedRecipe && (
						<div className="space-y-4">
							{/* Batches & Total Quantity Output */}
							<div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-base-200/60 border border-base-300">
								<div>
									<label className="label py-0">
										<span className="label-text text-xs font-semibold">
											Batches Cooked
										</span>
									</label>
									<input
										type="number"
										step="any"
										min="0.1"
										value={batches}
										onChange={(e) => handleBatchesChange(e.target.value)}
										className="input input-bordered input-sm w-full font-bold mt-1"
										required
									/>
								</div>

								<div>
									<label className="label py-0">
										<span className="label-text text-xs font-semibold">
											Total Yield Output
										</span>
									</label>
									<div className="flex items-center gap-1.5 mt-1">
										<input
											type="number"
											step="any"
											value={quantityProduced}
											onChange={(e) => setQuantityProduced(e.target.value)}
											className="input input-bordered input-sm w-full font-bold"
											required
										/>
										<span className="text-xs text-base-content/70">
											{selectedRecipe.yield_unit}
										</span>
									</div>
								</div>
							</div>

							{/* Kitchen Prep Waste */}
							<div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
								<div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
									<AlertCircle className="w-4 h-4" />
									<span>Batch Trimming / Burn / Spoilage Waste</span>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="label py-0">
											<span className="label-text text-[11px] font-medium">
												Waste Qty ({selectedRecipe.yield_unit})
											</span>
										</label>
										<input
											type="number"
											step="any"
											min="0"
											value={wasteQuantity}
											onChange={(e) => setWasteQuantity(e.target.value)}
											className="input input-bordered input-sm w-full mt-1"
										/>
									</div>

									<div>
										<label className="label py-0">
											<span className="label-text text-[11px] font-medium">
												Waste Reason (if any)
											</span>
										</label>
										<input
											type="text"
											value={wasteReason}
											onChange={(e) => setWasteReason(e.target.value)}
											placeholder="e.g. Scorched on pan, dropped"
											className="input input-bordered input-sm w-full mt-1 text-xs"
										/>
									</div>
								</div>
							</div>
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
							disabled={submitting || !selectedRecipe}
							className="btn btn-primary btn-sm min-w-[120px]">
							{submitting ? (
								<span className="loading loading-spinner loading-xs"></span>
							) : (
								"Save Prep Log"
							)}
						</button>
					</div>
				</form>
			</div>
			<div className="modal-backdrop" onClick={handleClose} />
		</div>
	);
};

export default KitchenPrepLogModal;
