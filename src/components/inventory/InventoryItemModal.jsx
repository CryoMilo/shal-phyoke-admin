// src/components/inventory/InventoryItemModal.jsx
import { useState, useEffect } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "../../services/supabase";

const InventoryItemModal = ({ isOpen, onClose, item, vendors, onSuccess }) => {
	const [formData, setFormData] = useState({
		name: "",
		category: "Other",
		default_vendor_id: "",
		unit: "piece",
		image_url: "",
		is_regular: true,
	});
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [customCategory, setCustomCategory] = useState("");
	const [showCustomCategory, setShowCustomCategory] = useState(false);

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
		if (item) {
			setFormData({
				name: item.name || "",
				category: item.category || "Other",
				default_vendor_id: item.default_vendor_id || "",
				unit: item.unit || "piece",
				image_url: item.image_url || "",
				is_regular: item.is_regular ?? true,
			});
			setShowCustomCategory(!commonCategories.includes(item.category || ""));
			setCustomCategory(item.category || "");
		} else {
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
		}
	}, [item]);

	const handleImageUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);
		try {
			const fileExt = file.name.split(".").pop();
			const fileName = `${Math.random()}.${fileExt}`;
			const filePath = `inventory-items/${fileName}`;

			const { error: uploadError } = await supabase.storage
				.from("inventory-images")
				.upload(filePath, file);

			if (uploadError) throw uploadError;

			const {
				data: { publicUrl },
			} = supabase.storage.from("inventory-images").getPublicUrl(filePath);

			setFormData((prev) => ({ ...prev, image_url: publicUrl }));
		} catch (error) {
			console.error("Error uploading image:", error);
		} finally {
			setUploading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setSaving(true);

		try {
			// Determine final category
			const finalCategory = showCustomCategory
				? customCategory
				: formData.category;

			const dataToSave = {
				...formData,
				category: finalCategory,
			};

			if (item) {
				// Update
				const { error } = await supabase
					.from("inventory_items")
					.update(dataToSave)
					.eq("id", item.id);

				if (error) throw error;
			} else {
				// Create
				const { error } = await supabase
					.from("inventory_items")
					.insert([dataToSave]);

				if (error) throw error;
			}

			onSuccess();
			onClose();
		} catch (error) {
			console.error("Error saving item:", error);
		} finally {
			setSaving(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-2xl">
				<h3 className="font-bold text-lg mb-4">
					{item ? "Edit Inventory Item" : "Add Inventory Item"}
				</h3>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Image Upload */}
					<div className="form-control">
						<label className="label">
							<span className="label-text">Item Image</span>
						</label>
						<div className="flex items-center gap-4">
							<div className="w-20 h-20 rounded-lg bg-base-300 flex items-center justify-center overflow-hidden">
								{formData.image_url ? (
									<img
										src={formData.image_url}
										alt="Preview"
										className="w-full h-full object-cover"
									/>
								) : (
									<ImageIcon className="w-8 h-8 text-gray-500" />
								)}
							</div>
							<div className="flex-1">
								<input
									type="file"
									accept="image/*"
									onChange={handleImageUpload}
									className="hidden"
									id="image-upload"
								/>
								<label
									htmlFor="image-upload"
									className="btn btn-outline btn-sm gap-2">
									<Upload className="w-4 h-4" />
									{uploading ? "Uploading..." : "Upload Image"}
								</label>
								{formData.image_url && (
									<button
										type="button"
										onClick={() =>
											setFormData((prev) => ({ ...prev, image_url: "" }))
										}
										className="btn btn-ghost btn-sm ml-2">
										<X className="w-4 h-4" />
									</button>
								)}
							</div>
						</div>
					</div>

					{/* Name */}
					<div className="form-control">
						<label className="label">
							<span className="label-text">Item Name *</span>
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
							<span className="label-text">Category *</span>
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
							<span className="label-text">Default Vendor</span>
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
							<span className="label-text">Unit *</span>
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
							onClick={onClose}
							className="btn btn-ghost"
							disabled={saving}>
							Cancel
						</button>
						<button
							type="submit"
							className="btn btn-primary"
							disabled={saving || uploading}>
							{saving ? "Saving..." : item ? "Update Item" : "Add Item"}
						</button>
					</div>
				</form>
			</div>
			<div className="modal-backdrop" onClick={onClose} />
		</div>
	);
};

export default InventoryItemModal;
