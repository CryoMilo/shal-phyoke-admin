// src/components/inventory/InventoryCard.jsx
import React, { useState } from "react";
import { ShoppingCart, Minus, Plus, Package } from "lucide-react";

const InventoryCard = ({ item, onAddToCart, onUpdateStock, onClick }) => {
	const [isUpdating, setIsUpdating] = useState(false);
	// eslint-disable-next-line no-unused-vars
	const [localQuantity, setLocalQuantity] = useState(item.quantity || 0);

	const stockStatus = () => {
		if (item.quantity <= 0)
			return { color: "badge-error", text: "Out of Stock" };
		if (item.threshold > 0 && item.quantity <= item.threshold)
			return { color: "badge-warning", text: "Low Stock" };
		return { color: "badge-success", text: "In Stock" };
	};

	const status = stockStatus();

	const handleStockUpdate = async (newValue) => {
		const numValue = parseFloat(newValue);
		if (isNaN(numValue) || numValue < 0) return;

		setIsUpdating(true);
		setLocalQuantity(numValue);
		await onUpdateStock(item.id, numValue);
		setIsUpdating(false);
	};

	const handleIncrement = () => {
		const newValue = (item.quantity || 0) + 1;
		handleStockUpdate(newValue);
	};

	const handleDecrement = () => {
		const newValue = Math.max(0, (item.quantity || 0) - 1);
		handleStockUpdate(newValue);
	};

	return (
		<div
			id={`item-${item.id}`}
			className="group flex items-center gap-3 p-3 bg-base-100 rounded-lg border border-base-200 hover:shadow-md transition-shadow cursor-pointer"
			onClick={onClick}>
			{/* Image */}
			<div className="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center overflow-hidden flex-shrink-0">
				{item.image_url ? (
					<img
						src={item.image_url}
						alt={item.name}
						className="w-full h-full object-cover"
					/>
				) : (
					<Package className="w-5 h-5 text-gray-500" />
				)}
			</div>

			{/* Item Details */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="font-medium text-sm">{item.name}</span>
					<span className="text-xs text-gray-500">{item.category}</span>
					{!item.is_regular && (
						<span className="badge badge-ghost badge-xs">Occasional</span>
					)}
					<span className={`badge ${status.color} badge-xs`}>
						{status.text}
					</span>
				</div>
				<div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
					<span>Unit: {item.unit}</span>
					<span>Vendor: {item.default_vendor?.name || "—"}</span>
					{item.threshold > 0 && <span>Alert at: {item.threshold}</span>}
				</div>
			</div>

			{/* Stock Level Controls */}
			<div className="w-32 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
				<div className="flex items-center justify-between gap-1">
					<button
						onClick={(e) => {
							e.stopPropagation();
							handleDecrement();
						}}
						className="btn btn-sm btn-square bg-base-200 hover:bg-base-300 shadow-sm"
						disabled={isUpdating}
						title="Decrease stock">
						<Minus className="w-4 h-4" />
					</button>

					<div className="flex-1 text-center">
						<input
							type="number"
							value={item.quantity || 0}
							onChange={(e) => handleStockUpdate(e.target.value)}
							onClick={(e) => e.stopPropagation()}
							className={`w-full text-center input input-sm input-bordered bg-base-100 font-medium ${
								isUpdating ? "opacity-50" : ""
							}`}
							step="0.5"
							min="0"
							disabled={isUpdating}
						/>
					</div>

					<button
						onClick={(e) => {
							e.stopPropagation();
							handleIncrement();
						}}
						className="btn btn-sm btn-square bg-base-200 hover:bg-base-300 shadow-sm"
						disabled={isUpdating}
						title="Increase stock">
						<Plus className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Add to Cart Controls */}
			<div
				className="flex items-center gap-2"
				onClick={(e) => e.stopPropagation()}>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onAddToCart(item);
					}}
					className="btn btn-primary btn-sm gap-1">
					<ShoppingCart className="w-4 h-4" />
					Add
				</button>
			</div>
		</div>
	);
};

export default InventoryCard;
