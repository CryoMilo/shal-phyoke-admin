// src/components/kitchenLogs/LogSpoilageModal.jsx
import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Box, Utensils } from "lucide-react";
import useRecipeStore from "../../stores/recipeStore";
import useInventoryStore from "../../stores/inventoryStore";
import useKitchenLogStore from "../../stores/kitchenLogStore";
import ImageUpload from "../common/ImageUpload";
import { showToast } from "../../utils/toastUtils";

const SPOILAGE_REASONS = [
	{ code: "bad_raw_material", label: "Bad Raw Material / Rotten" },
	{ code: "burnt", label: "Burnt / Overcooked" },
	{ code: "expired", label: "Expired Shelf Life" },
	{ code: "dropped", label: "Dropped / Spilled" },
	{ code: "storage_temp", label: "Fridge Temperature Failure" },
	{ code: "other", label: "Other / Unaccounted" },
];

const LogSpoilageModal = ({ showModal, setShowModal, defaultDate }) => {
	const { recipes, fetchRecipes } = useRecipeStore();
	const { inventoryItems, fetchInventoryItems } = useInventoryStore();
	const { createSpoilageLog, loading } = useKitchenLogStore();

	const [logDate, setLogDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
	const [targetType, setTargetType] = useState("raw"); // 'raw' | 'recipe'
	const [selectedItemId, setSelectedItemId] = useState("");
	const [wasteQuantity, setWasteQuantity] = useState("");
	const [wasteReason, setWasteReason] = useState(SPOILAGE_REASONS[0].code);
	const [customReason, setCustomReason] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [uploadError, setUploadError] = useState("");

	useEffect(() => {
		if (showModal) {
			setLogDate(defaultDate || new Date().toISOString().split("T")[0]);
			if (recipes.length === 0) fetchRecipes();
			if (inventoryItems.length === 0) fetchInventoryItems();
		}
	}, [showModal, defaultDate, recipes.length, inventoryItems.length, fetchRecipes, fetchInventoryItems]);

	const selectedRawItem = inventoryItems.find((i) => i.id === selectedItemId);
	const selectedRecipe = recipes.find((r) => r.id === selectedItemId);
	const currentUnit = targetType === "raw" ? selectedRawItem?.unit : selectedRecipe?.yield_unit;

	const handleClose = () => {
		setSelectedItemId("");
		setWasteQuantity("");
		setCustomReason("");
		setImageUrl("");
		setUploadError("");
		setShowModal(false);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!selectedItemId) {
			showToast.error("Please select the item that was wasted");
			return;
		}

		const qty = parseFloat(wasteQuantity);
		if (isNaN(qty) || qty <= 0) {
			showToast.error("Please enter a valid wasted quantity");
			return;
		}

		const reasonText = wasteReason === "other" && customReason
			? customReason
			: SPOILAGE_REASONS.find((r) => r.code === wasteReason)?.label || wasteReason;

		const payload = {
			log_date: logDate,
			recipe_id: targetType === "recipe" ? selectedItemId : null,
			inventory_item_id: targetType === "raw" ? selectedItemId : null,
			quantity_produced: 0,
			waste_quantity: qty,
			unit: currentUnit || "portion",
			waste_reason: reasonText,
			image_url: imageUrl || null,
		};

		const res = await createSpoilageLog(payload);
		if (res?.success) {
			handleClose();
		}
	};

	if (!showModal) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-lg relative max-h-[92vh] overflow-y-auto">
				<button
					type="button"
					onClick={handleClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3">
					<X className="w-4 h-4" />
				</button>

				<div className="flex items-center gap-2 mb-4">
					<AlertTriangle className="w-6 h-6 text-rose-500" />
					<div>
						<h3 className="font-bold text-lg leading-relaxed text-rose-950 dark:text-rose-200">
							Log Spoilage & Waste
						</h3>
						<p className="text-xs text-base-content/60">
							Record burnt food, dropped ingredients, expired preps, and photos.
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Log Date */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text text-xs font-semibold">Incident Date</span>
						</label>
						<input
							type="date"
							value={logDate}
							onChange={(e) => setLogDate(e.target.value)}
							className="input input-bordered input-sm w-full"
							required
						/>
					</div>

					{/* Target Type Selector */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text text-xs font-semibold">Type of Wasted Item</span>
						</label>
						<div className="grid grid-cols-2 gap-2">
							<button
								type="button"
								onClick={() => {
									setTargetType("raw");
									setSelectedItemId("");
								}}
								className={`btn btn-sm gap-1.5 ${
									targetType === "raw" ? "btn-primary" : "btn-outline"
								}`}>
								<Box className="w-4 h-4" /> Raw Stock Item
							</button>
							<button
								type="button"
								onClick={() => {
									setTargetType("recipe");
									setSelectedItemId("");
								}}
								className={`btn btn-sm gap-1.5 ${
									targetType === "recipe" ? "btn-primary" : "btn-outline"
								}`}>
								<Utensils className="w-4 h-4" /> Cooked Batch / Dish
							</button>
						</div>
					</div>

					{/* Item Dropdown */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text text-xs font-semibold">
								Select Item <span className="text-error">*</span>
							</span>
						</label>
						<select
							value={selectedItemId}
							onChange={(e) => setSelectedItemId(e.target.value)}
							className="select select-bordered select-sm w-full"
							required>
							<option value="">-- Choose Wasted Item --</option>
							{targetType === "raw"
								? inventoryItems.map((i) => (
										<option key={i.id} value={i.id}>
											{i.name_burmese} ({i.name_english}) — Unit: {i.unit}
										</option>
								  ))
								: recipes.map((r) => (
										<option key={r.id} value={r.id}>
											[{r.recipe_type === "branch_prep" ? "Branch Prep" : "Menu Dish"}] {r.name_burmese} ({r.name_english})
										</option>
								  ))}
						</select>
					</div>

					{/* Quantity Wasted */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text text-xs font-semibold">
								Quantity Wasted <span className="text-error">*</span>
							</span>
						</label>
						<div className="flex items-center gap-2">
							<input
								type="number"
								step="any"
								min="0.001"
								value={wasteQuantity}
								onChange={(e) => setWasteQuantity(e.target.value)}
								placeholder="e.g. 1.5, 200"
								className="input input-bordered input-sm flex-1 font-bold text-rose-500"
								required
							/>
							<span className="text-xs font-semibold text-base-content/80 min-w-[50px]">
								{currentUnit || "unit"}
							</span>
						</div>
					</div>

					{/* Waste Reason */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text text-xs font-semibold">Waste Reason</span>
						</label>
						<select
							value={wasteReason}
							onChange={(e) => setWasteReason(e.target.value)}
							className="select select-bordered select-sm w-full">
							{SPOILAGE_REASONS.map((r) => (
								<option key={r.code} value={r.code}>
									{r.label}
								</option>
							))}
						</select>
					</div>

					{wasteReason === "other" && (
						<input
							type="text"
							value={customReason}
							onChange={(e) => setCustomReason(e.target.value)}
							placeholder="Please specify what happened..."
							className="input input-bordered input-sm w-full text-xs"
						/>
					)}

					{/* Optional Photo Proof */}
					<div className="form-control pt-1">
						<label className="label py-1">
							<span className="label-text text-xs font-semibold">Photo Proof (Optional)</span>
						</label>
						<ImageUpload
							bucket="menu-images"
							folder="spoilage-proofs"
							value={imageUrl}
							onChange={setImageUrl}
							label="Upload photo of ruined batch/food"
							required={false}
							maxSizeMB={5}
							allowedTypes={["image/jpeg", "image/png", "image/webp"]}
							onError={setUploadError}
						/>
					</div>

					{uploadError && (
						<div className="alert alert-error text-xs py-2">
							<span>{uploadError}</span>
						</div>
					)}

					<div className="modal-action">
						<button
							type="button"
							onClick={handleClose}
							className="btn btn-ghost btn-sm"
							disabled={loading}>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading || !selectedItemId}
							className="btn btn-error btn-sm min-w-[120px]">
							{loading ? (
								<span className="loading loading-spinner loading-xs"></span>
							) : (
								"Record Spoilage"
							)}
						</button>
					</div>
				</form>
			</div>
			<div className="modal-backdrop" onClick={handleClose} />
		</div>
	);
};

export default LogSpoilageModal;
