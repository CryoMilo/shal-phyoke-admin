// src/components/inventory/InventoryItemModal.jsx
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { X, Plus, Trash2, Scale, Calculator } from "lucide-react";
import ImageUpload from "../common/ImageUpload";
import useMeasurementUnitStore from "../../stores/measurementUnitStore";
import useInventoryStore from "../../stores/inventoryStore";
import { showToast } from "../../utils/toastUtils";

const validationRules = {
	name_burmese: {
		required: "Burmese name is required (မြန်မာအမည် လိုအပ်ပါသည်)",
		minLength: {
			value: 2,
			message: "Name must be at least 2 characters",
		},
	},
	name_english: {
		required: "English name is required",
		minLength: {
			value: 2,
			message: "Name must be at least 2 characters",
		},
	},
	category: {
		required: "Category is required",
	},
	unit: {
		required: "Purchase unit is required",
	},
	base_unit: {
		required: "Base tracking unit is required",
	},
	base_quantity_per_unit: {
		required: "Base quantity is required",
		min: {
			value: 0.00001,
			message: "Base quantity must be greater than 0",
		},
	},
	cost_per_unit: {
		min: {
			value: 0,
			message: "Cost cannot be negative",
		},
	},
	order_cycle_days: {
		min: {
			value: 1,
			message: "Order cycle must be at least 1 day",
		},
	},
	quantity: {
		min: {
			value: 0,
			message: "Quantity cannot be negative",
		},
	},
	threshold: {
		min: {
			value: 0,
			message: "Threshold cannot be negative",
		},
	},
};

const commonCategories = [
	"Meat",
	"Seafood",
	"Vegetables",
	"Fruits",
	"Dairy",
	"Dry Goods",
	"Spices",
	"Sauces & Pastes",
	"Packaging",
	"Cleaning",
	"Other",
];

const BASE_UNIT_OPTIONS = [
	{ code: "g", label: "Grams (g / ဂရမ်)" },
	{ code: "ml", label: "Milliliters (ml / မီလီလီတာ)" },
	{ code: "piece", label: "Pieces (ခု / လုံး)" },
	{ code: "pack", label: "Packs (ထုပ်)" },
];

