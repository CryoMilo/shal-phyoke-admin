// src/components/procurement/AddCustomItemModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import { showToast } from "../../utils/toastUtils";

const AddCustomItemModal = ({ isOpen, onClose }) => {
	const [formData, setFormData] = useState({
		name: "",
		vendor_id: "",
		quantity: 1,
		unit: "piece",
		notes: "",
	});

	const { vendors, addCustomItem } = useProcurementStore();

	if (!isOpen) return null;

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			showToast.error("Item name is required");
			return;
		}

		const result = await addCustomItem(formData);

		if (result?.success) {
			showToast.success(`Added "${formData.name}" to market list`);
			onClose();
			setFormData({
				name: "",
				vendor_id: "",
				quantity: 1,
				unit: "piece",
				notes: "",
			});
		} else {
			showToast.error(result?.error || "Failed to add custom item");
		}
	};

	return (
		<div className="modal modal-open">
			<div className="modal-box relative">
				<button
					onClick={onClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
					<X className="w-4 h-4" />
				</button>

				<h3 className="font-bold text-xl mb-6">Add Custom Item</h3>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Item Name */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">
								Item Name <span className="text-error">*</span>
							</span>
						</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="e.g., Special Mushrooms, Rare Spice"
							className="input input-bordered w-full"
							autoFocus
							required
						/>
					</div>

					{/* Vendor Selection */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Vendor</span>
						</label>
						<select
							value={formData.vendor_id}
							onChange={(e) =>
								setFormData({ ...formData, vendor_id: e.target.value })
							}
							className="select select-bordered w-full">
							<option value="">-- Select Vendor (Optional) --</option>
							{vendors.map((vendor) => (
								<option key={vendor.id} value={vendor.id}>
									{vendor.name}
								</option>
							))}
						</select>
						<label className="label">
							<span className="label-text-alt text-gray-400">
								If no vendor selected, item will appear in "TBD" section
							</span>
						</label>
					</div>

					{/* Quantity and Unit */}
					<div className="grid grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">
									Quantity <span className="text-error">*</span>
								</span>
							</label>
							<input
								type="number"
								step="0.5"
								min="0.5"
								value={formData.quantity}
								onChange={(e) =>
									setFormData({
										...formData,
										quantity: parseFloat(e.target.value) || 1,
									})
								}
								className="input input-bordered"
								required
							/>
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">
									Unit <span className="text-error">*</span>
								</span>
							</label>
							<input
								type="text"
								value={formData.unit}
								onChange={(e) =>
									setFormData({ ...formData, unit: e.target.value })
								}
								placeholder="kg, piece, box"
								className="input input-bordered"
								required
							/>
						</div>
					</div>

					{/* Notes */}
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Notes (Optional)</span>
						</label>
						<textarea
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
							placeholder="Any special instructions..."
							className="textarea textarea-bordered"
							rows="3"
						/>
					</div>

					{/* Form Actions */}
					<div className="modal-action">
						<button type="button" onClick={onClose} className="btn btn-ghost">
							Cancel
						</button>
						<button type="submit" className="btn btn-primary">
							Add to Market List
						</button>
					</div>
				</form>
			</div>
			<div className="modal-backdrop" onClick={onClose} />
		</div>
	);
};

export default AddCustomItemModal;
