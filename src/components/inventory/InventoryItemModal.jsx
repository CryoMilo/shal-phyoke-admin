// src/components/inventory/InventoryItemModal.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import ImageUpload from "../common/ImageUpload";

const InventoryItemModal = ({
	showModal,
	setShowModal,
	editingItem,
	handleSubmit,
	loading,
	vendors,
}) => {
	const [formData, setFormData] = useState({
		name: "",
		category: "Other",
		default_vendor_id: "",
		unit: "piece",
		image_url: "",
		is_regular: true,
	});
	const [customCategory, setCustomCategory] = useState("");
	const [showCustomCategory, setShowCustomCategory] = useState(false);
	const [uploadError, setUploadError] = useState("");

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

	useEffect(() => {
		if (editingItem) {
			setFormData({
				name: editingItem.name || "",
				category: editingItem.category || "Other",
				default_vendor_id: editingItem.default_vendor_id || "",
				unit: editingItem.unit || "piece",
				image_url: editingItem.image_url || "",
				is_regular: editingItem.is_regular ?? true,
			});
			setShowCustomCategory(
				!commonCategories.includes(editingItem.category || "")
			);
			setCustomCategory(editingItem.category || "");
		} else {
			resetForm();
		}
	}, [editingItem]);

	const resetForm = () => {
		setFormData({
			name: "",
			category: "Other",
			default_vendor_id: "",
			unit: "piece",
			image_url: "",
			is_regular: true,
		});
		setShowCustomCategory(false);
		setCustomCategory("");
		setUploadError("");
	};

	const handleClose = () => {
		resetForm();
		setShowModal(false);
	};

	const onSubmit = async (e) => {
		e.preventDefault();

		// Determine final category
		const finalCategory = showCustomCategory
			? customCategory
			: formData.category;

		const dataToSave = {
			...formData,
			category: finalCategory,
			default_vendor_id: formData.default_vendor_id || null,
			image_url: formData.image_url || null,
		};

		await handleSubmit(dataToSave);
	};

	if (!showModal) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-2xl relative">
				{/* Close button */}
				<button
					onClick={handleClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
					<X className="w-4 h-4" />
				</button>

				<h3 className="font-bold text-lg mb-6">
					{editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
				</h3>

				<form onSubmit={onSubmit} className="space-y-5">
					{/* Image Upload */}
					<ImageUpload
						bucket="inventory-images"
						folder="inventory-items"
						value={formData.image_url}
						onChange={(url) =>
							setFormData((prev) => ({ ...prev, image_url: url }))
						}
						label="Item Image"
						required={false}
						maxSizeMB={5}
						allowedTypes={["image/jpeg", "image/png", "image/webp"]}
						onError={setUploadError}
						placeholder="Upload an image of the item"
					/>

					{/* Name */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Item Name</span>
							<span className="label-text-alt text-error">*</span>
						</label>
						<input
							type="text"
							required
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="e.g., Chicken Breast, Cooking Oil"
							className="input input-bordered w-full"
						/>
					</div>

					{/* Category */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Category</span>
							<span className="label-text-alt text-error">*</span>
						</label>
						{!showCustomCategory ? (
							<div className="flex gap-2">
								<select
									value={formData.category}
									onChange={(e) =>
										setFormData({ ...formData, category: e.target.value })
									}
									className="select select-bordered flex-1"
									required>
									{commonCategories.map((cat) => (
										<option key={cat} value={cat}>
											{cat}
										</option>
									))}
								</select>
								<button
									type="button"
									onClick={() => setShowCustomCategory(true)}
									className="btn btn-outline">
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
									className="input input-bordered flex-1"
									required
								/>
								<button
									type="button"
									onClick={() => setShowCustomCategory(false)}
									className="btn btn-outline">
									Select
								</button>
							</div>
						)}
					</div>

					{/* Default Vendor */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Default Vendor</span>
						</label>
						<select
							value={formData.default_vendor_id}
							onChange={(e) =>
								setFormData({ ...formData, default_vendor_id: e.target.value })
							}
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
						<label className="label">
							<span className="label-text font-medium">Unit</span>
							<span className="label-text-alt text-error">*</span>
						</label>
						<input
							type="text"
							required
							value={formData.unit}
							onChange={(e) =>
								setFormData({ ...formData, unit: e.target.value })
							}
							placeholder="kg, g, liter, piece, box, etc."
							className="input input-bordered w-full"
						/>
					</div>

					{/* Item Type */}
					<div className="form-control">
						<label className="label cursor-pointer justify-start gap-4">
							<input
								type="checkbox"
								checked={formData.is_regular}
								onChange={(e) =>
									setFormData({ ...formData, is_regular: e.target.checked })
								}
								className="checkbox checkbox-primary"
							/>
							<span className="label-text">Regular item (always stocked)</span>
						</label>
					</div>

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
