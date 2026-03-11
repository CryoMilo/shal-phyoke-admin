// src/components/menu/MenuItemExtrasManager.jsx
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown } from "lucide-react";
import useMenuStore from "../../stores/menuStore";

const MenuItemExtrasManager = ({ menuItemId }) => {
	const [showAddModal, setShowAddModal] = useState(false);
	const [editingExtra, setEditingExtra] = useState(null);
	const [availableExtras, setAvailableExtras] = useState([]);
	const [localExtras, setLocalExtras] = useState([]);

	const {
		menuItemExtras = [],
		loadingExtras = false,
		fetchMenuItemExtras,
		addMenuItemExtra,
		updateMenuItemExtra,
		removeMenuItemExtra,
		allMenuItems = [], // Changed from menuItems to allMenuItems
		fetchAllMenuItems, // Use this instead of fetchMenuItems
	} = useMenuStore();

	// Fetch all menu items if not loaded
	useEffect(() => {
		if (allMenuItems.length === 0 && fetchAllMenuItems) {
			fetchAllMenuItems();
		}
	}, [allMenuItems.length, fetchAllMenuItems]);

	useEffect(() => {
		if (menuItemId) {
			fetchMenuItemExtras(menuItemId);
		}
	}, [menuItemId, fetchMenuItemExtras]);

	// Filter available extras - only items with category "Extra"
	useEffect(() => {
		if (Array.isArray(allMenuItems) && allMenuItems.length > 0) {
			const extras = allMenuItems.filter(
				(item) => item && item.category === "Extra" && item.id !== menuItemId
			);
			setAvailableExtras(extras);
		} else {
			setAvailableExtras([]);
		}
	}, [allMenuItems, menuItemId]);

	useEffect(() => {
		setLocalExtras(Array.isArray(menuItemExtras) ? menuItemExtras : []);
	}, [menuItemExtras]);

	const moveExtra = (index, direction) => {
		if (!Array.isArray(localExtras) || localExtras.length === 0) return;

		if (
			(direction === "up" && index === 0) ||
			(direction === "down" && index === localExtras.length - 1)
		)
			return;

		const newExtras = [...localExtras];
		const swapIndex = direction === "up" ? index - 1 : index + 1;
		[newExtras[index], newExtras[swapIndex]] = [
			newExtras[swapIndex],
			newExtras[index],
		];

		// Update sort orders
		newExtras.forEach((extra, idx) => {
			if (extra?.id) {
				updateMenuItemExtra(extra.id, { sort_order: idx });
			}
		});

		setLocalExtras(newExtras);
	};

	const handleAddExtra = async (data) => {
		const newExtra = await addMenuItemExtra({
			menu_item_id: menuItemId,
			extra_item_id: data.extra_item_id,
			additional_price: data.additional_price,
			max_quantity: data.max_quantity,
			is_default: data.is_default,
			sort_order: localExtras.length,
		});

		if (newExtra) {
			setShowAddModal(false);
		}
	};

	const handleUpdateExtra = async (id, data) => {
		await updateMenuItemExtra(id, data);
		setEditingExtra(null);
	};

	const handleRemoveExtra = async (id) => {
		if (window.confirm("Remove this extra from the menu item?")) {
			await removeMenuItemExtra(id);
		}
	};

	if (!menuItemId) return null;

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<div>
					<h3 className="font-semibold text-lg">Available Extras / Toppings</h3>
					<p className="text-sm text-gray-500">
						Select which extras customers can add to this item
					</p>
				</div>
				<button
					onClick={() => setShowAddModal(true)}
					className="btn btn-primary btn-sm gap-2"
					disabled={loadingExtras}>
					<Plus className="w-4 h-4" />
					Add Extra
				</button>
			</div>

			{loadingExtras ? (
				<div className="text-center py-8">
					<span className="loading loading-spinner loading-md"></span>
				</div>
			) : !Array.isArray(localExtras) || localExtras.length === 0 ? (
				<div className="text-center py-8 bg-base-200 rounded-lg border border-dashed">
					<p className="text-gray-500">No extras added yet</p>
					<p className="text-xs text-gray-400 mt-1">
						First, create items with category "Extra" in All Menu
					</p>
					<button
						onClick={() => setShowAddModal(true)}
						className="btn btn-ghost btn-sm mt-2">
						<Plus className="w-4 h-4 mr-1" />
						Add your first extra
					</button>
				</div>
			) : (
				<div className="space-y-2">
					{localExtras.map((extra, index) => (
						<div
							key={extra?.id || index}
							className="flex items-center gap-3 p-4 bg-base-200/50 rounded-lg border border-base-300 hover:border-primary/30 transition-colors">
							{/* Move buttons */}
							<div className="flex flex-col gap-1">
								<button
									onClick={() => moveExtra(index, "up")}
									disabled={index === 0}
									className={`p-1 rounded hover:bg-base-300 transition-colors ${
										index === 0 ? "opacity-30 cursor-not-allowed" : ""
									}`}
									type="button">
									<ChevronUp className="w-4 h-4" />
								</button>
								<button
									onClick={() => moveExtra(index, "down")}
									disabled={index === localExtras.length - 1}
									className={`p-1 rounded hover:bg-base-300 transition-colors ${
										index === localExtras.length - 1
											? "opacity-30 cursor-not-allowed"
											: ""
									}`}
									type="button">
									<ChevronDown className="w-4 h-4" />
								</button>
							</div>

							{/* Extra info */}
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<span className="font-medium">
										{extra?.extra_item?.name_burmese || "Unknown"}
									</span>
									{extra?.is_default && (
										<span className="badge badge-primary badge-sm">
											Default
										</span>
									)}
								</div>
								<div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
									<span>+{extra?.additional_price || 0} THB</span>
									<span>Max: {extra?.max_quantity || 1}</span>
									{extra?.extra_item?.name_english && (
										<span className="text-xs">
											({extra.extra_item.name_english})
										</span>
									)}
								</div>
							</div>

							{/* Action buttons */}
							<div className="flex gap-2">
								<button
									onClick={() => setEditingExtra(extra)}
									className="btn btn-ghost btn-sm"
									type="button">
									<Edit2 className="w-4 h-4" />
								</button>
								<button
									onClick={() => handleRemoveExtra(extra.id)}
									className="btn btn-ghost btn-sm text-error"
									type="button">
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add/Edit Modal */}
			{(showAddModal || editingExtra) && (
				<ExtraFormModal
					isOpen={showAddModal || editingExtra}
					onClose={() => {
						setShowAddModal(false);
						setEditingExtra(null);
					}}
					onSave={editingExtra ? handleUpdateExtra : handleAddExtra}
					extra={editingExtra}
					availableExtras={availableExtras.filter(
						(extra) =>
							!localExtras.some((e) => e?.extra_item_id === extra?.id) ||
							editingExtra?.extra_item_id === extra?.id
					)}
				/>
			)}
		</div>
	);
};

// Extra Form Modal Component
const ExtraFormModal = ({
	isOpen,
	onClose,
	onSave,
	extra,
	availableExtras,
}) => {
	const [formData, setFormData] = useState({
		extra_item_id: extra?.extra_item_id || "",
		additional_price: extra?.additional_price || 0,
		max_quantity: extra?.max_quantity || 1,
		is_default: extra?.is_default || false,
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		if (extra) {
			onSave(extra.id, formData);
		} else {
			onSave(formData);
		}
	};

	if (!isOpen) return null;

	return (
		<>
			<div
				className="modal-backdrop fixed inset-0 bg-black/50 z-40"
				onClick={onClose}
			/>
			<div className="modal modal-open z-50">
				<div className="modal-box">
					<h3 className="font-bold text-lg mb-4">
						{extra ? "Edit Extra" : "Add Extra to Menu Item"}
					</h3>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Select Extra *</span>
							</label>
							<select
								value={formData.extra_item_id}
								onChange={(e) =>
									setFormData({ ...formData, extra_item_id: e.target.value })
								}
								className="select select-bordered w-full"
								required
								disabled={!!extra}>
								<option value="">Choose an extra item...</option>
								{Array.isArray(availableExtras) &&
									availableExtras.map((item) => (
										<option key={item.id} value={item.id}>
											{item.name_burmese}{" "}
											{item.name_english ? `(${item.name_english})` : ""} -{" "}
											{item.price} THB
										</option>
									))}
							</select>
							{availableExtras.length === 0 && !extra && (
								<label className="label">
									<span className="label-text-alt text-warning">
										No extra items found. Create items with category "Extra"
										first.
									</span>
								</label>
							)}
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">
									Additional Price (THB) *
								</span>
							</label>
							<input
								type="number"
								step="0.01"
								min="0"
								value={formData.additional_price}
								onChange={(e) =>
									setFormData({
										...formData,
										additional_price: parseFloat(e.target.value),
									})
								}
								className="input input-bordered"
								required
							/>
							<label className="label">
								<span className="label-text-alt text-gray-500">
									Extra cost for this topping (0 if included in base price)
								</span>
							</label>
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Max Quantity</span>
							</label>
							<input
								type="number"
								min="1"
								max="10"
								value={formData.max_quantity}
								onChange={(e) =>
									setFormData({
										...formData,
										max_quantity: parseInt(e.target.value),
									})
								}
								className="input input-bordered"
							/>
						</div>

						<div className="form-control">
							<label className="label cursor-pointer justify-start gap-3">
								<input
									type="checkbox"
									checked={formData.is_default}
									onChange={(e) =>
										setFormData({ ...formData, is_default: e.target.checked })
									}
									className="checkbox checkbox-primary"
								/>
								<span className="label-text font-medium">
									Include by default
								</span>
							</label>
							<label className="label">
								<span className="label-text-alt text-gray-500">
									If checked, this extra will be automatically included unless
									removed
								</span>
							</label>
						</div>

						<div className="modal-action">
							<button type="button" className="btn" onClick={onClose}>
								Cancel
							</button>
							<button
								type="submit"
								className="btn btn-primary"
								disabled={!extra && availableExtras.length === 0}>
								{extra ? "Update Extra" : "Add Extra"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	);
};

export default MenuItemExtrasManager;
