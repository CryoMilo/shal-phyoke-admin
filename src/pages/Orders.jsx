// pages/Orders.jsx
import { useState, useEffect } from "react";
import NewOrderTab from "../components/orders/NewOrderTab";
import ActiveOrdersTab from "../components/orders/ActiveOrdersTab";
import TableSelectionModal from "../components/orders/TableSelectionModal";
import { supabase } from "../services/supabase";
import OrderHistoryTab from "../components/orders/OrderHistoryTab";
import { Link, useLocation, Outlet } from "@tanstack/react-router";
import { showToast } from "../utils/toastUtils";
import useQuickNoteStore from "../stores/quickNoteStore";

export const Orders = () => {
	const fetchSettings = useQuickNoteStore((state) => state.fetchSettings);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	const location = useLocation();
	const isSettingsPath = location.pathname.endsWith("/settings");
	const [activeTab, setActiveTab] = useState("new-order");
	const [cart, setCart] = useState([]); // Array of { ...menuItem, cart_id, quantity }
	const [orderType, setOrderType] = useState("dine_in");
	const [customerInfo, setCustomerInfo] = useState({
		name: "",
		phone: "",
		address: "",
	});
	const [tableNumber, setTableNumber] = useState(null);
	const [showTableModal, setShowTableModal] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState("unpaid");
	const [discountAmount, setDiscountAmount] = useState(0);
	const [notes, setNotes] = useState("");
	const [itemNotes, setItemNotes] = useState({}); // { cartId: "note" }
	const [itemExtraPrices, setItemExtraPrices] = useState({}); // { cartId: extraPrice }

	// Calculate totals
	const subtotal = cart.reduce(
		(sum, item) => {
			const extraPrice = itemExtraPrices[item.cart_id] || 0;
			return sum + (item.price + extraPrice) * item.quantity;
		},
		0
	);
	const totalAmount = Math.max(0, subtotal - discountAmount);

	const addToCart = (menuItem) => {
		setCart((prev) => {
			// Find if there's an entry with the same menu ID AND NO NOTES yet
			// This keeps "clean" items grouped until the user modifies them or splits them
			const existingIndex = prev.findIndex(
				(item) => item.id === menuItem.id && !itemNotes[item.cart_id]
			);

			if (existingIndex !== -1) {
				const newCart = [...prev];
				newCart[existingIndex] = {
					...newCart[existingIndex],
					quantity: newCart[existingIndex].quantity + 1,
				};
				return newCart;
			}

			// Otherwise add as a new line item
			const cart_id = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			return [...prev, { ...menuItem, quantity: 1, cart_id }];
		});
	};

	const updateQuantity = (cartId, change) => {
		setCart((prev) => {
			const updated = prev.map((item) =>
				item.cart_id === cartId
					? { ...item, quantity: Math.max(0, item.quantity + change) }
					: item
			);
			const filtered = updated.filter((item) => item.quantity > 0);
			
			// If an item is removed, clean up its notes and extra prices
			if (filtered.length < updated.length) {
				const remainingCartIds = filtered.map(item => item.cart_id);
				
				setItemNotes(prevNotes => {
					const newNotes = { ...prevNotes };
					Object.keys(newNotes).forEach(id => {
						if (!remainingCartIds.includes(id)) delete newNotes[id];
					});
					return newNotes;
				});

				setItemExtraPrices(prevExtras => {
					const newExtras = { ...prevExtras };
					Object.keys(newExtras).forEach(id => {
						if (!remainingCartIds.includes(id)) delete newExtras[id];
					});
					return newExtras;
				});
			}
			
			return filtered;
		});
	};

	const splitItem = (cartId) => {
		setCart((prev) => {
			const itemToSplit = prev.find((item) => item.cart_id === cartId);
			if (!itemToSplit || itemToSplit.quantity <= 1) return prev;

			const otherItems = prev.filter((item) => item.cart_id !== cartId);
			const newItems = [];
			
			// Original note and extra price if any
			const originalNote = itemNotes[cartId] || "";
			const originalExtraPrice = itemExtraPrices[cartId] || 0;

			for (let i = 0; i < itemToSplit.quantity; i++) {
				const newCartId = `cart_${Date.now()}_split_${i}_${Math.random().toString(36).substr(2, 5)}`;
				newItems.push({
					...itemToSplit,
					quantity: 1,
					cart_id: newCartId
				});
				
				// Copy original note and extra price to all split items initially
				if (originalNote) {
					setItemNotes(prevNotes => ({
						...prevNotes,
						[newCartId]: originalNote
					}));
				}
				if (originalExtraPrice) {
					setItemExtraPrices(prevExtras => ({
						...prevExtras,
						[newCartId]: originalExtraPrice
					}));
				}
			}

			// Remove the old cartId from notes and extra prices
			setItemNotes(prevNotes => {
				const newNotes = { ...prevNotes };
				delete newNotes[cartId];
				return newNotes;
			});
			setItemExtraPrices(prevExtras => {
				const newExtras = { ...prevExtras };
				delete newExtras[cartId];
				return newExtras;
			});

			return [...otherItems, ...newItems];
		});
	};

	const updateItemNote = (cartId, note, extraPrice = 0) => {
		setItemNotes((prev) => ({
			...prev,
			[cartId]: note,
		}));
		setItemExtraPrices((prev) => ({
			...prev,
			[cartId]: extraPrice,
		}));
	};

	const clearCart = () => {
		setCart([]);
		setCustomerInfo({ name: "", phone: "", address: "" });
		setTableNumber(null);
		setDiscountAmount(0);
		setNotes("");
		setItemNotes({});
		setItemExtraPrices({});
		setPaymentMethod("unpaid");
	};

	const processOrder = async () => {
		if (cart.length === 0) return;
		
		try {
			// Auto-mark as paid if cash or QR is selected
			const paymentStatus =
				paymentMethod === "cash" || paymentMethod === "qr" ? "paid" : "unpaid";

			const orderData = {
				order_type: orderType,
				customer_name: customerInfo.name || null,
				customer_phone: orderType === "delivery" ? customerInfo.phone : null,
				delivery_address: orderType === "delivery" ? customerInfo.address : null,
				table_number: orderType === "dine_in" ? tableNumber : null,
				order_items: cart.map(item => ({
					...item,
					extra_price: itemExtraPrices[item.cart_id] || 0,
					final_price: (item.price + (itemExtraPrices[item.cart_id] || 0))
				})),
				subtotal,
				discount_amount: discountAmount,
				total_amount: totalAmount,
				payment_method: paymentMethod,
				payment_status: paymentStatus,
				notes: notes || null,
				item_notes: itemNotes, // Maps cart_id to note string
				item_extra_prices: itemExtraPrices,
			};

			const { error } = await supabase
				.from("orders")
				.insert([orderData]);

			if (error) throw error;

			showToast.success("Order processed successfully!");
			clearCart();
			setActiveTab("active-orders");
		} catch (error) {
			console.error("Error processing order:", error);
			showToast.error("Failed to process order: " + error.message);
		}
	};

	return (
		<div className="p-4 md:p-6 bg-base-100 min-h-screen">
			{/* Tabs Navigation */}
			<div className="tabs tabs-boxed mb-6 bg-base-200 p-1 w-fit">
				<Link
					to="/orders"
					className={`tab tab-lg ${!isSettingsPath && activeTab === "new-order" ? "tab-active font-bold" : ""}`}
					onClick={() => setActiveTab("new-order")}>
					New Order
				</Link>
				<Link
					to="/orders"
					className={`tab tab-lg ${!isSettingsPath && activeTab === "active-orders" ? "tab-active font-bold" : ""}`}
					onClick={() => setActiveTab("active-orders")}>
					Active Orders
				</Link>
				<Link
					to="/orders"
					className={`tab tab-lg ${!isSettingsPath && activeTab === "order-history" ? "tab-active font-bold" : ""}`}
					onClick={() => setActiveTab("order-history")}>
					Order History
				</Link>
				<Link
					to="/orders/settings"
					className={`tab tab-lg ${isSettingsPath ? "tab-active font-bold" : ""}`}>
					Quick Note Settings
				</Link>
			</div>

			{/* Tab Content or Nested Route */}
			{isSettingsPath ? (
				<Outlet />
			) : (
				<>
					{activeTab === "new-order" ? (
						<NewOrderTab
							cart={cart}
							orderType={orderType}
							setOrderType={setOrderType}
							customerInfo={customerInfo}
							setCustomerInfo={setCustomerInfo}
							tableNumber={tableNumber}
							setShowTableModal={setShowTableModal}
							paymentMethod={paymentMethod}
							setPaymentMethod={setPaymentMethod}
							discountAmount={discountAmount}
							setDiscountAmount={setDiscountAmount}
							notes={notes}
							setNotes={setNotes}
							itemNotes={itemNotes}
							updateItemNote={updateItemNote}
							subtotal={subtotal}
							totalAmount={totalAmount}
							addToCart={addToCart}
							updateQuantity={updateQuantity}
							splitItem={splitItem}
							clearCart={clearCart}
							processOrder={processOrder}
						/>
					) : activeTab === "active-orders" ? (
						<ActiveOrdersTab />
					) : (
						<OrderHistoryTab />
					)}
				</>
			)}

			{/* Modals */}
			<TableSelectionModal
				show={showTableModal}
				onClose={() => setShowTableModal(false)}
				onSelect={(num) => {
					setTableNumber(num);
					setShowTableModal(false);
				}}
				selectedTable={tableNumber}
			/>
		</div>
	);
};

export default Orders;
