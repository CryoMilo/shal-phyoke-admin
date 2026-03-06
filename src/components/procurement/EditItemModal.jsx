// src/components/procurement/EditItemModal.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import { showToast } from "../../utils/toastUtils";

const EditItemModal = ({ isOpen, onClose, item }) => {
	const [formData, setFormData] = useState({
		quantity: item.quantity,
		unit: item.unit,
		notes: item.notes || "",
		vendor_id: item.vendor_id || "",
	});

	const { updateMarketListItem, vendors } = useProcurementStore();

	useEffect(() => {
		if (item) {
			setFormData({
				quantity: item.quantity,
				unit: item.unit,
				notes: item.notes || "",
				vendor_id: item.vendor_id || "",
			});
		}
	}, [item]);

	if (!isOpen) return null;

	const handleSubmit = async (e) => {
		e.preventDefault();
		const result = await updateMarketListItem(item.id, formData);

		if (result?.success) {
			showToast.success("Item updated");
			onClose();
		} else {
			showToast.error(result?.error || "Failed to update item");
		}
	};

	const itemName = item.inventory_item?.name || item.custom_item_name || "Item";

	return (
		<div className="modal modal-open">
			<div className="modal-box relative">
				<button
					onClick={onClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
					<X className="w-4 h-4" />
				</button>

				<h3 className="font-bold text-lg mb-6">Edit Item: {itemName}</h3>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Vendor Selection - NEW */}
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
							<option value="">-- TBD (No Vendor) --</option>
							{vendors.map((vendor) => (
								<option key={vendor.id} value={vendor.id}>
									{vendor.name}
								</option>
							))}
						</select>
						<label className="label">
							<span className="label-text-alt text-gray-400">
								Change vendor to move item to different accordion
							</span>
						</label>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Quantity</span>
							</label>
							<input
								type="number"
								step="0.5"
								min="0.5"
								required
								value={formData.quantity}
								onChange={(e) =>
									setFormData({
										...formData,
										quantity: parseFloat(e.target.value),
									})
								}
								className="input input-bordered"
							/>
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Unit</span>
							</label>
							<input
								type="text"
								required
								value={formData.unit}
								onChange={(e) =>
									setFormData({ ...formData, unit: e.target.value })
								}
								placeholder="kg, piece, box"
								className="input input-bordered"
							/>
						</div>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Notes</span>
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

					<div className="modal-action">
						<button type="button" onClick={onClose} className="btn btn-ghost">
							Cancel
						</button>
						<button type="submit" className="btn btn-primary">
							Save Changes
						</button>
					</div>
				</form>
			</div>
			<div className="modal-backdrop" onClick={onClose} />
		</div>
	);
};

export default EditItemModal;
