// src/components/inventory/InventoryItemModal.jsx
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { X } from "lucide-react";
import ImageUpload from "../common/ImageUpload";

// Validation schema
const validationRules = {
	name: {
		required: "Item name is required",
		minLength: {
			value: 2,
			message: "Name must be at least 2 characters",
		},
	},
	category: {
		required: "Category is required",
	},
	unit: {
		required: "Unit is required",
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

const InventoryItemModal = ({
	showModal,
	setShowModal,
	editingItem,
	handleSubmit,
	loading,
	vendors,
}) => {
	const {
		register,
		handleSubmit: formSubmit,
		control,
		formState: { errors },
		reset,
		setValue,
	} = useForm({
		defaultValues: {
			name: "",
			category: "Other",
			default_vendor_id: "",
			unit: "piece",
			image_url: "",
			is_regular: true,
			quantity: 0,
			threshold: 0,
		},
	});

	const [showCustomCategory, setShowCustomCategory] = React.useState(false);
	const [customCategory, setCustomCategory] = React.useState("");
	const [uploadError, setUploadError] = React.useState("");

	// Common categories for quick selection
	const commonCategories = [
		"Meat",
		"Seafood",
		"Vegetables",
		"Fruits",
		"Dairy",
		"Dry Goods",
		"Spices",
		"Packaging",
		"Cleaning",
		"Other",
	];

	// Load editing item data
	useEffect(() => {
		if (editingItem) {
			reset({
				name: editingItem.name || "",
				category: editingItem.category || "Other",
				default_vendor_id: editingItem.default_vendor_id || "",
				unit: editingItem.unit || "piece",
				image_url: editingItem.image_url || "",
				is_regular: editingItem.is_regular ?? true,
				quantity: editingItem.quantity || 0,
				threshold: editingItem.threshold || 0,
			});

			const isCustom = !commonCategories.includes(editingItem.category || "");
			setShowCustomCategory(isCustom);
			if (isCustom) {
				setCustomCategory(editingItem.category || "");
			}
		} else {
			reset();
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

	const onSubmit = async (data) => {
		// Prepare data for submission
		const dataToSave = {
			...data,
			default_vendor_id: data.default_vendor_id || null,
			image_url: data.image_url || null,
			quantity: parseFloat(data.quantity) || 0,
			threshold: parseFloat(data.threshold) || 0,
		};

		await handleSubmit(dataToSave);
	};

	if (!showModal) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-2xl relative max-h-[90vh] overflow-y-auto">
				{/* Close button */}
				<button
					type="button"
					onClick={handleClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
					aria-label="Close">
					<X className="w-4 h-4" />
				</button>

				<h3 className="font-bold text-xl mb-6 pr-8">
					{editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}
				</h3>

				<form onSubmit={formSubmit(onSubmit)} className="space-y-5" noValidate>
					{/* Image Upload - Controlled by Controller */}
					<Controller
						name="image_url"
						control={control}
						render={({ field }) => (
							<ImageUpload
								bucket="inventory-images"
								folder="inventory-items"
								value={field.value}
								onChange={field.onChange}
								label="Item Image"
								required={false}
								maxSizeMB={5}
								allowedTypes={["image/jpeg", "image/png", "image/webp"]}
								onError={setUploadError}
								placeholder="Upload an image of the item"
							/>
						)}
					/>

					{/* Name */}
					<div className="form-control">
						<label className="label" htmlFor="name">
							<span className="label-text font-medium">
								Item Name <span className="text-error">*</span>
							</span>
						</label>
						<input
							id="name"
							type="text"
							{...register("name", validationRules.name)}
							placeholder="e.g., Chicken Breast, Cooking Oil"
							className={`input input-bordered w-full ${
								errors.name ? "input-error" : ""
							}`}
							aria-invalid={errors.name ? "true" : "false"}
						/>
						{errors.name && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.name.message}
								</span>
							</label>
						)}
					</div>

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
									placeholder="Enter custom category"
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
						{errors.category && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.category.message}
								</span>
							</label>
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

					{/* Unit */}
					<div className="form-control">
						<label className="label" htmlFor="unit">
							<span className="label-text font-medium">
								Unit <span className="text-error">*</span>
							</span>
						</label>
						<input
							id="unit"
							type="text"
							{...register("unit", validationRules.unit)}
							placeholder="kg, g, liter, piece, box, etc."
							className={`input input-bordered w-full ${
								errors.unit ? "input-error" : ""
							}`}
						/>
						{errors.unit && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.unit.message}
								</span>
							</label>
						)}
					</div>

					{/* Quantity and Threshold - New Fields */}
					<div className="grid grid-cols-2 gap-4">
						{/* Quantity */}
						<div className="form-control">
							<label className="label" htmlFor="quantity">
								<span className="label-text font-medium">Current Stock</span>
							</label>
							<input
								id="quantity"
								type="text"
								inputMode="decimal"
								{...register("quantity", validationRules.quantity)}
								placeholder="0"
								className={`input input-bordered w-full ${
									errors.quantity ? "input-error" : ""
								}`}
							/>
							{errors.quantity && (
								<label className="label">
									<span className="label-text-alt text-error">
										{errors.quantity.message}
									</span>
								</label>
							)}
						</div>

						{/* Threshold */}
						<div className="form-control">
							<label className="label" htmlFor="threshold">
								<span className="label-text font-medium">
									Low Stock Threshold
								</span>
							</label>
							<input
								id="threshold"
								type="text"
								inputMode="decimal"
								{...register("threshold", validationRules.threshold)}
								placeholder="0"
								className={`input input-bordered w-full ${
									errors.threshold ? "input-error" : ""
								}`}
							/>
							{errors.threshold && (
								<label className="label">
									<span className="label-text-alt text-error">
										{errors.threshold.message}
									</span>
								</label>
							)}
						</div>
					</div>

					{/* Item Type */}
					<div className="form-control">
						<label className="label cursor-pointer justify-start gap-4">
							<input
								type="checkbox"
								{...register("is_regular")}
								className="checkbox checkbox-primary"
							/>
							<span className="label-text">Regular item (always stocked)</span>
						</label>
					</div>

					{/* Display upload error if any */}
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
							className="btn btn-primary min-w-[100px]"
							disabled={loading || !!uploadError}>
							{loading ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : editingItem ? (
								"Update Item"
							) : (
								"Add Item"
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
