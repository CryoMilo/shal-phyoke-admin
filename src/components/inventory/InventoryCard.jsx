import React from "react";
import { ShoppingCart, Package } from "lucide-react";
import { getSafeImageUrl } from "../../utils/imageUtils";

const InventoryCard = ({ item, onAddToMarketList, onClick }) => {
	const stockStatus = () => {
		if (item.quantity <= 0)
			return { color: "badge-error", text: "Out of Stock" };
		if (item.threshold > 0 && item.quantity <= item.threshold)
			return { color: "badge-warning", text: "Low Stock" };
		return { color: "badge-success", text: "In Stock" };
	};

	const status = stockStatus();

	return (
		<div
			id={`item-${item.id}`}
			className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-base-100 rounded-xl border border-base-200 hover:shadow-md transition-all shadow-sm">
			<div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
				{/* Image */}
				<div
					onClick={onClick}
					className="cursor-pointer w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center overflow-hidden flex-shrink-0 border border-base-300">
					{getSafeImageUrl(item.image_url) ? (
						<img
							src={getSafeImageUrl(item.image_url)}
							alt={item.name_english || item.name}
							className="w-full h-full object-cover"
						/>
					) : (
						<Package className="w-6 h-6 text-base-content/30" />
					)}
				</div>

				{/* Item Details */}
				<div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
					<div className="flex items-baseline gap-2 flex-wrap">
						<span className="text-base font-semibold text-base-content leading-relaxed">
							{item.name_english || item.name}
						</span>
						<span className={`badge ${status.color} badge-xs font-semibold`}>
							{status.text}
						</span>
					</div>
					{item.name_burmese && item.name_burmese !== item.name_english && (
						<p className="text-xs text-base-content/60 -mt-0.5 truncate font-normal">
							{item.name_burmese}
						</p>
					)}
					<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-base-content/60">
						{item.item_type === "packaging" ? (
							<span className="badge badge-sm bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-semibold">
								Packaging
							</span>
						) : item.item_type === "operational_supply" ? (
							<span className="badge badge-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold">
								Supply
							</span>
						) : (
							<span className="badge badge-ghost badge-sm">{item.category}</span>
						)}
						<span>
							Unit: <span className="font-medium text-base-content">{item.unit}</span>
							{item.base_unit && item.base_unit !== item.unit && (
								<span className="text-base-content/50 ml-1">
									({item.base_quantity_per_unit || 1} {item.base_unit})
								</span>
							)}
						</span>
						{item.cost_per_unit > 0 && (
							<span className="text-emerald-600 dark:text-emerald-400 font-medium">
								฿{Number(item.cost_per_unit).toFixed(2)}/{item.unit}
							</span>
						)}
						{!item.is_regular && (
							<span className="text-warning font-medium">Occasional</span>
						)}
					</div>
				</div>
			</div>

			{/* Stock Display & Actions Row */}
			<div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-base-200">
				{/* Current Stock Level */}
				<div className="flex flex-col items-start sm:items-end">
					<span className="text-[10px] uppercase tracking-wider text-base-content/50 font-bold">
						Current Stock
					</span>
					<div className="flex items-baseline gap-1">
						<span className="text-lg font-black text-base-content">
							{item.quantity ?? 0}
						</span>
						<span className="text-xs font-semibold text-base-content/70">
							{item.unit}
						</span>
					</div>
					{item.threshold > 0 && (
						<span className="text-[10px] text-base-content/50">
							Min: {item.threshold} {item.unit}
						</span>
					)}
				</div>

				{/* Add to Market Button */}
				<div
					className="flex items-center gap-2"
					onClick={(e) => e.stopPropagation()}>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onAddToMarketList(item);
						}}
						disabled={item.quantity >= item.threshold + 1}
						className="btn btn-primary btn-sm gap-1.5 shadow-sm"
						title="Add to Market List">
						<ShoppingCart className="w-4 h-4" />
						<span className="hidden sm:inline">Add to Market</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default InventoryCard;
