// src/components/inventory/InventoryCard.jsx
import React from "react";
import { ShoppingCart, Minus, Plus, Package, Edit2 } from "lucide-react";

const InventoryCard = ({ item, onAddToMarketList, onUpdateStock, onClick }) => {
	const stockStatus = () => {
		if (item.quantity <= 0)
			return { color: "badge-error", text: "Out of Stock" };
		if (item.threshold > 0 && item.quantity <= item.threshold)
			return { color: "badge-warning", text: "Low Stock" };
		return { color: "badge-success", text: "In Stock" };
	};

	const status = stockStatus();

	const handleStockUpdate = (newValue) => {
		const numValue = parseFloat(newValue);
		if (isNaN(numValue) || numValue < 0) return;

		onUpdateStock(item.id, numValue);
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
			className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-base-100 rounded-xl border border-base-200 hover:shadow-lg transition-all shadow-sm">
			<div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
				{/* Image */}
				<div
					onClick={onClick}
					className="cursor-pointer w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center overflow-hidden flex-shrink-0 border border-base-300">
					{item.image_url ? (
						<img
							src={item.image_url}
							alt={item.name}
							className="w-full h-full object-cover"
						/>
					) : (
						<Package className="w-6 h-6 text-base-content/30" />
					)}
				</div>

				{/* Item Details */}
				<div className="flex-1 min-w-0" onClick={onClick}>
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<span className="font-bold text-base truncate">{item.name}</span>
						<span
							className={`badge ${status.color} badge-xs font-bold uppercase`}>
							{status.text}
						</span>
					</div>
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-base-content/60">
						<span className="badge badge-ghost badge-sm">{item.category}</span>
						<span>
							Unit:{" "}
							<span className="font-medium text-base-content">{item.unit}</span>
						</span>
						{!item.is_regular && (
							<span className="text-warning font-medium">Occasional</span>
						)}
					</div>
				</div>
			</div>

			{/* Controls Row (Mobile friendly stack) */}
			<div className="flex items-center justify-between gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-base-200">
				{/* Stock Level Controls */}
				<div
					className="w-full sm:w-36 bg-base-200 rounded-xl p-1 shadow-inner"
					onClick={(e) => e.stopPropagation()}>
					<div className="flex items-center justify-between gap-1">
						<button
							onClick={(e) => {
								e.stopPropagation();
								handleDecrement();
							}}
							className="btn btn-sm btn-square btn-ghost bg-base-100 hover:bg-base-300 shadow-sm">
							<Minus className="w-4 h-4" />
						</button>

						<div className="flex-1 text-center min-w-[3rem]">
							<input
								type="number"
								value={item.quantity || 0}
								onChange={(e) => handleStockUpdate(e.target.value)}
								onClick={(e) => e.stopPropagation()}
								className="w-full text-center bg-transparent border-none font-black text-sm p-0 focus:outline-none"
								step="0.5"
								min="0"
							/>
						</div>

						<button
							onClick={(e) => {
								e.stopPropagation();
								handleIncrement();
							}}
							className="btn btn-sm btn-square btn-ghost bg-base-100 hover:bg-base-300 shadow-sm">
							<Plus className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Action Buttons */}
				<div
					className="flex items-center gap-2"
					onClick={(e) => e.stopPropagation()}>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onAddToMarketList(item);
						}}
						disabled={item.quantity >= item.threshold + 1}
						className="btn btn-primary btn-sm md:btn-md gap-2 shadow-md">
						<ShoppingCart className="w-4 h-4" />
						<span className="hidden lg:inline">Add to Market</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default InventoryCard;
