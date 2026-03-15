// src/components/procurement/MarketListItem.jsx
import React, { useState } from "react";
import { Edit2, Trash2, Package, Minus, Plus } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import EditItemModal from "./EditItemModal";
import { showToast } from "../../utils/toastUtils";

const MarketListItem = ({ item }) => {
	const [showEditModal, setShowEditModal] = useState(false);
	const { updateMarketListQuantity, removeFromMarketList } =
		useProcurementStore();

	const handleDelete = async () => {
		const itemName =
			item.inventory_item?.name || item.custom_item_name || "Item";
		const confirmDelete = window.confirm(
			`Remove ${itemName} from market list?`
		);

		if (confirmDelete) {
			const result = await removeFromMarketList(item.id);
			if (result?.success) {
				showToast.itemRemoved(itemName);
			} else {
				showToast.error(`Failed to remove ${itemName}`);
			}
		}
	};

	const handleQuantityChange = (delta) => {
		const newQuantity = Math.max(0.5, item.quantity + delta);
		updateMarketListQuantity(item.id, newQuantity);
	};

	const handleDirectQuantityChange = (newValue) => {
		// Allow empty string to let user clear the input
		if (newValue === "") {
			updateMarketListQuantity(item.id, "");
			return;
		}

		const numValue = parseFloat(newValue);
		if (isNaN(numValue)) {
			return;
		}

		if (numValue >= 0.1) {
			updateMarketListQuantity(item.id, numValue);
		}
	};

	return (
		<>
			<div className="flex items-center gap-3 p-2 bg-base-100 rounded-lg border border-base-200 hover:shadow-sm transition-shadow">
				{/* Action Buttons */}
				<div className="flex gap-1">
					<button
						onClick={() => setShowEditModal(true)}
						className="btn btn-ghost btn-sm btn-square"
						title="Edit item">
						<Edit2 className="w-4 h-4" />
					</button>
					<button
						onClick={handleDelete}
						className="btn btn-ghost btn-sm btn-square text-error"
						title="Remove item">
						<Trash2 className="w-4 h-4" />
					</button>
				</div>

				{/* Image */}
				<div className="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center overflow-hidden flex-shrink-0">
					{item.inventory_item?.image_url ? (
						<img
							src={item.inventory_item.image_url}
							alt={item.inventory_item.name}
							className="w-full h-full object-cover"
						/>
					) : (
						<Package className="w-5 h-5 text-gray-500" />
					)}
				</div>

				{/* Item Details */}
				<div className="flex-1 min-w-0">
					<p className="font-medium text-sm">
						{item.inventory_item?.name || item.custom_item_name}
					</p>
					{item.notes && (
						<p className="text-xs text-gray-500 truncate">Note: {item.notes}</p>
					)}
				</div>

				{/* Quantity Controls */}
				<div className="w-36 bg-base-200 rounded-lg p-1.5">
					<div className="flex items-center justify-between gap-2">
						<button
							onClick={() => handleQuantityChange(-0.5)}
							className="btn btn-sm btn-square btn-ghost bg-base-100 hover:bg-base-300 shadow-sm"
							disabled={item.quantity <= 0.5}>
							<Minus className="w-4 h-4" />
						</button>

						<div className="flex-1 text-center">
							<input
								type="number"
								value={item.quantity}
								onChange={(e) => handleDirectQuantityChange(e.target.value)}
								className="w-full text-center input input-sm input-bordered bg-base-100 font-medium px-1"
								step="0.5"
								min="0.1"
							/>
						</div>

						<button
							onClick={() => handleQuantityChange(0.5)}
							className="btn btn-sm btn-square btn-ghost bg-base-100 hover:bg-base-300 shadow-sm">
							<Plus className="w-4 h-4" />
						</button>
					</div>
					<div className="text-[10px] text-gray-400 text-center mt-1">
						{item.unit}
					</div>
				</div>
			</div>

			{/* Edit Modal */}
			{showEditModal && (
				<EditItemModal
					isOpen={showEditModal}
					onClose={() => setShowEditModal(false)}
					item={item}
				/>
			)}
		</>
	);
};

export default MarketListItem;
