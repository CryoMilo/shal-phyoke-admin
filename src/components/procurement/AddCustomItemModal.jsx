// src/components/procurement/AddCustomItemModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";

const AddCustomItemModal = ({ isOpen, onClose, vendor, userId }) => {
	const [formData, setFormData] = useState({
		name: "",
		quantity: 1,
		unit: "piece",
		notes: "",
	});

	const { addToCart } = useProcurementStore();

	if (!isOpen) return null;

	const handleSubmit = async (e) => {
		e.preventDefault();

		await addToCart(
			{
				customItemName: formData.name,
				vendorId: vendor.id,
				quantity: formData.quantity,
				unit: formData.unit,
				notes: formData.notes,
				isMissed: false,
			},
			userId
		);

		onClose();
		setFormData({
			name: "",
			quantity: 1,
			unit: "piece",
			notes: "",
		});
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
					Add Custom Item for {vendor.name}
				</h3>

				<form onSubmit={handleSubmit} className="space-y-4">
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
							placeholder="e.g., Special Mushrooms, Rare Spice"
							className="input input-bordered w-full"
							autoFocus
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Quantity</span>
								<span className="label-text-alt text-error">*</span>
							</label>
							<input
								type="number"
								required
								min="0.5"
								step="0.5"
								value={formData.quantity}
								onChange={(e) =>
									setFormData({
										...formData,
										quantity: parseFloat(e.target.value) || 1,
									})
								}
								className="input input-bordered w-full"
							/>
						</div>

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
								placeholder="kg, bag, piece"
								className="input input-bordered w-full"
							/>
						</div>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Notes (optional)</span>
						</label>
						<textarea
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
							placeholder="Any special instructions..."
							className="textarea textarea-bordered"
							rows="2"
						/>
					</div>

					<div className="modal-action">
						<button type="button" onClick={onClose} className="btn btn-ghost">
							Cancel
						</button>
						<button type="submit" className="btn btn-primary">
							Add to List
						</button>
					</div>
				</form>
			</div>
			<div className="modal-backdrop" onClick={onClose} />
		</div>
	);
};

export default AddCustomItemModal;
