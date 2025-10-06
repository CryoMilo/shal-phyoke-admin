// components/SubscriberOrders/CreateOrderModal/AddOnsStep.jsx
import React from "react";

export const AddOnsStep = ({
	availableAddOnItems,
	selectedAddOns,
	onAddOnQuantityChange,
	onBack,
	onSubmit,
}) => {
	const getAddOnQuantity = (menuItemId) => {
		const addOn = selectedAddOns.find((item) => item.id === menuItemId);
		return addOn ? addOn.quantity : 0;
	};

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h3 className="text-lg font-semibold">Add Extra Items</h3>
				<p className="text-gray-600">Select additional items for this order</p>
			</div>

			{/* Selected Add-Ons Summary */}
			{selectedAddOns.length > 0 && (
				<div className="bg-base-200 p-4 rounded-lg">
					<h4 className="font-semibold mb-2">Selected Add-Ons</h4>
					<div className="space-y-2">
						{selectedAddOns.map((addOn) => (
							<div key={addOn.id} className="flex justify-between items-center">
								<div>
									<span className="font-medium">
										{addOn.menu_item.name_burmese}
									</span>
									{addOn.menu_item.name_english && (
										<span className="text-sm text-gray-600 ml-2">
											({addOn.menu_item.name_english})
										</span>
									)}
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm">฿{addOn.menu_item.price}</span>
									<div className="flex items-center gap-1">
										<button
											type="button"
											onClick={() => onAddOnQuantityChange(addOn.id, -1)}
											className="btn btn-xs btn-circle btn-ghost">
											-
										</button>
										<span className="min-w-6 text-center font-medium">
											{addOn.quantity}
										</span>
										<button
											type="button"
											onClick={() => onAddOnQuantityChange(addOn.id, 1)}
											className="btn btn-xs btn-circle btn-ghost">
											+
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Available Add-Ons */}
			<div className="max-h-96 overflow-y-auto space-y-2">
				{availableAddOnItems.map((item) => (
					<AddOnItem
						key={item.id}
						item={item}
						quantity={getAddOnQuantity(item.id)}
						onQuantityChange={onAddOnQuantityChange}
					/>
				))}
			</div>

			{/* Navigation */}
			<div className="modal-action">
				<button type="button" onClick={onBack} className="btn btn-ghost">
					Back to Menu Selection
				</button>
				<button type="button" onClick={onSubmit} className="btn btn-primary">
					Create Order
				</button>
			</div>
		</div>
	);
};

const AddOnItem = ({ item, quantity, onQuantityChange }) => {
	return (
		<div className="flex justify-between items-center p-3 border rounded-lg">
			<div className="flex-1">
				<div className="font-medium">{item.name_burmese}</div>
				{item.name_english && (
					<div className="text-sm text-gray-600">{item.name_english}</div>
				)}
				<div className="text-xs text-gray-500 flex gap-2">
					<span className="badge badge-outline badge-sm">{item.category}</span>
					<span>฿{item.price}</span>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => onQuantityChange(item.id, -1)}
					disabled={quantity === 0}
					className="btn btn-sm btn-circle btn-ghost disabled:opacity-30">
					-
				</button>
				<span className="min-w-6 text-center font-medium">{quantity}</span>
				<button
					type="button"
					onClick={() => onQuantityChange(item.id, 1)}
					className="btn btn-sm btn-circle btn-ghost">
					+
				</button>
			</div>
		</div>
	);
};
