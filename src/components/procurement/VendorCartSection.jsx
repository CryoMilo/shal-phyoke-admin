// src/components/procurement/VendorCartSection.jsx
import { useState } from "react";
import { Edit2, Trash2, Check, X, AlertCircle } from "lucide-react";

const VendorCartSection = ({ vendor, items, onEdit, onRemove, onConfirm }) => {
	const [editingItem, setEditingItem] = useState(null);
	const [editQuantity, setEditQuantity] = useState(1);
	const [editUnit, setEditUnit] = useState("");

	const startEdit = (item) => {
		setEditingItem(item.id);
		setEditQuantity(item.quantity);
		setEditUnit(item.unit || item.inventory_item?.unit || "piece");
	};

	const saveEdit = (itemId) => {
		onEdit(itemId, { quantity: editQuantity, unit: editUnit });
		setEditingItem(null);
	};

	const cancelEdit = () => {
		setEditingItem(null);
	};

	const totalItems = items.length;
	const missedItems = items.filter((item) => item.is_missed).length;

	return (
		<div className="border border-base-300 rounded-lg p-3">
			<div className="flex items-center justify-between mb-2">
				<div>
					<h3 className="font-medium">{vendor.name}</h3>
					<p className="text-xs text-gray-500">
						{totalItems} items {missedItems > 0 && `(${missedItems} missed)`}
					</p>
				</div>
				<button onClick={onConfirm} className="btn btn-primary btn-sm">
					Confirm
				</button>
			</div>

			<div className="space-y-2 mt-3">
				{items.map((item) => (
					<div
						key={item.id}
						className={`flex items-center gap-2 p-2 rounded-lg ${
							item.is_missed
								? "bg-orange-50 border border-orange-200"
								: "bg-base-200"
						}`}>
						{item.is_missed && (
							<AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
						)}

						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium truncate">
								{item.inventory_item?.name || item.custom_item_name}
							</p>

							{editingItem === item.id ? (
								<div className="flex items-center gap-1 mt-1">
									<input
										type="number"
										min="0.5"
										step="0.5"
										value={editQuantity}
										onChange={(e) =>
											setEditQuantity(parseFloat(e.target.value) || 1)
										}
										className="input input-bordered input-xs w-16"
									/>
									<input
										type="text"
										value={editUnit}
										onChange={(e) => setEditUnit(e.target.value)}
										className="input input-bordered input-xs w-20"
									/>
									<button
										onClick={() => saveEdit(item.id)}
										className="btn btn-ghost btn-xs text-success">
										<Check className="w-3 h-3" />
									</button>
									<button
										onClick={cancelEdit}
										className="btn btn-ghost btn-xs text-error">
										<X className="w-3 h-3" />
									</button>
								</div>
							) : (
								<p className="text-xs text-gray-600">
									{item.quantity} {item.unit || item.inventory_item?.unit}
									{item.notes && ` • ${item.notes}`}
								</p>
							)}
						</div>

						{editingItem !== item.id && (
							<div className="flex items-center gap-1">
								<button
									onClick={() => startEdit(item)}
									className="btn btn-ghost btn-xs">
									<Edit2 className="w-3 h-3" />
								</button>
								<button
									onClick={() => onRemove(item.id)}
									className="btn btn-ghost btn-xs text-error">
									<Trash2 className="w-3 h-3" />
								</button>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

export default VendorCartSection;
