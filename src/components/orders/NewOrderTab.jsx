// components/NewOrderTab.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabase";

const getTodayWeekday = () => {
	const d = new Date();
	const weekday = new Array(7);
	weekday[0] = "Sunday";
	weekday[1] = "Monday";
	weekday[2] = "Tuesday";
	weekday[3] = "Wednesday";
	weekday[4] = "Thursday";
	weekday[5] = "Friday";
	weekday[6] = "Saturday";
	return weekday[d.getDay()];
};

const NewOrderTab = ({
	cart,
	orderType,
	setOrderType,
	customerInfo,
	setCustomerInfo,
	tableNumber,
	// setTableNumber,
	setShowTableModal,
	paymentMethod,
	setPaymentMethod,
	discountAmount,
	setDiscountAmount,
	notes,
	setNotes,
	itemNotes,
	updateItemNote,
	subtotal,
	totalAmount,
	addToCart,
	updateQuantity,
	clearCart,
	processOrder,
}) => {
	const [menuItems, setMenuItems] = useState([]);
	const [todaysSpecialItems, setTodaysSpecialItems] = useState([]);
	const [activeCategory, setActiveCategory] = useState("Today's Special");

	const fetchMenuItems = async () => {
		try {
			const { data, error } = await supabase
				.from("menu_items")
				.select("*")
				.eq("is_active", true)
				.eq("is_regular", true) // Only fetch regular menu items
				.order("category")
				.order("name_burmese");
			if (error) throw error;
			setMenuItems(data || []);
		} catch (error) {
			console.error("Error fetching regular menu items:", error);
		}
	};

	const fetchTodaysSpecialItems = async () => {
		const today = getTodayWeekday();
		try {
			// 1. Find the latest published weekly menu
			const { data: weeklyMenu, error: menuError } = await supabase
				.from("weekly_menu")
				.select("id")
				.eq("status", "Published")
				.order("created_at", { ascending: false })
				.limit(1)
				.single();

			if (menuError || !weeklyMenu) {
				if (menuError.code !== "PGRST116") {
					// PGRST116: no rows found, which is fine
					console.error("Error fetching weekly menu:", menuError);
				}
				return;
			}

			// 2. Fetch today's items from that menu
			const { data: items, error: itemsError } = await supabase
				.from("weekly_menu_items")
				.select(
					`
          menu_items (
            id,
            name_burmese,
            name_english,
            name_thai,
            price,
            category,
            image_url
          )
        `
				)
				.eq("weekly_menu_id", weeklyMenu.id)
				.eq("weekday", today);

			if (itemsError) throw itemsError;

			// Flatten the data to get an array of menu_items
			const specialItems = items.map((item) => item.menu_items);
			setTodaysSpecialItems(specialItems);
		} catch (error) {
			console.error("Error fetching today's special items:", error);
		}
	};

	useEffect(() => {
		fetchMenuItems();
		fetchTodaysSpecialItems();
	}, []);

	// Dynamically get categories from the actual data
	const categories = React.useMemo(() => {
		const regularCategories = [
			...new Set(menuItems.map((item) => item.category)),
		];

		const allCategories = [];

		if (todaysSpecialItems.length > 0) {
			allCategories.push("Today's Special");
		}

		return [...allCategories, ...regularCategories];
	}, [menuItems, todaysSpecialItems]);

	const filteredItems = React.useMemo(() => {
		if (activeCategory === "Today's Special") {
			return todaysSpecialItems;
		}
		return menuItems.filter((item) => item.category === activeCategory);
	}, [menuItems, todaysSpecialItems, activeCategory]);

	// Set default category to the first available one
	React.useEffect(() => {
		if (categories.length > 0 && !categories.includes(activeCategory)) {
			setActiveCategory(categories[0]);
		}
	}, [categories, activeCategory]);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			{/* Left: Menu Items */}
			<div className="lg:col-span-2">
				{/* Order Type Selection */}
				<div className="bg-base-200 p-4 rounded-lg mb-4">
					<label className="label">
						<span className="label-text font-semibold">Order Type</span>
					</label>
					<div className="flex gap-2">
						{["dine_in", "takeaway", "delivery"].map((type) => (
							<button
								key={type}
								className={`btn btn-sm ${
									orderType === type ? "btn-primary" : "btn-outline"
								}`}
								onClick={() => setOrderType(type)}>
								{type === "dine_in"
									? "Dine In"
									: type === "takeaway"
									? "Takeaway"
									: "Delivery"}
							</button>
						))}
					</div>

					{/* Table Selection for Dine In */}
					{orderType === "dine_in" && (
						<div className="mt-3">
							<label className="label">
								<span className="label-text font-semibold">Table Number</span>
							</label>
							<button
								className="btn btn-outline btn-sm w-full"
								onClick={() => setShowTableModal(true)}>
								{tableNumber ? `Table ${tableNumber}` : "Select Table"}
							</button>
						</div>
					)}
				</div>

				{/* Customer Info for Delivery */}
				{orderType === "delivery" && (
					<div className="bg-base-200 p-4 rounded-lg mb-4">
						<label className="label">
							<span className="label-text font-semibold">
								Delivery Information
							</span>
						</label>
						<div className="space-y-2">
							<input
								type="text"
								placeholder="Customer Name"
								className="input input-bordered w-full"
								value={customerInfo.name}
								onChange={(e) =>
									setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
								}
							/>
							<input
								type="tel"
								placeholder="Phone Number"
								className="input input-bordered w-full"
								value={customerInfo.phone}
								onChange={(e) =>
									setCustomerInfo((prev) => ({
										...prev,
										phone: e.target.value,
									}))
								}
							/>
							<textarea
								placeholder="Delivery Address"
								className="textarea textarea-bordered w-full"
								value={customerInfo.address}
								onChange={(e) =>
									setCustomerInfo((prev) => ({
										...prev,
										address: e.target.value,
									}))
								}
							/>
						</div>
					</div>
				)}

				{/* Customer Info for Takeaway (Name only) */}
				{orderType === "takeaway" && (
					<div className="bg-base-200 p-4 rounded-lg mb-4">
						<label className="label">
							<span className="label-text font-semibold">
								Customer Name (Optional)
							</span>
						</label>
						<input
							type="text"
							placeholder="Customer Name"
							className="input input-bordered w-full"
							value={customerInfo.name}
							onChange={(e) =>
								setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
							}
						/>
					</div>
				)}

				{/* Menu Categories */}
				<div className="flex gap-2 mb-4 overflow-x-auto">
					{categories.map((category) => (
						<button
							key={category}
							className={`btn btn-sm ${
								activeCategory === category ? "btn-primary" : "btn-outline"
							}`}
							onClick={() => setActiveCategory(category)}>
							{category}
						</button>
					))}
				</div>

				{/* Debug info - remove in production */}
				{/* {process.env.NODE_ENV === "development" && (
					<div className="text-xs text-gray-500 mb-2">
						Debug: {filteredItems.length} items in {activeCategory}
					</div>
				)} */}

				{/* Menu Items Grid */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{filteredItems.length > 0 ? (
						filteredItems.map((item) => (
							<div
								key={item.id}
								className="bg-base-100 border border-base-300 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
								onClick={() => addToCart(item)}>
								{item.image_url && (
									<img
										src={item.image_url}
										alt={item.name_english}
										className="w-full h-20 object-cover rounded mb-2"
									/>
								)}
								<h3 className="font-semibold text-sm">{item.name_burmese}</h3>
								{item.name_english && (
									<p className="text-xs text-base-content/70">
										{item.name_english}
									</p>
								)}
								<p className="text-primary font-bold mt-1">Ks{item.price}</p>
								{/* Debug info - remove in production */}
								{/* {process.env.NODE_ENV === "development" && (
									<p className="text-xs text-gray-400 mt-1">
										Cat: {item.category}
									</p>
								)} */}
							</div>
						))
					) : (
						<div className="col-span-full text-center py-8 text-base-content/50">
							No items found in {activeCategory}
						</div>
					)}
				</div>
			</div>

			{/* Right: Order Summary */}
			<div className="bg-base-200 rounded-lg p-4 h-fit sticky top-4">
				<h2 className="text-lg font-bold mb-4">Current Order</h2>

				{/* Cart Items */}
				<div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
					{cart.map((item) => (
						<div key={item.id} className="bg-base-100 p-2 rounded border">
							<div className="flex justify-between items-start mb-1">
								<div className="flex-1">
									<div className="font-medium text-sm">{item.name_burmese}</div>
									<div className="text-xs text-base-content/70">
										Ks{item.price} × {item.quantity} = Ks
										{item.price * item.quantity}
									</div>
								</div>
								<div className="flex items-center gap-1">
									<button
										className="btn btn-xs btn-circle"
										onClick={() => updateQuantity(item.id, -1)}>
										-
									</button>
									<span className="font-mono w-6 text-center">
										{item.quantity}
									</span>
									<button
										className="btn btn-xs btn-circle"
										onClick={() => updateQuantity(item.id, 1)}>
										+
									</button>
								</div>
							</div>
							{/* Item-specific notes */}
							<input
								type="text"
								placeholder="Add note for this item..."
								className="input input-bordered input-xs w-full mt-1"
								value={itemNotes[item.id] || ""}
								onChange={(e) => updateItemNote(item.id, e.target.value)}
							/>
						</div>
					))}
					{cart.length === 0 && (
						<div className="text-center text-base-content/50 py-8">
							No items added
						</div>
					)}
				</div>

				{/* Totals */}
				<div className="border-t pt-4 space-y-2">
					<div className="flex justify-between">
						<span>Subtotal:</span>
						<span>Ks{subtotal.toFixed(2)}</span>
					</div>
					<div className="flex justify-between">
						<span>Discount:</span>
						<div className="flex items-center gap-2">
							<input
								type="number"
								className="input input-bordered input-sm w-20"
								value={discountAmount}
								onChange={(e) => setDiscountAmount(Number(e.target.value))}
								min="0"
								max={subtotal}
							/>
							<span>Ks</span>
						</div>
					</div>
					<div className="flex justify-between font-bold text-lg border-t pt-2">
						<span>Total:</span>
						<span>Ks{totalAmount.toFixed(2)}</span>
					</div>
				</div>

				{/* Payment Method */}
				<div className="mt-4">
					<label className="label">
						<span className="label-text font-semibold">Payment Method</span>
					</label>
					<div className="flex gap-2">
						{["unpaid", "cash", "qr"].map((method) => (
							<button
								key={method}
								className={`btn btn-sm flex-1 ${
									paymentMethod === method ? "btn-primary" : "btn-outline"
								}`}
								onClick={() => setPaymentMethod(method)}>
								{method === "unpaid"
									? "Unpaid"
									: method === "cash"
									? "Cash"
									: "QR"}
							</button>
						))}
					</div>
				</div>

				{/* Order Notes */}
				<div className="mt-4">
					<label className="label">
						<span className="label-text">Order Notes</span>
					</label>
					<textarea
						className="textarea textarea-bordered w-full"
						placeholder="Special instructions for the whole order..."
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				</div>

				{/* Action Buttons */}
				<div className="mt-6 space-y-2">
					<button
						className="btn btn-primary w-full"
						disabled={cart.length === 0}
						onClick={processOrder}>
						Process Order - Ks{totalAmount.toFixed(2)}
					</button>
					<button className="btn btn-outline w-full" onClick={clearCart}>
						Clear Order
					</button>
				</div>
			</div>
		</div>
	);
};

export default NewOrderTab;
