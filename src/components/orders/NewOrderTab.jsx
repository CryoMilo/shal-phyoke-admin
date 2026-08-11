// components/NewOrderTab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Split, Copy, Check, FolderOpen } from "lucide-react";
import ItemNoteModal from "./ItemNoteModal";
import AddonSelectionModal from "./AddonSelectionModal";
import TableSelectionModal from "./TableSelectionModal";
import useMenuStore from "../../stores/menuStore";
import { useAuth } from "../../contexts/AuthContext";
import useOrderStore from "../../stores/orderStore";
import PaymentModal from "../common/PaymentModal";
import { showToast } from "../../utils/toastUtils";
import { generateOrderDetailsText } from "../../utils/orderUtils";
import { isBaseItemAvailable } from "../../utils/stockUtils";
import MenuItemCard from "./MenuItemCard";

const NewOrderTab = ({ processOrder, isProcessing }) => {
	const { allMenuItems, fetchAllMenuItems, getActiveFixedCombos } =
		useMenuStore();
	const { isAdmin, isStaff } = useAuth();

	const {
		cart,
		orderType,
		customerInfo,
		tableNumber,
		deliveryFee,
		paymentMethod,
		discountAmount,
		notes,
		itemNotes,
		itemExtraPrices,
		drafts,
		isNightMode,
		setIsNightMode,
		setOrderType,
		setCustomerInfo,
		setTableNumber,
		setDeliveryFee,
		setPaymentMethod,
		setDiscountAmount,
		setNotes,
		addToCart,
		updateQuantity,
		splitItem,
		updateItemNote,
		clearCart,
		saveCurrentToDraft,
		loadDraft,
		deleteDraft,
		getSubtotal,
		getTotalAmount,
	} = useOrderStore();

	const subtotal = getSubtotal();
	const totalAmount = getTotalAmount();

	useEffect(() => {
		setOrderType("dine_in");
	}, []);

	const [activeCategory, setActiveCategory] = useState("");

	// Modals State
	const [showNoteModal, setShowNoteModal] = useState(false);
	const [showTableModal, setShowTableModal] = useState(false);
	const [showDraftsModal, setShowDraftsModal] = useState(false);
	const [activeItemForNote, setActiveItemForNote] = useState(null);
	const [showAddonModal, setShowAddonModal] = useState(false);
	const [itemForAddon, setItemForAddon] = useState(null);

	const handleItemClick = (item) => {
		const isAvailable = isBaseItemAvailable(item);
		if (!isAvailable) return;

		if (item.isCombo) {
			addToCart(item, item.combo_note_summary || null, 0);
			return;
		}

		// Find master item to get available_extras
		const masterItem =
			allMenuItems.find((m) => String(m.id) === String(item.id)) || item;
		const availableExtras = masterItem.available_extras || [];

		// If item has linked extras / add-ons attached
		if (availableExtras.length > 0) {
			setItemForAddon({ ...item, available_extras: availableExtras });
			setShowAddonModal(true);
			return;
		}

		// Direct add to cart
		addToCart({ ...item, available_extras: availableExtras });
	};

	const handleConfirmAddon = (note, extraPrice) => {
		if (itemForAddon) {
			addToCart(itemForAddon, note || null, extraPrice || 0);
		}
		setShowAddonModal(false);
		setItemForAddon(null);
	};

	// Payment Confirmation Modal State
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [pendingPaymentMethod, setPendingPaymentMethod] = useState(null);
	const [isCopied, setIsCopied] = useState(false);

	const combos = useMemo(() => getActiveFixedCombos(), [allMenuItems]);

	const menuItems = useMemo(
		() =>
			allMenuItems.filter(
				(i) => i.is_regular && !i.is_combo && i.category !== "Discontinued"
			),
		[allMenuItems]
	);

	useEffect(() => {
		// Always fetch to ensure we have the latest data and extras
		fetchAllMenuItems();
	}, [fetchAllMenuItems]);

	// Dynamically get categories from the actual data
	const categories = React.useMemo(() => {
		const nightFilteredMenuItems = isNightMode
			? menuItems.filter(
					(item) => Array.isArray(item.tags) && item.tags.includes("night")
			  )
			: menuItems;

		const nightFilteredCombos = isNightMode
			? combos.filter(
					(item) => Array.isArray(item.tags) && item.tags.includes("night")
			  )
			: combos;

		const regularCategories = [
			...new Set(nightFilteredMenuItems.map((item) => item.category)),
		];

		const allCategories = [];

		if (nightFilteredCombos.length > 0) {
			allCategories.push("Combos");
		}

		return [...allCategories, ...regularCategories];
	}, [menuItems, combos, isNightMode]);

	const filteredItems = React.useMemo(() => {
		let items = [];
		if (activeCategory === "Combos") {
			items = combos.map((c) => ({
				...c,
				isCombo: true,
			}));
		} else {
			items = menuItems.filter((item) => item.category === activeCategory);
		}

		if (isNightMode) {
			return items.filter(
				(item) => Array.isArray(item.tags) && item.tags.includes("night")
			);
		}
		return items;
	}, [menuItems, activeCategory, combos, isNightMode]);

	// Set default category to the first available one
	React.useEffect(() => {
		if (categories.length > 0 && !categories.includes(activeCategory)) {
			setActiveCategory(categories[0]);
		}
	}, [categories, activeCategory]);

	// Item Note Modal Logic
	const openNoteModal = (item) => {
		// IMPORTANT: Match with master list to get full data including extras
		const masterItem = allMenuItems.find(
			(m) => String(m.id) === String(item.id)
		);

		setActiveItemForNote({
			...item,
			available_extras: masterItem?.available_extras || [],
			quick_note_ids: masterItem?.quick_note_ids || [],
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

	const handlePaymentConfirm = () => {
		setPaymentMethod(pendingPaymentMethod);
		setShowPaymentModal(false);
	};

	const handlePaymentMethodClick = (method) => {
		if (method === "cash" || method === "qr") {
			setPendingPaymentMethod(method);
			setShowPaymentModal(true);
		} else {
			setPaymentMethod(method);
		}
	};

	const handleCopyOrder = () => {
		if (cart.length === 0) return;

		const text = generateOrderDetailsText({
			cart,
			customerInfo,
			orderType,
			tableNumber,
			itemNotes,
			itemExtraPrices,
			subtotal,
			discountAmount,
			deliveryFee,
			totalAmount,
			notes,
		});

		navigator.clipboard.writeText(text).then(() => {
			setIsCopied(true);
			showToast.success("Order copied to clipboard!");
			setTimeout(() => setIsCopied(false), 2000);
		});
	};

	const handleOrderTypeToggle = (type) => {
		// If clicking the same type, it toggles off to dine_in
		if (orderType === type) {
			setOrderType("dine_in");
		} else {
			setOrderType(type);
		}
	};

	const visibleOrderTypes = [];
	if (isAdmin || isStaff) {
		visibleOrderTypes.push("takeaway", "delivery");
	}

	return (
		<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
			{/* Left: Menu Items */}
			<div className="lg:col-span-3">
				{/* Order Type Selection */}
				<div className="bg-base-200 p-4 rounded-lg mb-4 md:flex justify-between items-center">
					<label className="label mb-1 md:mb-0">
						<span className="label-text text-accent font-semibold">
							Order Type
						</span>
					</label>
					<div className="flex gap-2">
						{visibleOrderTypes.map((type) => (
							<button
								key={type}
								className={`btn btn-sm ${
									orderType === type ? "btn-primary" : "btn-outline"
								}`}
								onClick={() => handleOrderTypeToggle(type)}>
								{type === "takeaway" ? "Takeaway" : "Delivery"}
							</button>
						))}
						<button
							className="btn btn-sm btn-outline btn-secondary gap-1"
							onClick={() => setShowDraftsModal(true)}>
							<FolderOpen className="w-4 h-4" />
							Drafts
							{drafts.length > 0 && (
								<span className="badge badge-secondary badge-sm font-bold">
									{drafts.length}
								</span>
							)}
						</button>
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
							placeholder="Customer Name (Optional)"
							className="input input-bordered w-full"
							value={customerInfo.name}
							onChange={(e) =>
								setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
							}
						/>
					</div>
				)}

				{/* Menu Categories & Night Mode Toggle */}
				<div className="flex justify-between items-center gap-2 mb-4">
					<div className="flex gap-2 overflow-x-auto pb-2 flex-grow">
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

					{/* Night Menu Mode Toggle (Desktop only) */}
					<button
						onClick={() => setIsNightMode(!isNightMode)}
						className={`btn btn-sm flex-shrink-0 gap-1.5 transition-all duration-300 rounded-full px-4 border hidden lg:inline-flex ${
							isNightMode
								? "bg-slate-900 hover:bg-slate-800 text-yellow-300 border-indigo-500 shadow-md shadow-indigo-500/30"
								: "btn-outline border-base-300 text-base-content/75 hover:bg-base-200"
						}`}
						title="Toggle Night Menu Mode">
						{isNightMode ? (
							<span className="animate-pulse">🌙</span>
						) : (
							<span>☀️</span>
						)}
					</button>
				</div>

				{/* Menu Items Grid */}
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
					{filteredItems.length > 0 ? (
						filteredItems.map((item) => (
							<MenuItemCard
								key={item.id}
								item={item}
								allMenuItems={allMenuItems}
								onClick={handleItemClick}
							/>
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
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-bold">Current Order</h2>
					<button
						className={`btn btn-sm btn-ghost gap-2 ${
							isCopied ? "text-success" : "opacity-60 hover:opacity-100"
						}`}
						onClick={handleCopyOrder}
						disabled={cart.length === 0}
						title="Copy order details">
						{isCopied ? (
							<>
								<Check className="w-4 h-4" />
								<span className="text-xs font-bold">Copied</span>
							</>
						) : (
							<>
								<Copy className="w-4 h-4" />
								<span className="text-xs font-bold">Copy</span>
							</>
						)}
					</button>
				</div>

				{/* Cart Items */}
				<div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
					{cart.map((item) => (
						<div
							key={item.cart_id}
							className={`bg-base-100 p-2 rounded-lg border shadow-sm ${
								item.isCombo
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
						<div className="text-center text-base-content/50 py-8 text-sm">
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
								value={discountAmount === 0 ? "" : discountAmount}
								placeholder="0"
								onChange={(e) => {
									const val = e.target.value;
									setDiscountAmount(val === "" ? 0 : Number(val));
								}}
								min="0"
								max={subtotal}
							/>
							<span>฿</span>
						</div>
					</div>
					{orderType === "delivery" && (
						<div className="flex justify-between text-sm text-accent">
							<span className="font-bold">Delivery Fee:</span>
							<div className="flex items-center gap-2">
								<input
									type="number"
									className="input input-bordered input-accent input-xs w-20 font-bold"
									value={deliveryFee === 0 ? "" : deliveryFee}
									placeholder="0"
									onChange={(e) => {
										const val = e.target.value;
										setDeliveryFee(val === "" ? 0 : Number(val));
									}}
									min="0"
								/>
								<span>฿</span>
							</div>
						</div>
					)}
					<div className="flex justify-between font-bold text-lg border-t border-base-300 pt-2">
						<span>Total:</span>
						<span>฿{totalAmount.toFixed(2)}</span>
					</div>
				</div>

				{/* Table Selection for Dine In & Takeaway */}
				{(orderType === "dine_in" || orderType === "takeaway") && (
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
								onClick={() => handlePaymentMethodClick(method)}>
								{method === "unpaid"
									? "Unpaid"
									: method === "cash"
									? "Cash"
									: "QR"}
							</button>
						))}
					</div>
				</div>

				{/* Secondary Order Type Selection */}
				<div className="mt-4">
					<label className="label py-1">
						<span className="label-text font-semibold text-xs">Order Type</span>
					</label>
					<div className="flex gap-1">
						{visibleOrderTypes.map((type) => (
							<button
								key={type}
								className={`btn btn-sm flex-1 ${
									orderType === type ? "btn-primary" : "btn-outline"
								}`}
								onClick={() => handleOrderTypeToggle(type)}>
								{type === "takeaway" ? "Takeaway" : "Delivery"}
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
						disabled={cart.length === 0 || isProcessing}
						onClick={processOrder}>
						{isProcessing ? (
							<>
								<span className="loading loading-spinner loading-xs"></span>
								Processing...
							</>
						) : (
							`Process Order - ฿${totalAmount.toFixed(2)}`
						)}
					</button>
					<button
						className="btn btn-outline btn-xs w-full"
						onClick={clearCart}
						disabled={isProcessing}>
						Clear Order
					</button>
					<button
						className="btn btn-secondary btn-outline btn-xs w-full mt-2"
						onClick={saveCurrentToDraft}
						disabled={cart.length === 0 || isProcessing}>
						Save to Draft
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

			{/* Table Selection Modal */}
			<TableSelectionModal
				show={showTableModal}
				onClose={() => setShowTableModal(false)}
				onSelect={(num) => {
					setTableNumber(num);
					setShowTableModal(false);
				}}
				selectedTable={tableNumber}
			/>

			{/* Payment Confirmation Modal */}
			<PaymentModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				onConfirm={handlePaymentConfirm}
				amount={totalAmount}
				paymentMethod={pendingPaymentMethod}
			/>

			{/* Drafts Modal */}
			{showDraftsModal && (
				<div className="modal modal-open z-50">
					<div className="modal-box max-w-4xl p-0 overflow-hidden bg-base-100">
						<div className="p-4 bg-base-200 border-b border-base-300 flex justify-between items-center">
							<h3 className="font-bold text-lg flex items-center gap-2">
								<FolderOpen className="w-5 h-5 text-secondary" /> Local Drafts /
								Parked Orders
							</h3>
							<button
								className="btn btn-sm btn-circle btn-ghost"
								onClick={() => setShowDraftsModal(false)}>
								✕
							</button>
						</div>

						<div className="p-6 max-h-[70vh] overflow-y-auto">
							{drafts.length > 0 ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
									{drafts.map((draft) => {
										const timeElapsed = Math.floor(
											(new Date() - new Date(draft.created_at)) / 60000
										);
										return (
											<div
												key={draft.id}
												className="card border-2 border-secondary/20 bg-base-100 hover:border-secondary transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 group relative">
												{/* Delete Button */}
												<button
													className="absolute top-2 right-2 btn btn-circle btn-xs btn-error z-10 text-white"
													onClick={(e) => {
														e.stopPropagation();
														deleteDraft(draft.id);
														showToast.success("Draft deleted");
													}}
													title="Delete draft">
													✕
												</button>

												<div
													className="card-body p-4 relative"
													onClick={() => {
														loadDraft(draft);
														setShowDraftsModal(false);
														showToast.success("Loaded draft into POS");
													}}>
													<div className="text-[10px] opacity-40 font-mono mb-1">
														{timeElapsed}m ago
													</div>

													<div className="flex items-center gap-2 mb-2">
														<div
															className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm
															${
																draft.orderType === "dine_in"
																	? "bg-primary text-primary-content"
																	: draft.orderType === "delivery"
																	? "bg-accent text-accent-content"
																	: "bg-secondary text-secondary-content"
															}`}>
															{draft.tableNumber ||
																draft.customerInfo?.name
																	?.substring(0, 2)
																	.toUpperCase() ||
																"?"}
														</div>
														<div className="flex-1 min-w-0">
															<div className="text-xs font-bold truncate">
																{draft.customerInfo?.name ||
																	(draft.orderType === "dine_in"
																		? `Table ${draft.tableNumber}`
																		: draft.orderType.toUpperCase())}
															</div>
															<div className="text-[10px] opacity-50 font-mono">
																Draft
															</div>
														</div>
													</div>

													<div className="text-xs space-y-1 mb-3 flex-1">
														<div className="opacity-70 font-semibold line-clamp-2">
															{draft.cart
																.map(
																	(item) =>
																		`${item.quantity}x ${item.name_burmese}`
																)
																.join(", ")}
														</div>
														{draft.notes && (
															<div className="text-[10px] text-accent truncate italic">
																"{draft.notes}"
															</div>
														)}
													</div>

													<div className="flex justify-between items-center mt-auto pt-2 border-t border-base-200">
														<span className="font-bold text-primary text-sm">
															฿
															{draft.cart.reduce(
																(sum, item) => sum + item.price * item.quantity,
																0
															)}
														</span>
														<span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-secondary/20 text-secondary">
															DRAFT
														</span>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-center py-12 opacity-50">
									<FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
									<p>No parked drafts available.</p>
								</div>
							)}
						</div>
					</div>
					<div
						className="modal-backdrop bg-black/50"
						onClick={() => setShowDraftsModal(false)}></div>
				</div>
			)}
			{/* Add-on Selection Modal */}
			<AddonSelectionModal
				isOpen={showAddonModal}
				onClose={() => {
					setShowAddonModal(false);
					setItemForAddon(null);
				}}
				onConfirm={handleConfirmAddon}
				item={itemForAddon}
			/>
		</div>
	);
};

export default NewOrderTab;
