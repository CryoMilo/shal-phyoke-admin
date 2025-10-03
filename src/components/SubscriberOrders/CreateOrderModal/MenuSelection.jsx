import { ShoppingCart } from "lucide-react";
import { SelectedItemQuantity } from "./SelectedItemQuantity";

export const MenuSelection = ({
	selectedDay,
	todayMenuItems,
	tomorrowMenuItems,
	selectedMenuItems,
	usedSelections,
	availableSelections,
	onMenuItemToggle,
	onQuantityChange, // New prop for quantity changes
	errors,
}) => {
	if (!selectedDay) return null;

	const menuItems =
		selectedDay === "today" ? todayMenuItems : tomorrowMenuItems;

	// Separate available and unavailable items
	const availableItems = menuItems.filter(
		(item) =>
			item.status === "Available" ||
			item.status === "Confirmed" ||
			item.status === "Cooking"
	);

	const unavailableItems = menuItems.filter(
		(item) => item.status === "Out of Order" || item.status === "Cancelled"
	);

	const getStatusBadge = (status) => {
		const statusConfig = {
			Available: "badge-success",
			Confirmed: "badge-info",
			Cooking: "badge-warning",
			"Out of Order": "badge-error",
			Cancelled: "badge-neutral",
			Pending: "badge-ghost",
		};
		return statusConfig[status] || "badge-ghost";
	};

	// Group selected items by menu item ID with quantities
	const selectedItemsWithQuantity = selectedMenuItems.reduce((acc, item) => {
		if (!acc[item.id]) {
			acc[item.id] = {
				menuItem: item,
				mainDishCount: 0,
				sideDishCount: 0,
				totalCount: 0,
			};
		}
		if (item.type === "main_dish") {
			acc[item.id].mainDishCount++;
		} else if (item.type === "side_dish") {
			acc[item.id].sideDishCount++;
		}
		acc[item.id].totalCount++;
		return acc;
	}, {});

	return (
		<div className="form-control">
			<label className="label">
				<span className="label-text font-semibold">Select Menu Items</span>
				<span className="label-text-alt">
					({usedSelections.main_dish}/{availableSelections.main_dish} Main •{" "}
					{usedSelections.side_dish}/{availableSelections.side_dish} Side)
				</span>
			</label>

			{/* Selected Items with Quantity Controls */}
			{Object.keys(selectedItemsWithQuantity).length > 0 && (
				<div className="mb-4 p-4 bg-base-200 rounded-lg">
					<h4 className="font-semibold mb-3">
						<ShoppingCart size={16} className="inline mr-1" />
					</h4>
					<div className="space-y-3">
						{Object.values(selectedItemsWithQuantity).map(
							({ menuItem, mainDishCount, sideDishCount, totalCount }) => (
								<SelectedItemQuantity
									key={menuItem.id}
									item={menuItem}
									mainDishCount={mainDishCount}
									sideDishCount={sideDishCount}
									totalCount={totalCount}
									usedSelections={usedSelections}
									availableSelections={availableSelections}
									onQuantityChange={onQuantityChange}
								/>
							)
						)}
					</div>
				</div>
			)}

			{/* Available Items */}
			<div className="space-y-2 max-h-96 overflow-y-auto p-2 border rounded-lg mb-4">
				{availableItems.map((item) => {
					const chosen = selectedMenuItems.find(
						(sel) => sel.id === item.menu_items.id
					);
					const isMainDish = chosen?.type === "main_dish";
					const isSideDish = chosen?.type === "side_dish";

					return (
						<MenuItem
							key={item.id}
							item={item}
							chosen={chosen}
							isMainDish={isMainDish}
							isSideDish={isSideDish}
							usedSelections={usedSelections}
							availableSelections={availableSelections}
							onToggle={onMenuItemToggle}
							status={item.status}
							getStatusBadge={getStatusBadge}
							disabled={false}
						/>
					);
				})}
			</div>

			{/* Unavailable Items (Out of Order, Cancelled) */}
			{unavailableItems.length > 0 && (
				<div>
					<label className="label">
						<span className="label-text text-gray-500">Unavailable Items</span>
					</label>
					<div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-lg">
						{unavailableItems.map((item) => (
							<MenuItem
								key={item.id}
								item={item}
								chosen={null}
								isMainDish={false}
								isSideDish={false}
								usedSelections={usedSelections}
								availableSelections={availableSelections}
								onToggle={() => {}} // No-op for disabled items
								status={item.status}
								getStatusBadge={getStatusBadge}
								disabled={true}
							/>
						))}
					</div>
				</div>
			)}

			{errors.menu_selections && (
				<label className="label">
					<span className="label-text-alt text-error">
						{errors.menu_selections.message}
					</span>
				</label>
			)}
		</div>
	);
};

// components/SubscriberOrders/CreateOrderModal/MenuItem.js
const MenuItem = ({
	item,
	chosen,
	isMainDish,
	isSideDish,
	usedSelections,
	availableSelections,
	onToggle,
	status,
	getStatusBadge,
	disabled = false,
}) => {
	const canSelect =
		!disabled && !chosen && usedSelections.total < availableSelections.total;

	return (
		<div
			onClick={() => !disabled && onToggle(item.menu_items)}
			className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
				isMainDish
					? "border-primary bg-primary/10"
					: isSideDish
					? "border-secondary bg-secondary/10"
					: disabled
					? "border-gray-300 bg-gray-100"
					: canSelect
					? "border-base-300 hover:border-base-400 hover:bg-base-100"
					: "border-base-200 bg-base-100 opacity-50"
			} ${disabled ? "cursor-not-allowed" : ""}`}>
			<div className="flex justify-between items-start">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-1">
						<p className="font-semibold">{item.menu_items.name_burmese}</p>
						<span className={`badge badge-xs ${getStatusBadge(status)}`}>
							{status}
						</span>
					</div>
					<p className="text-sm text-base-content/70 mb-1">
						{item.menu_items.name_english}
					</p>
					<p className="text-xs text-base-content/50">
						{item.menu_items.category} • ฿{item.menu_items.price}
					</p>
					{item.menu_items.class && (
						<p className="text-xs text-base-content/40 mt-1">
							Class: {item.menu_items.class}
						</p>
					)}
				</div>

				{/* Selection Badge */}
				<div className="flex flex-col items-end gap-2">
					{chosen && (
						<span
							className={`badge ${
								isMainDish ? "badge-primary" : "badge-secondary"
							}`}>
							{isMainDish ? "Main" : "Side"}
						</span>
					)}
					{disabled && (
						<span className="text-xs text-gray-500 text-right">
							Not available
						</span>
					)}
				</div>
			</div>
		</div>
	);
};
