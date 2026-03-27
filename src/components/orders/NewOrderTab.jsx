// components/NewOrderTab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../services/supabase";
import { Split, Info } from "lucide-react";
import ItemNoteModal from "./ItemNoteModal";
import useMenuStore from "../../stores/menuStore";
import RotatingComboPickerModal from "./RotatingComboPickerModal";

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
	splitItem,
	clearCart,
	processOrder,
}) => {
	const {
		allMenuItems,
		fetchAllMenuItems,
		getActiveFixedCombos,
		getActiveRotatingCombos,
	} = useMenuStore();

	const [todaysSpecialItems, setTodaysSpecialItems] = useState([]);
	const [activeCategory, setActiveCategory] = useState("Today's Special");

	// State for Item Note Modal
	const [showNoteModal, setShowNoteModal] = useState(false);
	const [activeItemForNote, setActiveItemForNote] = useState(null);

	const [activeRotatingCombo, setActiveRotatingCombo] = useState(null);

	const fixedCombos = useMemo(() => getActiveFixedCombos(), [allMenuItems]);
	const rotatingCombos = useMemo(
		() => getActiveRotatingCombos(),
		[allMenuItems]
	);

	const menuItems = useMemo(
		() =>
			allMenuItems.filter((i) => i.is_regular && i.is_active && !i.is_combo),
		[allMenuItems]
	);

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
				.maybeSingle();

			if (menuError || !weeklyMenu) {
				if (menuError && menuError.code !== "PGRST116") {
					// PGRST116: no rows found, which is fine
					console.error("Error fetching weekly menu:", menuError);
				}
				return;
			}

			// 2. Fetch today's items from that menu using the correct join name
			const { data: items, error: itemsError } = await supabase
				.from("weekly_menu_items")
				.select(
					`
          menu_items:menu_item_id (
            id,
            name_burmese,
            name_english,
            name_thai,
            price,
            category,
            image_url,
            is_active
          )
        `
				)
				.eq("weekly_menu_id", weeklyMenu.id)
				.eq("weekday", today);

			if (itemsError) throw itemsError;

			// Flatten the data to get an array of menu_items
			const specialItems = items
				.map((item) => item.menu_items)
				.filter(Boolean)
				.filter(item => item.is_active)
				.map(item => ({
					...item,
					available_extras: item.available_extras || [] // Ensure it exists for the modal
				}));
			setTodaysSpecialItems(specialItems);
		} catch (error) {
			console.error("Error fetching today's special items:", error);
		}
	};

	useEffect(() => {
		if (allMenuItems.length === 0) {
			fetchAllMenuItems();
		}
		fetchTodaysSpecialItems();
	}, []);

	// Dynamically get categories from the actual data
	const categories = React.useMemo(() => {
		const regularCategories = [
			...new Set(menuItems.map((item) => item.category)),
		];

		const allCategories = [];

		const hasAnyCombos = fixedCombos.length > 0 || rotatingCombos.length > 0;

		if (hasAnyCombos) {
			allCategories.push("Combos");
		}

		if (todaysSpecialItems.length > 0) {
			allCategories.push("Today's Special");
		}

		return [...allCategories, ...regularCategories];
	}, [menuItems, todaysSpecialItems, fixedCombos, rotatingCombos]);

	const filteredItems = React.useMemo(() => {
		if (activeCategory === "Combos") {
			return [
				...fixedCombos.map((c) => ({
					...c,
					isFixedCombo: true,
				})),
				...rotatingCombos.map((t) => ({
					...t,
					isRotatingCombo: true,
				})),
			];
		}
		if (activeCategory === "Today's Special") {
			return todaysSpecialItems;
		}
		return menuItems.filter((item) => item.category === activeCategory);
	}, [
		menuItems,
		todaysSpecialItems,
		activeCategory,
		fixedCombos,
		rotatingCombos,
	]);

	// Set default category to the first available one
	React.useEffect(() => {
		if (categories.length > 0 && !categories.includes(activeCategory)) {
			setActiveCategory(categories[0]);
		}
	}, [categories, activeCategory]);

	// Item Note Modal Logic
	const openNoteModal = (item) => {
		// IMPORTANT: Using cart_id now for unique notes
		setActiveItemForNote({
			...item,
			is_regular: item.is_regular ?? false,
			note: itemNotes[item.cart_id] || "",
		});
		setShowNoteModal(true);
	};

	const handleSaveNote = (combinedNote, extraPrice) => {
		updateItemNote(activeItemForNote.cart_id, combinedNote, extraPrice);
		setShowNoteModal(false);
		setActiveItemForNote(null);
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
			{/* Left: Menu Items */}
			<div className="lg:col-span-3">
				{/* Order Type Selection */}
				<div className="bg-base-200 p-4 rounded-lg mb-4 md:flex justify-between">
					<label className="label mb-1">
						<span className="label-text text-accent font-semibold">
							Order Type
						</span>
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
				</div>

				{/* Customer Info for Delivery */}
				{orderType === "delivery" && (
					<div className="bg-base-200 p-4 rounded-lg mb-4">
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
				<div className="flex gap-2 mb-4 overflow-x-auto pb-2">
					{categories.map((category) => (
						<button
							key={category}
							className={`btn btn-sm whitespace-nowrap ${
								activeCategory === category ? "btn-primary" : "btn-outline"
							}`}
							onClick={() => setActiveCategory(category)}>
							{category}
						</button>
					))}
				</div>

				{/* Menu Items Grid */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{filteredItems.length > 0 ? (
						filteredItems.map((item) => (
							<div
								key={item.id}
								className={`bg-base-100 border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden ${
									item.isRotatingCombo || item.isFixedCombo
										? "border-primary/30 ring-1 ring-primary/10"
										: "border-base-300"
								}`}
								onClick={() => {
									if (item.isFixedCombo) {
										addToCart(item, item.combo_note_summary || null, 0);
										return;
									}
									if (item.isRotatingCombo) {
										setActiveRotatingCombo(item);
										return;
									}
									addToCart(item);
								}}>
								{(item.isRotatingCombo || item.isFixedCombo) && (
									<div className="absolute top-0 right-0 bg-primary text-primary-content text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg uppercase tracking-tighter">
										Combo
									</div>
								)}
								{item.image_url && (
									<img
										src={item.image_url}
										alt={item.name_english}
										className="w-full h-20 object-cover rounded mb-2"
									/>
								)}
								<h3 className="font-semibold text-sm line-clamp-2">
									{item.name_burmese}
								</h3>
								{item.name_english && (
									<p className="text-xs text-base-content/70 truncate">
										{item.name_english}
									</p>
								)}
								<div className="mt-1 flex flex-col">
									<p className="text-primary font-bold">฿{item.price}</p>
									{item.isFixedCombo && (
										<span className="badge badge-primary badge-xs mt-1">
											Fixed Set
										</span>
									)}
									{item.isRotatingCombo && (
										<span className="badge badge-secondary badge-xs mt-1">
											Daily Set
										</span>
									)}
								</div>
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
			<div className="rounded-lg h-fit col-span-2 sticky top-4 bg-base-200 p-4">
				<h2 className="text-lg font-bold mb-4">Current Order</h2>

				{/* Cart Items */}
				<div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
					{cart.map((item) => (
						<div
							key={item.cart_id}
							className={`bg-base-100 p-2 rounded-lg border shadow-sm ${
								item.isRotatingCombo || item.isFixedCombo
									? "border-primary/20 bg-primary/5"
									: "border-base-300"
							}`}>
							<div className="flex justify-between items-start mb-1">
								<div className="flex-1">
									<div className="font-medium text-sm leading-tight">
										{item.name_burmese}
									</div>
									<div className="text-[10px] text-base-content/70 mt-1">
										฿{item.price} × {item.quantity} = ฿
										{item.price * item.quantity}
									</div>
								</div>
								<div className="flex items-center gap-1 bg-base-200 rounded-full px-1">
									<button
										className="btn btn-xs btn-circle btn-ghost"
										onClick={() => updateQuantity(item.cart_id, -1)}>
										-
									</button>
									<span className="font-mono text-xs w-4 text-center">
										{item.quantity}
									</span>
									<button
										className="btn btn-xs btn-circle btn-ghost"
										onClick={() => updateQuantity(item.cart_id, 1)}>
										+
									</button>
								</div>
							</div>

							{/* Note & Split Actions */}
							<div className="mt-2 flex gap-1 items-center">
								{/* Split Button - Only show if quantity > 1 */}
								{item.quantity > 1 && (
									<button
										className="btn btn-sm text-accent hover:bg-primary hover:text-white border-none"
										title="Split into separate lines"
										onClick={() => splitItem(item.cart_id)}>
										<Split className="w-3.5 h-3.5" />
									</button>
								)}

								<div className="flex-1">
									{itemNotes[item.cart_id] && (
										<div className="text-[10px] text-accent font-bold mb-1 line-clamp-1 italic px-1">
											"{itemNotes[item.cart_id]}"
										</div>
									)}
									<button
										className={`btn btn-sm w-full justify-start gap-2 ${
											itemNotes[item.cart_id]
												? "btn-accent btn-outline"
												: "btn-ghost border-base-300"
										}`}
										onClick={() => openNoteModal(item)}>
										<span className="text-[10px]">
											{itemNotes[item.cart_id] ? "Edit Note" : "+ Add Note"}
										</span>
									</button>
								</div>
							</div>
						</div>
					))}
					{cart.length === 0 && (
						<div className="text-center text-base-content/50 py-8">
							No items added
						</div>
					)}
				</div>

				{/* Totals */}
				<div className="border-t border-base-300 pt-4 space-y-2">
					<div className="flex justify-between text-sm">
						<span>Subtotal:</span>
						<span>฿{subtotal.toFixed(2)}</span>
					</div>
					<div className="flex justify-between text-sm">
						<span>Discount:</span>
						<div className="flex items-center gap-2">
							<input
								type="number"
								className="input input-bordered input-xs w-20"
								value={discountAmount}
								onChange={(e) => setDiscountAmount(Number(e.target.value))}
								min="0"
								max={subtotal}
							/>
							<span>฿</span>
						</div>
					</div>
					<div className="flex justify-between font-bold text-lg border-t border-base-300 pt-2">
						<span>Total:</span>
						<span>฿{totalAmount.toFixed(2)}</span>
					</div>
				</div>

				{/* Table Selection for Dine In */}
				{orderType === "dine_in" && (
					<div className="mt-3">
						<button
							className="btn btn-secondary btn-sm w-full text-white"
							onClick={() => setShowTableModal(true)}>
							{tableNumber ? `Table ${tableNumber}` : "Select Table"}
						</button>
					</div>
				)}

				{/* Payment Method */}
				<div className="mt-4">
					<label className="label py-1">
						<span className="label-text font-semibold text-xs">
							Payment Method
						</span>
					</label>
					<div className="flex gap-1">
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
					<label className="label py-1">
						<span className="label-text text-xs">Order Notes</span>
					</label>
					<textarea
						className="textarea textarea-bordered textarea-xs w-full"
						placeholder="General instructions..."
						rows="2"
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
						Process Order - ฿{totalAmount.toFixed(2)}
					</button>
					<button className="btn btn-outline btn-xs w-full" onClick={clearCart}>
						Clear Order
					</button>
				</div>
			</div>

			{/* Item Note Modal */}
			<ItemNoteModal
				show={showNoteModal}
				item={activeItemForNote}
				onClose={() => setShowNoteModal(false)}
				onSave={handleSaveNote}
			/>

			{/* Rotating Combo Picker Modal */}
			{activeRotatingCombo && (
				<RotatingComboPickerModal
					combo={activeRotatingCombo}
					todayItems={todaysSpecialItems}
					onConfirm={(cartItem, noteString) => {
						addToCart(cartItem, noteString || null, 0);
						setActiveRotatingCombo(null);
					}}
					onClose={() => setActiveRotatingCombo(null)}
				/>
			)}
		</div>
	);
};

export default NewOrderTab;
