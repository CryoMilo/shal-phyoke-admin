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

	// Group items by category
	const groupedItems = availableAddOnItems.reduce((acc, item) => {
		const category = item.category || "Other";
		if (!acc[category]) {
			acc[category] = [];
		}
		acc[category].push(item);
		return acc;
	}, {});

	// Define category order and display names
	const categoryOrder = {
		Regular_Extra: "Extras & Sides",
		Regular_Drink: "Drinks & Beverages",
		Regular: "Regular Menu Items",
	};

	// Get remaining categories (rotating menu items)
	const otherCategories = Object.keys(groupedItems).filter(
		(category) => !categoryOrder[category]
	);

	// Calculate total add-ons price
	const totalAddOnsPrice = selectedAddOns.reduce((total, addOn) => {
		return total + addOn.menu_item.price * addOn.quantity;
	}, 0);

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h3 className="text-2xl font-bold">Add Extra Items</h3>
				<p className="text-base-content/70 mt-2">
					Select additional items for this order
				</p>
			</div>

			{/* Available Add-Ons by Category */}
			<div className="space-y-8">
				{/* Display categories in specified order */}
				{Object.entries(categoryOrder).map(
					([categoryKey, displayName]) =>
						groupedItems[categoryKey]?.length > 0 && (
							<CategorySection
								key={categoryKey}
								categoryName={displayName}
								items={groupedItems[categoryKey]}
								getQuantity={getAddOnQuantity}
								onQuantityChange={onAddOnQuantityChange}
							/>
						)
				)}

				{/* Display rotating menu items */}
				{otherCategories.map(
					(category) =>
						groupedItems[category]?.length > 0 && (
							<CategorySection
								key={category}
								categoryName={category}
								items={groupedItems[category]}
								getQuantity={getAddOnQuantity}
								onQuantityChange={onAddOnQuantityChange}
							/>
						)
				)}
			</div>

			{/* Selected Add-Ons Summary - Moved above submission button */}
			{selectedAddOns.length > 0 && (
				<div className="bg-base-200 p-6 rounded-xl border border-base-300">
					<div className="flex items-center justify-between mb-4">
						<h4 className="font-bold text-lg">Selected Extra Items</h4>
						<div className="flex items-center space-x-4">
							<span className="badge badge-primary badge-lg">
								{selectedAddOns.length} item
								{selectedAddOns.length !== 1 ? "s" : ""}
							</span>
							{totalAddOnsPrice > 0 && (
								<span className="text-lg font-bold text-primary">
									Total: ฿{totalAddOnsPrice}
								</span>
							)}
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{selectedAddOns.map((addOn) => (
							<div
								key={addOn.id}
								className="bg-base-100 p-4 rounded-lg border border-base-300">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-3">
										{addOn.menu_item.image_url ? (
											<img
												src={addOn.menu_item.image_url}
												alt={addOn.menu_item.name_burmese}
												className="w-12 h-12 rounded-lg object-cover"
											/>
										) : (
											<div className="w-12 h-12 bg-base-300 rounded-lg flex items-center justify-center text-base-content/50">
												<span className="text-2xl">🍽️</span>
											</div>
										)}
										<div>
											<p className="font-semibold">
												{addOn.menu_item.name_burmese}
											</p>
											{addOn.menu_item.name_english && (
												<p className="text-sm text-base-content/70">
													{addOn.menu_item.name_english}
												</p>
											)}
											<p className="text-sm font-medium text-primary">
												฿{addOn.menu_item.price}
											</p>
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<div className="flex items-center space-x-1 bg-base-300 rounded-full px-2 py-1">
											<button
												type="button"
												onClick={() => onAddOnQuantityChange(addOn.id, -1)}
												className="w-6 h-6 rounded-full bg-base-100 border border-base-300 flex items-center justify-center hover:bg-base-200 transition-colors">
												-
											</button>
											<span className="min-w-6 text-center font-semibold">
												{addOn.quantity}
											</span>
											<button
												type="button"
												onClick={() => onAddOnQuantityChange(addOn.id, 1)}
												className="w-6 h-6 rounded-full bg-base-100 border border-base-300 flex items-center justify-center hover:bg-base-200 transition-colors">
												+
											</button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Navigation */}
			<div className="flex justify-between items-center pt-6 border-t border-base-300">
				<button
					type="button"
					onClick={onBack}
					className="btn btn-outline btn-lg px-8">
					← Back to Menu
				</button>
				<button
					type="button"
					onClick={onSubmit}
					className="btn btn-primary btn-lg px-8">
					Create Order
				</button>
			</div>
		</div>
	);
};

const CategorySection = ({
	categoryName,
	items,
	getQuantity,
	onQuantityChange,
}) => {
	return (
		<div className="space-y-4">
			<div className="flex items-center space-x-3">
				<div className="w-1 h-6 bg-primary rounded-full"></div>
				<h4 className="text-xl font-bold">{categoryName}</h4>
				<span className="badge badge-outline badge-lg">
					{items.length} items
				</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{items.map((item) => (
					<AddOnCard
						key={item.id}
						item={item}
						quantity={getQuantity(item.id)}
						onQuantityChange={onQuantityChange}
					/>
				))}
			</div>
		</div>
	);
};

const AddOnCard = ({ item, quantity, onQuantityChange }) => {
	return (
		<div className="bg-base-100 rounded-xl border border-base-300 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
			{/* Image Section */}
			<div className="relative h-32 bg-base-300 overflow-hidden">
				{item.image_url ? (
					<img
						src={item.image_url}
						alt={item.name_burmese}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-base-content/50">
						<div className="text-center">
							<div className="text-2xl mb-1">🍽️</div>
							<p className="text-xs">No Image</p>
						</div>
					</div>
				)}

				{/* Category Badge */}
				<div className="absolute top-3 left-3">
					<span className="badge badge-neutral badge-sm">{item.category}</span>
				</div>
			</div>

			{/* Content Section */}
			<div className="p-4">
				{/* Name and Price */}
				<div className="mb-3">
					<h5 className="font-bold text-sm leading-tight mb-1">
						{item.name_burmese}
					</h5>
					{item.name_english && (
						<p className="text-xs text-base-content/70 mb-2 leading-tight">
							{item.name_english}
						</p>
					)}
					<div className="flex items-center justify-between">
						<span className="text-lg font-bold text-primary">
							฿{item.price}
						</span>
						{item.taste_profile && (
							<span className="badge badge-ghost badge-sm">
								{item.taste_profile}
							</span>
						)}
					</div>
				</div>

				{/* Quantity Controls */}
				<div className="flex items-center justify-between">
					{quantity > 0 ? (
						<>
							<span className="text-sm font-medium">Added: {quantity}</span>
							<div className="flex items-center space-x-2">
								<button
									type="button"
									onClick={() => onQuantityChange(item.id, -1)}
									className="btn btn-sm btn-circle btn-error btn-outline">
									-
								</button>
								<button
									type="button"
									onClick={() => onQuantityChange(item.id, 1)}
									className="btn btn-sm btn-circle btn-success btn-outline">
									+
								</button>
							</div>
						</>
					) : (
						<button
							type="button"
							onClick={() => onQuantityChange(item.id, 1)}
							className="btn btn-primary btn-sm w-full">
							Add to Order
						</button>
					)}
				</div>
			</div>
		</div>
	);
};