const InventoryItemModal = ({
	showModal,
	setShowModal,
	editingItem,
	handleSubmit,
	loading,
	vendors,
}) => {
	const { units, fetchUnits } = useMeasurementUnitStore();
	const { addOrUpdateConversion, deleteConversion } = useInventoryStore();

	const {
		register,
		handleSubmit: formSubmit,
		control,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm({
		defaultValues: {
			name_burmese: "",
			name_english: "",
			category: "Other",
			default_vendor_id: "",
			unit: "pack",
			base_unit: "g",
			base_quantity_per_unit: 1000,
			cost_per_unit: 0,
			order_cycle_days: 1,
			image_url: "",
			is_regular: true,
			quantity: 0,
			threshold: 0,
		},
	});

	const [showCustomCategory, setShowCustomCategory] = useState(false);
	const [customCategory, setCustomCategory] = useState("");
	const [uploadError, setUploadError] = useState("");

	// Calibration Sub-form State
	const [newCalUnit, setNewCalUnit] = useState("tbsp");
	const [calMode, setCalMode] = useState("packs_per"); // 'packs_per' (e.g. 12 cups per pack) or 'direct_base' (e.g. 1 cup = 85g)
	const [calInputValue, setCalInputValue] = useState("");
	const [calibrationsList, setCalibrationsList] = useState([]);

	const watchedPurchaseUnit = watch("unit") || "pack";
	const watchedBaseUnit = watch("base_unit") || "g";
	const watchedBaseQty = parseFloat(watch("base_quantity_per_unit")) || 1;

	useEffect(() => {
		fetchUnits();
	}, [fetchUnits]);

	// Load editing item data
	useEffect(() => {
		if (editingItem) {
			reset({
				name_burmese: editingItem.name_burmese || editingItem.name || "",
				name_english: editingItem.name_english || editingItem.name || "",
				category: editingItem.category || "Other",
				default_vendor_id: editingItem.default_vendor_id || "",
				unit: editingItem.unit || "pack",
				base_unit: editingItem.base_unit || "g",
				base_quantity_per_unit: editingItem.base_quantity_per_unit || 1,
				cost_per_unit: editingItem.cost_per_unit || 0,
				order_cycle_days: editingItem.order_cycle_days || 1,
				image_url: editingItem.image_url || "",
				is_regular: editingItem.is_regular ?? true,
				quantity: editingItem.quantity || 0,
				threshold: editingItem.threshold || 0,
			});

			setCalibrationsList(editingItem.item_unit_conversions || []);

			const isCustom = !commonCategories.includes(editingItem.category || "");
			setShowCustomCategory(isCustom);
			if (isCustom) {
				setCustomCategory(editingItem.category || "");
			}
		} else {
			reset({
				name_burmese: "",
				name_english: "",
				category: "Other",
				default_vendor_id: "",
				unit: "pack",
				base_unit: "g",
				base_quantity_per_unit: 1000,
				cost_per_unit: 0,
				order_cycle_days: 1,
				image_url: "",
				is_regular: true,
				quantity: 0,
				threshold: 0,
			});
			setCalibrationsList([]);
			setShowCustomCategory(false);
			setCustomCategory("");
		}
	}, [editingItem, reset]);

	// Update form when custom category changes
	useEffect(() => {
		if (showCustomCategory && customCategory) {
			setValue("category", customCategory, { shouldValidate: true });
		}
	}, [customCategory, showCustomCategory, setValue]);

	const handleClose = () => {
		reset();
		setShowCustomCategory(false);
		setCustomCategory("");
		setUploadError("");
		setShowModal(false);
	};

	// Save or add calibration rule
	const handleAddCalibration = async () => {
		const val = parseFloat(calInputValue);
		if (!val || val <= 0) {
			showToast.error("Please enter a valid positive number for calibration");
			return;
		}

		let multiplier = 0;
		let unitsPerPack = null;

		if (calMode === "packs_per") {
			// e.g. 12 cups per 1 pack -> 1 cup = base_quantity_per_unit / 12
			multiplier = watchedBaseQty / val;
			unitsPerPack = val;
		} else {
			// e.g. 1 tbsp = 15 g
			multiplier = val;
			unitsPerPack = watchedBaseQty / val;
		}

		if (editingItem?.id) {
			// Save directly to Supabase via store
			const res = await addOrUpdateConversion({
				inventory_item_id: editingItem.id,
				unit_code: newCalUnit,
				multiplier_to_base: multiplier,
				units_per_purchase_pack: unitsPerPack,
				notes: calMode === "packs_per" ? `${val} ${newCalUnit} per 1 ${watchedPurchaseUnit}` : `1 ${newCalUnit} = ${val} ${watchedBaseUnit}`,
			});

			if (res.success) {
				setCalInputValue("");
			}
		} else {
			// Local temporary list for new item
			setCalibrationsList((prev) => [
				...prev.filter((c) => c.unit_code !== newCalUnit),
				{
					unit_code: newCalUnit,
					multiplier_to_base: multiplier,
					units_per_purchase_pack: unitsPerPack,
					notes: calMode === "packs_per" ? `${val} ${newCalUnit} per 1 ${watchedPurchaseUnit}` : `1 ${newCalUnit} = ${val} ${watchedBaseUnit}`,
				},
			]);
			setCalInputValue("");
			showToast.success("Added calibration rule (will save with item)");
		}
	};

	const handleDeleteCalibration = async (cal) => {
		if (cal.id) {
			await deleteConversion(cal.id);
			setCalibrationsList((prev) => prev.filter((c) => c.id !== cal.id));
		} else {
			setCalibrationsList((prev) => prev.filter((c) => c.unit_code !== cal.unit_code));
		}
	};

	const onSubmit = async (data) => {
		const dataToSave = {
			...data,
			name_burmese: data.name_burmese.trim(),
			name_english: data.name_english.trim(),
			default_vendor_id: data.default_vendor_id || null,
			image_url: data.image_url || null,
			base_unit: data.base_unit || "g",
			base_quantity_per_unit: parseFloat(data.base_quantity_per_unit) || 1,
			cost_per_unit: parseFloat(data.cost_per_unit) || 0,
			order_cycle_days: parseInt(data.order_cycle_days, 10) || 1,
			quantity: parseFloat(data.quantity) || 0,
			threshold: parseFloat(data.threshold) || 0,
		};

		const savedResult = await handleSubmit(dataToSave);

		// If this was a new item and had pending calibrations, persist them now
		if (!editingItem && savedResult?.item?.id && calibrationsList.length > 0) {
			for (const cal of calibrationsList) {
				await addOrUpdateConversion({
					inventory_item_id: savedResult.item.id,
					unit_code: cal.unit_code,
					multiplier_to_base: cal.multiplier_to_base,
					units_per_purchase_pack: cal.units_per_purchase_pack,
					notes: cal.notes,
				});
			}
		}
	};

	// Units eligible for kitchen calibration (informal, volume, count)
	const kitchenUnits = units.filter((u) => u.code !== watchedPurchaseUnit && u.code !== watchedBaseUnit);

	if (!showModal) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-2xl relative max-h-[92vh] overflow-y-auto">
				{/* Close button */}
				<button
					type="button"
					onClick={handleClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
					aria-label="Close">
					<X className="w-4 h-4" />
				</button>

				<div className="mb-6 pr-8">
					<h3 className="font-bold text-xl leading-relaxed">
						{editingItem ? "Edit Raw Ingredient / ပစ္စည်းပြင်ဆင်ရန်" : "Add Raw Ingredient / ကုန်ကြမ်းပစ္စည်းအသစ်ထည့်ရန်"}
					</h3>
					<p className="text-xs text-base-content/60 mt-0.5">
						Configure vendor purchasing package, kitchen conversion calibrations, and costing.
					</p>
				</div>

				<form onSubmit={formSubmit(onSubmit)} className="space-y-5" noValidate>
					{/* Image Upload */}
					<Controller
						name="image_url"
						control={control}
						render={({ field }) => (
							<ImageUpload
								bucket="inventory-images"
								folder="inventory-items"
								value={field.value}
								onChange={field.onChange}
								label="Ingredient Photo"
								required={false}
								maxSizeMB={5}
								allowedTypes={["image/jpeg", "image/png", "image/webp"]}
								onError={setUploadError}
								placeholder="Upload photo of raw stock packaging"
							/>
						)}
					/>

					{/* Bilingual Names */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{/* Burmese Name (Primary) */}
						<div className="form-control">
							<label className="label" htmlFor="name_burmese">
								<span className="label-text font-semibold text-primary">
									Burmese Name (မြန်မာအမည်) <span className="text-error">*</span>
								</span>
							</label>
							<input
								id="name_burmese"
								type="text"
								{...register("name_burmese", validationRules.name_burmese)}
								placeholder="ဥပမာ - ကြက်ရင်အုံသား၊ နှမ်းဆီမွှေး"
								className={`input input-bordered w-full leading-relaxed ${
									errors.name_burmese ? "input-error" : ""
								}`}
							/>
							{errors.name_burmese && (
								<label className="label">
									<span className="label-text-alt text-error">
										{errors.name_burmese.message}
									</span>
								</label>
							)}
						</div>

						{/* English Name (Secondary) */}
						<div className="form-control">
							<label className="label" htmlFor="name_english">
								<span className="label-text font-medium text-base-content/80">
									English Name <span className="text-error">*</span>
								</span>
							</label>
							<input
								id="name_english"
								type="text"
								{...register("name_english", validationRules.name_english)}
								placeholder="e.g., Chicken Breast, Sesame Oil"
								className={`input input-bordered w-full ${
									errors.name_english ? "input-error" : ""
								}`}
							/>
							{errors.name_english && (
								<label className="label">
									<span className="label-text-alt text-error">
										{errors.name_english.message}
									</span>
								</label>
							)}
						</div>
					</div>

					{/* Category & Default Vendor */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{/* Category */}
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">
									Category <span className="text-error">*</span>
								</span>
							</label>
							{!showCustomCategory ? (
								<div className="flex gap-2">
									<select
										{...register("category", validationRules.category)}
										className={`select select-bordered flex-1 ${
											errors.category ? "select-error" : ""
										}`}>
										{commonCategories.map((cat) => (
											<option key={cat} value={cat}>
												{cat}
											</option>
										))}
									</select>
									<button
										type="button"
										onClick={() => setShowCustomCategory(true)}
										className="btn btn-outline whitespace-nowrap">
										Custom
									</button>
								</div>
							) : (
								<div className="flex gap-2">
									<input
										type="text"
										value={customCategory}
										onChange={(e) => setCustomCategory(e.target.value)}
										placeholder="Custom category"
										className={`input input-bordered flex-1 ${
											errors.category ? "input-error" : ""
										}`}
										autoFocus
									/>
									<button
										type="button"
										onClick={() => {
											setShowCustomCategory(false);
											setValue("category", "Other");
										}}
										className="btn btn-outline whitespace-nowrap">
										Select
									</button>
								</div>
							)}
						</div>

						{/* Default Vendor */}
						<div className="form-control">
							<label className="label" htmlFor="default_vendor_id">
								<span className="label-text font-medium">Default Vendor</span>
							</label>
							<select
								id="default_vendor_id"
								{...register("default_vendor_id")}
								className="select select-bordered w-full">
								<option value="">No default vendor</option>
								{vendors.map((vendor) => (
									<option key={vendor.id} value={vendor.id}>
										{vendor.name}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* SECTION: 3-TIER PACKAGING & COST SPECIFICATION */}
					<div className="p-4 rounded-xl bg-base-200/60 border border-base-300 space-y-4">
						<div className="flex items-center gap-2">
							<Scale className="w-5 h-5 text-primary" />
							<h4 className="font-semibold text-sm">
								Packaging & Cost Calibration (ဝယ်ယူမှုထုပ်ပိုးပုံနှင့် ကုန်ကျစရိတ်)
							</h4>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							{/* Purchase Unit */}
							<div className="form-control">
								<label className="label py-1" htmlFor="unit">
									<span className="label-text text-xs font-semibold">
										Purchase Unit (ဝယ်ယူသည့်ယူနစ်) <span className="text-error">*</span>
									</span>
								</label>
								<input
									id="unit"
									type="text"
									{...register("unit", validationRules.unit)}
									placeholder="e.g. pack, bottle, sack, kg"
									className={`input input-bordered input-sm w-full ${
										errors.unit ? "input-error" : ""
									}`}
								/>
							</div>

							{/* Base Tracking Unit */}
							<div className="form-control">
								<label className="label py-1" htmlFor="base_unit">
									<span className="label-text text-xs font-semibold">
										Base Tracking Unit <span className="text-error">*</span>
									</span>
								</label>
								<select
									id="base_unit"
									{...register("base_unit", validationRules.base_unit)}
									className="select select-bordered select-sm w-full">
									{BASE_UNIT_OPTIONS.map((opt) => (
										<option key={opt.code} value={opt.code}>
											{opt.label}
										</option>
									))}
								</select>
							</div>

							{/* Base Quantity per Unit */}
							<div className="form-control">
								<label className="label py-1" htmlFor="base_quantity_per_unit">
									<span className="label-text text-xs font-semibold">
										Base Qty per 1 {watchedPurchaseUnit} <span className="text-error">*</span>
									</span>
								</label>
								<input
									id="base_quantity_per_unit"
									type="number"
									step="any"
									{...register("base_quantity_per_unit", validationRules.base_quantity_per_unit)}
									placeholder="e.g. 500, 1000"
									className={`input input-bordered input-sm w-full ${
										errors.base_quantity_per_unit ? "input-error" : ""
									}`}
								/>
							</div>
						</div>

						{/* Cost per Purchase Unit & Order Cycle */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
							<div className="form-control">
								<label className="label py-1" htmlFor="cost_per_unit">
									<span className="label-text text-xs font-semibold">
										Cost per {watchedPurchaseUnit} (ဝယ်ယူဈေးနှုန်း THB)
									</span>
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-base-content/60">฿</span>
									<input
										id="cost_per_unit"
										type="number"
										step="0.01"
										{...register("cost_per_unit", validationRules.cost_per_unit)}
										placeholder="0.00"
										className="input input-bordered input-sm w-full pl-7"
									/>
								</div>
							</div>

							<div className="form-control">
								<label className="label py-1" htmlFor="order_cycle_days">
									<span className="label-text text-xs font-semibold">
										Order Cycle Days (ဝယ်ယူမှုသံသရာ ရက်အရေအတွက်)
									</span>
								</label>
								<input
									id="order_cycle_days"
									type="number"
									min="1"
									{...register("order_cycle_days", validationRules.order_cycle_days)}
									placeholder="1 (Daily), 3, or 7 (Weekly)"
									className="input input-bordered input-sm w-full"
								/>
							</div>
						</div>

						{/* Summary Helper Banner */}
						<div className="bg-base-100 p-2.5 rounded-lg border border-base-200 text-xs text-base-content/70">
							<p className="font-medium text-primary">
								📌 1 {watchedPurchaseUnit} = {watchedBaseQty} {watchedBaseUnit}
								{parseFloat(watch("cost_per_unit")) > 0 && (
									<span> • Cost per {watchedBaseUnit}: ฿{(parseFloat(watch("cost_per_unit")) / (watchedBaseQty || 1)).toFixed(4)}</span>
								)}
							</p>
						</div>
					</div>

					{/* SECTION: KITCHEN SCOOP / INFORMAL UNIT CALIBRATOR */}
					<div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Calculator className="w-5 h-5 text-amber-500" />
								<h4 className="font-semibold text-sm text-amber-900 dark:text-amber-300">
									Kitchen Scoop Calibrator (မီးဖိုချောင်သုံး ခွက်/ဇွန်း ချိန်ညှိချက်)
								</h4>
							</div>
							<span className="text-[11px] badge badge-warning badge-outline">Overrides</span>
						</div>
						<p className="text-xs text-base-content/60">
							Add calibrations for how kitchen staff measure this item (e.g. 1 pack = 12 cups, or 1 sprinkle = 2g).
						</p>

						{/* Existing Calibrations List */}
						{calibrationsList.length > 0 ? (
							<div className="flex flex-wrap gap-2 pt-1">
								{calibrationsList.map((cal, idx) => (
									<div
										key={cal.id || cal.unit_code || idx}
										className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-base-100 border border-base-300 text-xs shadow-sm">
										<span className="font-semibold text-primary">{cal.unit_code}</span>
										<span className="text-base-content/70">
											= {Math.round(cal.multiplier_to_base * 100) / 100} {watchedBaseUnit}
										</span>
										{cal.units_per_purchase_pack && (
											<span className="badge badge-ghost badge-xs">
												{cal.units_per_purchase_pack} / {watchedPurchaseUnit}
											</span>
										)}
										<button
											type="button"
											onClick={() => handleDeleteCalibration(cal)}
											className="btn btn-ghost btn-xs btn-circle text-error ml-1"
											title="Delete calibration">
											<Trash2 className="w-3 h-3" />
										</button>
									</div>
								))}
							</div>
						) : (
							<p className="text-xs italic text-base-content/50 py-1">
								No custom kitchen calibrations yet. Default global conversions will apply.
							</p>
						)}

						{/* Quick Add Calibration Row */}
						<div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-amber-500/20 items-end">
							<div className="w-full sm:w-1/3">
								<label className="label py-0.5">
									<span className="label-text text-[11px] font-semibold">Kitchen Unit</span>
								</label>
								<select
									value={newCalUnit}
									onChange={(e) => setNewCalUnit(e.target.value)}
									className="select select-bordered select-xs w-full">
									{kitchenUnits.map((u) => (
										<option key={u.code} value={u.code}>
											{u.name_burmese} ({u.name_english})
										</option>
									))}
								</select>
							</div>

							<div className="w-full sm:w-1/3">
								<label className="label py-0.5 flex justify-between">
									<span className="label-text text-[11px] font-semibold">
										{calMode === "packs_per" ? `Units in 1 ${watchedPurchaseUnit}` : `${watchedBaseUnit} in 1 unit`}
									</span>
									<button
										type="button"
										onClick={() => setCalMode(calMode === "packs_per" ? "direct_base" : "packs_per")}
										className="text-[10px] text-primary hover:underline">
										Switch mode
									</button>
								</label>
								<input
									type="number"
									step="any"
									value={calInputValue}
									onChange={(e) => setCalInputValue(e.target.value)}
									placeholder={calMode === "packs_per" ? "e.g. 12" : "e.g. 85"}
									className="input input-bordered input-xs w-full"
								/>
							</div>

							<button
								type="button"
								onClick={handleAddCalibration}
								className="btn btn-xs btn-primary gap-1 whitespace-nowrap w-full sm:w-auto">
								<Plus className="w-3 h-3" /> Add Rule
							</button>
						</div>
					</div>

					{/* Current Stock and Low Stock Threshold */}
					<div className="grid grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label" htmlFor="quantity">
								<span className="label-text font-medium">Current Stock ({watchedPurchaseUnit})</span>
							</label>
							<input
								id="quantity"
								type="number"
								step="any"
								{...register("quantity", validationRules.quantity)}
								placeholder="0"
								className={`input input-bordered w-full ${
									errors.quantity ? "input-error" : ""
								}`}
							/>
						</div>

						<div className="form-control">
							<label className="label" htmlFor="threshold">
								<span className="label-text font-medium">Low Stock Alert ({watchedPurchaseUnit})</span>
							</label>
							<input
								id="threshold"
								type="number"
								step="any"
								{...register("threshold", validationRules.threshold)}
								placeholder="0"
								className={`input input-bordered w-full ${
									errors.threshold ? "input-error" : ""
								}`}
							/>
						</div>
					</div>

					{/* Regular Item Checkbox */}
					<div className="form-control">
						<label className="label cursor-pointer justify-start gap-4">
							<input
								type="checkbox"
								{...register("is_regular")}
								className="checkbox checkbox-primary"
							/>
							<span className="label-text">Regular pantry item (always kept in stock)</span>
						</label>
					</div>

					{/* Upload Error */}
					{uploadError && (
						<div className="alert alert-error text-sm py-2">
							<span>{uploadError}</span>
						</div>
					)}

					{/* Form Actions */}
					<div className="modal-action">
						<button
							type="button"
							onClick={handleClose}
							className="btn btn-ghost"
							disabled={loading}>
							Cancel
						</button>
						<button
							type="submit"
							className="btn btn-primary min-w-[120px]"
							disabled={loading || !!uploadError}>
							{loading ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : editingItem ? (
								"Update Item"
							) : (
								"Create Item"
							)}
						</button>
					</div>
				</form>
			</div>
			<div className="modal-backdrop" onClick={handleClose} />
		</div>
	);
};

export default InventoryItemModal;
