// src/components/procurement/EditItemModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";

const EditItemModal = ({ isOpen, onClose, item }) => {
	const [formData, setFormData] = useState({
		quantity: item.quantity,
		unit: item.unit,
		notes: item.notes || "",
	});

	const { updateMarketListItem } = useProcurementStore();

	if (!isOpen) return null;

	const handleSubmit = async (e) => {
		e.preventDefault();
		await updateMarketListItem(item.id, formData);
		onClose();
	};

	return (
		<div className="modal modal-open">
			<div className="modal-box relative">
				<button
					onClick={onClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
					<X className="w-4 h-4" />
				</button>

				<h3 className="font-bold text-lg mb-6">
					Edit Item: {item.inventory_item?.name || item.custom_item_name}
				</h3>

				<form onSubmit={handleSubmit} className="space-y-4">
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
