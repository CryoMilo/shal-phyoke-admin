// src/components/procurement/MarketListItem.jsx
import React, { useState } from "react";
import { Edit2, Trash2, Image as ImageIcon, Package } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import EditItemModal from "./EditItemModal";

const MarketListItem = ({ item, userId }) => {
	const [showEditModal, setShowEditModal] = useState(false);
	const { removeFromMarketList } = useProcurementStore();

	const handleDelete = async () => {
		if (confirm("Remove this item from market list?")) {
			await removeFromMarketList(item.id);
		}
	};

	return (
		<>
			<div className="flex items-center gap-3 p-2 bg-base-100 rounded-lg border border-base-200 hover:shadow-sm transition-shadow">
				{/* Action Buttons */}
				<div className="flex gap-1">
					<button
						onClick={() => setShowEditModal(true)}
						className="btn btn-ghost btn-xs btn-square"
						title="Edit item">
						<Edit2 className="w-4 h-4" />
					</button>
					<button
						onClick={handleDelete}
						className="btn btn-ghost btn-xs btn-square text-error"
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

				{/* Quantity and Unit */}
				<div className="text-right">
					<span className="font-medium">
						{item.quantity} {item.unit}
					</span>
				</div>
			</div>

			{/* Edit Modal */}
			{showEditModal && (
				<EditItemModal
					isOpen={showEditModal}
					onClose={() => setShowEditModal(false)}
					item={item}
					userId={userId}
				/>
			)}
		</>
	);
};

export default MarketListItem;
