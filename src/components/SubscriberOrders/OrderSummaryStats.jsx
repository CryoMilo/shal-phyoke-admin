// components/SubscriberOrders/OrderSummaryStats.jsx
import React from "react";
import { ChefHat, Coffee, Utensils } from "lucide-react";

export const OrderSummaryStats = ({ orders }) => {
	// Calculate how many times each menu item and add-on has been ordered
	const stats = React.useMemo(() => {
		const menuItemOrders = {}; // { menuItemName: count }
		const addOnOrders = {}; // { addOnName: count }

		orders.forEach((order) => {
			// Count menu items from main dishes
			if (order.menu_items_structured?.main_dish) {
				order.menu_items_structured.main_dish.forEach((itemId) => {
					const menuItem = order.main_dish_details?.find(
						(d) => d.id === itemId
					);
					if (menuItem) {
						const key = `${menuItem.name_burmese} (Main)`;
						menuItemOrders[key] = (menuItemOrders[key] || 0) + 1;
					}
				});
			}

			// Count menu items from side dishes
			if (order.menu_items_structured?.side_dish) {
				order.menu_items_structured.side_dish.forEach((itemId) => {
					const menuItem = order.side_dish_details?.find(
						(d) => d.id === itemId
					);
					if (menuItem) {
						const key = `${menuItem.name_burmese} (Side)`;
						menuItemOrders[key] = (menuItemOrders[key] || 0) + 1;
					}
				});
			}

			// Count add-ons (with quantity)
			if (order.add_ons_details && Array.isArray(order.add_ons_details)) {
				order.add_ons_details.forEach((addOn) => {
					if (addOn.menu_item) {
						const key = `${addOn.menu_item.name_burmese} (Add-on)`;
						addOnOrders[key] = (addOnOrders[key] || 0) + (addOn.quantity || 1);
					}
				});
			}
		});

		return {
			menuItemOrders: Object.entries(menuItemOrders),
			addOnOrders: Object.entries(addOnOrders),
		};
	}, [orders]);

	return (
		<div className="bg-base-100 border border-base-300 rounded-xl p-5 mb-6">
			<h3 className="font-bold text-lg mb-4">Menu Item Order Counts</h3>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Menu Items (Main & Side Dishes) */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 mb-3">
						<ChefHat className="w-5 h-5 text-primary" />
						<h4 className="font-semibold">Main & Side Dishes</h4>
						<span className="badge badge-primary badge-sm">
							{stats.menuItemOrders.length} items
						</span>
					</div>

					<div className="max-h-80 overflow-y-auto pr-2">
						{stats.menuItemOrders.length > 0 ? (
							<div className="space-y-2">
								{stats.menuItemOrders.map(([itemName, count]) => (
									<div
										key={itemName}
										className="flex items-center justify-between bg-base-200 p-3 rounded-lg">
										<div className="flex-1">
											<span className="font-medium">{itemName}</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="font-bold text-lg">{count}</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-base-content/50">
								<Utensils className="w-12 h-12 mx-auto mb-2 opacity-50" />
								<p>No dishes ordered yet</p>
							</div>
						)}
					</div>
				</div>

				{/* Add-ons */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 mb-3">
						<Coffee className="w-5 h-5 text-secondary" />
						<h4 className="font-semibold">Add-ons</h4>
						<span className="badge badge-secondary badge-sm">
							{stats.addOnOrders.length} items
						</span>
					</div>

					<div className="max-h-80 overflow-y-auto pr-2">
						{stats.addOnOrders.length > 0 ? (
							<div className="space-y-2">
								{stats.addOnOrders.map(([addOnName, count]) => (
									<div
										key={addOnName}
										className="flex items-center justify-between bg-base-200 p-3 rounded-lg">
										<div className="flex-1">
											<span className="font-medium">{addOnName}</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="font-bold text-lg">{count}</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-base-content/50">
								<Coffee className="w-12 h-12 mx-auto mb-2 opacity-50" />
								<p>No add-ons ordered yet</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
