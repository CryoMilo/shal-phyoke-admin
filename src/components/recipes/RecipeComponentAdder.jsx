// src/components/recipes/RecipeComponentAdder.jsx
import React, { useState, useMemo } from "react";
import { Plus, Search, Box, Utensils, AlertCircle, Wrench, X } from "lucide-react";
import useMeasurementUnitStore from "../../stores/measurementUnitStore";
import useInventoryStore from "../../stores/inventoryStore";
import { showToast } from "../../utils/toastUtils";

const RecipeComponentAdder = ({ currentRecipe, branchPreps, inventoryItems, onAddComponent }) => {
	const { units } = useMeasurementUnitStore();
	const { addOrUpdateConversion } = useInventoryStore();

	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedTarget, setSelectedTarget] = useState(null); // { type: 'branch_prep' | 'inventory_item', data: obj }
	const [quantity, setQuantity] = useState("1");
	const [selectedUnit, setSelectedUnit] = useState("portion");
	const [wastePercentage, setWastePercentage] = useState("0");
	const [notes, setNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// Quick inline calibration popover state
	const [showInlineCalibrate, setShowInlineCalibrate] = useState(false);
	const [inlineCalRatio, setInlineCalRatio] = useState("");

	// Filter targets based on search and avoid self-referencing
	const filteredBranchPreps = useMemo(() => {
		const q = search.trim().toLowerCase();
		return branchPreps.filter((bp) => {
			if (bp.id === currentRecipe?.id) return false; // Never allow adding self
			if (!q) return true;
			return (
				bp.name_english?.toLowerCase().includes(q) ||
				bp.name_burmese?.toLowerCase().includes(q)
			);
		});
	}, [branchPreps, currentRecipe?.id, search]);

	const filteredInventoryItems = useMemo(() => {
		const q = search.trim().toLowerCase();
		return inventoryItems.filter((item) => {
			// Culinary recipe pickers only allow culinary ingredients (skip packaging & operational supplies)
			if ((item.item_type || "ingredient") !== "ingredient") return false;

			if (!q) return true;
			return (
				item.name_english?.toLowerCase().includes(q) ||
				item.name_burmese?.toLowerCase().includes(q) ||
				item.name?.toLowerCase().includes(q) ||
				item.category?.toLowerCase().includes(q)
			);
		});
	}, [inventoryItems, search]);

	// Select a target item
	const handleSelectTarget = (type, data) => {
		setSelectedTarget({ type, data });
		if (type === "branch_prep") {
			setSelectedUnit(data.yield_unit || "portion");
		} else {
			// Prefer item's unit or base_unit
			setSelectedUnit(data.unit || "g");
		}
		setShowInlineCalibrate(false);
	};

	// Check if selected inventory item has calibration for current unit
	const isInformalUncalibrated = useMemo(() => {
		if (selectedTarget?.type !== "inventory_item") return false;
		const item = selectedTarget.data;
		if (selectedUnit === item.unit || selectedUnit === item.base_unit) return false;

		// Check if item has custom conversion in item_unit_conversions
		const hasCustom = item.item_unit_conversions?.some(
			(c) => c.unit_code === selectedUnit
		);
		return !hasCustom;
	}, [selectedTarget, selectedUnit]);

	const handleSaveInlineCalibration = async () => {
		const ratio = parseFloat(inlineCalRatio);
		if (!ratio || ratio <= 0) {
			showToast.error("Please enter a valid positive number");
			return;
		}

		const item = selectedTarget.data;
		const baseQty = item.base_quantity_per_unit || 1;
		// ratio is how many units in 1 purchase pack
		const multiplier = baseQty / ratio;

		const res = await addOrUpdateConversion({
			inventory_item_id: item.id,
			unit_code: selectedUnit,
			multiplier_to_base: multiplier,
			units_per_purchase_pack: ratio,
			notes: `Calibrated inline: ${ratio} ${selectedUnit} per 1 ${item.unit}`,
		});

		if (res?.success) {
			setShowInlineCalibrate(false);
			setInlineCalRatio("");
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!selectedTarget) {
			showToast.error("Please select an ingredient or sub-recipe");
			return;
		}

		const qty = parseFloat(quantity);
		if (isNaN(qty) || qty <= 0) {
			showToast.error("Please enter a valid quantity greater than 0");
			return;
		}

		const waste = parseFloat(wastePercentage) || 0;
		if (waste < 0 || waste >= 100) {
			showToast.error("Waste percentage must be between 0 and 99%");
			return;
		}

		setSubmitting(true);
		try {
			const payload = {
				parent_recipe_id: currentRecipe.id,
				component_type:
					selectedTarget.type === "branch_prep" ? "sub_recipe" : "inventory_item",
				inventory_item_id:
					selectedTarget.type === "inventory_item" ? selectedTarget.data.id : null,
				sub_recipe_id:
					selectedTarget.type === "branch_prep" ? selectedTarget.data.id : null,
				quantity: qty,
				unit: selectedUnit,
				waste_percentage: waste,
				notes: notes.trim() || null,
			};

			const result = await onAddComponent(payload);
			if (result?.success) {
				setSelectedTarget(null);
				setQuantity("1");
				setWastePercentage("0");
				setNotes("");
				setSearch("");
				setIsOpen(false);
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="bg-base-100 rounded-2xl border border-base-200 overflow-hidden shadow-sm">
			{!isOpen ? (
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="w-full p-4 flex items-center justify-center gap-2 font-medium text-sm text-primary hover:bg-primary/5 transition-colors">
					<Plus className="w-4 h-4" /> Add Component (ဆီချက်/အနှစ် သို့မဟုတ် ကုန်ကြမ်းထည့်ရန်)
				</button>
			) : (
				<div className="p-4 sm:p-5 space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Plus className="w-5 h-5 text-primary" />
							<h4 className="font-bold text-sm">
								Add Component to Recipe (ပါဝင်ပစ္စည်း ထည့်သွင်းရန်)
							</h4>
						</div>
						<button
							type="button"
							onClick={() => {
								setIsOpen(false);
								setSelectedTarget(null);
							}}
							className="btn btn-ghost btn-xs btn-circle">
							<X className="w-4 h-4" />
						</button>
					</div>

					{/* Step 1: Search & Target Selector */}
					{!selectedTarget ? (
						<div className="space-y-3">
							<div className="relative">
								<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
								<input
									type="text"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search sub-recipes or raw inventory ingredients..."
									className="input input-bordered input-sm w-full pl-9"
									autoFocus
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
								{/* Sub-recipes Column */}
								<div className="space-y-2">
									<span className="text-[11px] font-semibold tracking-wider text-indigo-500 uppercase flex items-center gap-1.5">
										<Utensils className="w-3.5 h-3.5" /> 🔗 Branch Preps ({filteredBranchPreps.length})
									</span>
									<div className="space-y-1.5">
										{filteredBranchPreps.map((bp) => (
											<button
												key={bp.id}
												type="button"
												onClick={() => handleSelectTarget("branch_prep", bp)}
												className="w-full text-left p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all flex items-center justify-between group">
												<div className="min-w-0 pr-2">
													<p className="font-semibold text-xs leading-relaxed text-indigo-950 dark:text-indigo-200 truncate">
														{bp.name_burmese}
													</p>
													<p className="text-[11px] text-base-content/60 truncate">
														{bp.name_english}
													</p>
												</div>
												<span className="badge badge-xs badge-ghost">
													{bp.yield_quantity} {bp.yield_unit}
												</span>
											</button>
										))}
										{filteredBranchPreps.length === 0 && (
											<p className="text-xs text-base-content/40 italic py-2">
												No matching branch preps
											</p>
										)}
									</div>
								</div>

								{/* Inventory Items Column */}
								<div className="space-y-2">
									<span className="text-[11px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5">
										<Box className="w-3.5 h-3.5" /> 📦 Raw Inventory Items ({filteredInventoryItems.length})
									</span>
									<div className="space-y-1.5">
										{filteredInventoryItems.slice(0, 20).map((inv) => (
											<button
												key={inv.id}
												type="button"
												onClick={() => handleSelectTarget("inventory_item", inv)}
												className="w-full text-left p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all flex items-center justify-between group">
												<div className="min-w-0 pr-2">
													<p className="font-semibold text-xs leading-relaxed text-emerald-950 dark:text-emerald-200 truncate">
														{inv.name_burmese || inv.name}
													</p>
													<p className="text-[11px] text-base-content/60 truncate">
														{inv.name_english || inv.category}
													</p>
												</div>
												<span className="badge badge-xs badge-ghost">
													1 {inv.unit}
												</span>
											</button>
										))}
										{filteredInventoryItems.length === 0 && (
											<p className="text-xs text-base-content/40 italic py-2">
												No matching raw items
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					) : (
						/* Step 2: Selected Target Configuration */
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="flex items-center justify-between p-3 rounded-xl bg-base-200/60 border border-base-300">
								<div className="flex items-center gap-2.5 min-w-0">
									<span
										className={`p-2 rounded-lg ${
											selectedTarget.type === "branch_prep"
												? "bg-indigo-500/10 text-indigo-500"
												: "bg-emerald-500/10 text-emerald-500"
										}`}>
										{selectedTarget.type === "branch_prep" ? (
											<Utensils className="w-4 h-4" />
										) : (
											<Box className="w-4 h-4" />
										)}
									</span>
									<div className="min-w-0">
										<p className="font-bold text-xs leading-relaxed truncate">
											{selectedTarget.data.name_burmese || selectedTarget.data.name}
										</p>
										<p className="text-[11px] text-base-content/60 truncate">
											{selectedTarget.data.name_english} (
											{selectedTarget.type === "branch_prep" ? "Branch Prep Sub-Recipe" : "Raw Inventory"}
											)
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => setSelectedTarget(null)}
									className="btn btn-ghost btn-xs">
									Change
								</button>
							</div>

							{/* Inputs: Quantity, Unit, Waste Percentage */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div>
									<label className="label py-1">
										<span className="label-text text-xs font-semibold">
											Quantity (ပမာဏ) <span className="text-error">*</span>
										</span>
									</label>
									<input
										type="number"
										step="any"
										value={quantity}
										onChange={(e) => setQuantity(e.target.value)}
										placeholder="e.g. 0.5, 2, 40"
										className="input input-bordered input-sm w-full"
										required
										autoFocus
									/>
								</div>

								<div>
									<label className="label py-1">
										<span className="label-text text-xs font-semibold">
											Unit (ယူနစ်) <span className="text-error">*</span>
										</span>
									</label>
									<select
										value={selectedUnit}
										onChange={(e) => setSelectedUnit(e.target.value)}
										className="select select-bordered select-sm w-full">
										{units.map((u) => (
											<option key={u.code} value={u.code}>
												{u.name_burmese} ({u.name_english})
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="label py-1">
										<span className="label-text text-xs font-semibold">
											Waste / Trim % (အလေအလွင့်)
										</span>
									</label>
									<input
										type="number"
										step="any"
										min="0"
										max="99"
										value={wastePercentage}
										onChange={(e) => setWastePercentage(e.target.value)}
										placeholder="0"
										className="input input-bordered input-sm w-full"
									/>
								</div>
							</div>

							{/* Inline Calibration Alert if informal unit uncalibrated */}
							{isInformalUncalibrated && (
								<div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-1.5">
											<AlertCircle className="w-4 h-4 text-amber-500" />
											<span className="font-semibold">
												Uncalibrated Unit: &ldquo;{selectedUnit}&rdquo; on {selectedTarget.data.name_english}
											</span>
										</div>
										{!showInlineCalibrate && (
											<button
												type="button"
												onClick={() => setShowInlineCalibrate(true)}
												className="btn btn-xs btn-outline btn-warning gap-1">
												<Wrench className="w-3 h-3" /> Calibrate Now
											</button>
										)}
									</div>
									<p className="text-[11px] opacity-80">
										Currently using global dictionary fallback. You can calibrate how many &ldquo;{selectedUnit}&rdquo; fit into 1 &ldquo;{selectedTarget.data.unit}&rdquo;.
									</p>

									{showInlineCalibrate && (
										<div className="flex items-center gap-2 pt-2 border-t border-amber-500/20">
											<span className="text-[11px]">How many {selectedUnit} in 1 {selectedTarget.data.unit}?</span>
											<input
												type="number"
												step="any"
												value={inlineCalRatio}
												onChange={(e) => setInlineCalRatio(e.target.value)}
												placeholder="e.g. 12"
												className="input input-bordered input-xs w-24"
											/>
											<button
												type="button"
												onClick={handleSaveInlineCalibration}
												className="btn btn-xs btn-warning">
												Save
											</button>
											<button
												type="button"
												onClick={() => setShowInlineCalibrate(false)}
												className="btn btn-xs btn-ghost">
												Cancel
											</button>
										</div>
									)}
								</div>
							)}

							{/* Optional Notes */}
							<div>
								<label className="label py-1">
									<span className="label-text text-xs font-semibold">
										Notes / Prep Instructions (မှတ်ချက်)
									</span>
								</label>
								<input
									type="text"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									placeholder="e.g. Diced finely, add at the end of simmering"
									className="input input-bordered input-sm w-full"
								/>
							</div>

							{/* Actions */}
							<div className="flex justify-end gap-2 pt-2">
								<button
									type="button"
									onClick={() => setSelectedTarget(null)}
									className="btn btn-sm btn-ghost">
									Back
								</button>
								<button
									type="submit"
									disabled={submitting}
									className="btn btn-sm btn-primary min-w-[100px]">
									{submitting ? (
										<span className="loading loading-spinner loading-xs"></span>
									) : (
										"Add to Recipe"
									)}
								</button>
							</div>
						</form>
					)}
				</div>
			)}
		</div>
	);
};

export default RecipeComponentAdder;
