// components/SubscriberOrders/CreateOrderModal/SelectedItemQuantity.js
export const SelectedItemQuantity = ({
	item,
	mainDishCount,
	sideDishCount,
	usedSelections,
	availableSelections,
	onQuantityChange,
}) => {
	const handleMainQuantityChange = (change) => {
		onQuantityChange(item, "main_dish", change);
	};

	const handleSideQuantityChange = (change) => {
		onQuantityChange(item, "side_dish", change);
	};

	return (
		<div className="flex items-center justify-between p-3 rounded-lg border border-primary/20">
			{/* Item Info */}
			<div className="flex-1">
				<div className="flex items-center gap-2 mb-1">
					<p className="font-semibold">{item.name_burmese}</p>
				</div>
				<p className="text-sm text-base-content/70">{item.name_english}</p>
			</div>

			{/* Quantity Controls */}
			<div className="flex items-center gap-4">
				{/* Main Dish Quantity */}
				{mainDishCount > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-xs font-medium text-primary">Main:</span>
						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={() => handleMainQuantityChange(-1)}
								className="btn btn-xs btn-circle btn-ghost text-primary hover:bg-primary/10">
								-
							</button>
							<span className="min-w-6 text-center font-medium bg-primary/10 px-2 py-1 rounded">
								{mainDishCount}
							</span>
							<button
								type="button"
								onClick={() => handleMainQuantityChange(1)}
								disabled={
									usedSelections.main_dish >= availableSelections.main_dish
								}
								className="btn btn-xs btn-circle btn-ghost text-primary hover:bg-primary/10 disabled:opacity-30">
								+
							</button>
						</div>
					</div>
				)}

				{/* Side Dish Quantity */}
				{sideDishCount > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-xs font-medium text-secondary">Side:</span>
						<div className="flex items-center gap-1">
							<button
								type="button"
								onClick={() => handleSideQuantityChange(-1)}
								className="btn btn-xs btn-circle btn-ghost text-secondary hover:bg-secondary/10">
								-
							</button>
							<span className="min-w-6 text-center font-medium bg-secondary/10 px-2 py-1 rounded">
								{sideDishCount}
							</span>
							<button
								type="button"
								onClick={() => handleSideQuantityChange(1)}
								disabled={
									usedSelections.side_dish >= availableSelections.side_dish
								}
								className="btn btn-xs btn-circle btn-ghost text-secondary hover:bg-secondary/10 disabled:opacity-30">
								+
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
