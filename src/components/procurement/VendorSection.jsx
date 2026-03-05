// src/components/procurement/VendorSection.jsx
import { useState } from "react";
import { Plus, ShoppingCart, Image as ImageIcon } from "lucide-react";
import useProcurementStore from "../../stores/useProcurementStore";

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

	if (items.length === 0) return null;

	return (
		<div className="card bg-base-100 shadow-sm">
			<div className="card-body p-4">
				<div className="flex items-center justify-between mb-3">
					<h3 className="font-semibold text-lg">{vendor.name}</h3>
					{vendor.line_id && (
						<span className="text-xs text-gray-500">
							LINE: {vendor.line_id}
						</span>
					)}
				</div>

				<div className="space-y-2">
					{items.map((item) => (
						<div
							key={item.id}
							className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg transition-colors">
							{/* Item image or placeholder */}
							<div className="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center">
								{item.image_url ? (
									<img
										src={item.image_url}
										alt={item.name}
										className="w-full h-full object-cover rounded-lg"
									/>
								) : (
									<ImageIcon className="w-5 h-5 text-gray-500" />
								)}
							</div>

							{/* Item details */}
							<div className="flex-1">
								<p className="font-medium">{item.name}</p>
								<p className="text-xs text-gray-500">
									{item.category} • {item.unit}
								</p>
							</div>

							{/* Quantity input and add button */}
							<div className="flex items-center gap-2">
								<input
									type="number"
									min="1"
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
									className="btn btn-primary btn-sm gap-1">
									<ShoppingCart className="w-4 h-4" />
									Add
								</button>
							</div>
						</div>
					))}
				</div>

				{/* Add custom item button */}
				<button
					onClick={onAddCustom}
					className="btn btn-ghost btn-sm gap-2 mt-3 w-full">
					<Plus className="w-4 h-4" />
					Add Custom Item
				</button>
			</div>
		</div>
	);
};

export default VendorSection;
