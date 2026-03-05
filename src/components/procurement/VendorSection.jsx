// src/components/procurement/VendorSection.jsx
import React, { useState } from "react";
import { Plus, ShoppingCart, Image as ImageIcon } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";

const VendorSection = ({ vendor, items, onAddCustom, userId }) => {
	const [quantities, setQuantities] = useState({});
	const { addToCart } = useProcurementStore();

	const handleAddToCart = async (item) => {
		const quantity = quantities[item.id] || 1;

		await addToCart(
			{
				inventoryItemId: item.id,
				vendorId: vendor.id,
				quantity,
				unit: item.unit,
				notes: "",
			},
			userId
		);

		// Reset quantity after adding
		setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
	};

	const handleQuantityChange = (itemId, value) => {
		setQuantities((prev) => ({ ...prev, [itemId]: value }));
	};

	return (
		<div className="card bg-base-100 shadow-sm border border-base-200">
			<div className="card-body p-4">
				{/* Vendor Header */}
				<div className="flex items-center justify-between mb-4">
					<div>
						<h3 className="font-semibold text-lg">{vendor.name}</h3>
						{vendor.line_id && (
							<p className="text-xs text-gray-500 mt-0.5">
								LINE: {vendor.line_id}
							</p>
						)}
					</div>
					<button onClick={onAddCustom} className="btn btn-ghost btn-sm gap-1">
						<Plus className="w-4 h-4" />
						Add Custom
					</button>
				</div>

				{/* Items Grid */}
				<div className="space-y-2">
					{items.map((item) => (
						<div
							key={item.id}
							className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg transition-colors border border-transparent hover:border-base-300">
							{/* Item image */}
							<div className="w-12 h-12 rounded-lg bg-base-300 flex items-center justify-center overflow-hidden">
								{item.image_url ? (
									<img
										src={item.image_url}
										alt={item.name}
										className="w-full h-full object-cover"
									/>
								) : (
									<ImageIcon className="w-5 h-5 text-gray-500" />
								)}
							</div>

							{/* Item details */}
							<div className="flex-1">
								<p className="font-medium text-sm">{item.name}</p>
								<p className="text-xs text-gray-500">
									{item.category} • {item.unit}
								</p>
							</div>

							{/* Add to cart controls */}
							<div className="flex items-center gap-2">
								<input
									type="number"
									min="0.5"
									step="0.5"
									value={quantities[item.id] || 1}
									onChange={(e) =>
										handleQuantityChange(
											item.id,
											parseFloat(e.target.value) || 1
										)
									}
									className="input input-bordered input-sm w-20"
								/>
								<button
									onClick={() => handleAddToCart(item)}
									className="btn btn-primary btn-sm gap-1"
									title="Add to cart">
									<ShoppingCart className="w-4 h-4" />
									<span className="hidden sm:inline">Add</span>
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default VendorSection;
