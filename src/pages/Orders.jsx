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
import useOrderStore from "../stores/orderStore";

export const Orders = () => {
	const fetchSettings = useQuickNoteStore((state) => state.fetchSettings);
	const {
		cart,
		orderType,
		customerInfo,
		tableNumber,
		paymentMethod,
		discountAmount,
		notes,
		itemNotes,
		itemExtraPrices,
		setOrderType,
		setCustomerInfo,
		setTableNumber,
		setPaymentMethod,
		setDiscountAmount,
		setNotes,
		addToCart,
		updateQuantity,
		splitItem,
		updateItemNote,
		clearCart,
		getSubtotal,
		getTotalAmount,
	} = useOrderStore();

	const [activeTab, setActiveTab] = useState("new-order");
	const [showTableModal, setShowTableModal] = useState(false);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	const location = useLocation();
	const isSettingsPath = location.pathname.endsWith("/settings");

	const subtotal = getSubtotal();
	const totalAmount = getTotalAmount();

	const processOrder = async () => {
		if (cart.length === 0) return;

		try {
			const paymentStatus =
				paymentMethod === "cash" || paymentMethod === "qr" ? "paid" : "unpaid";

			const orderData = {
				order_type: orderType,
				customer_name: customerInfo.name || null,
				customer_phone: orderType === "delivery" ? customerInfo.phone : null,
				delivery_address:
					orderType === "delivery" ? customerInfo.address : null,
				table_number: orderType === "dine_in" ? tableNumber : null,
				order_items: cart.map((item) => ({
					...item,
					extra_price: itemExtraPrices[item.cart_id] || 0,
					final_price: item.price + (itemExtraPrices[item.cart_id] || 0),
				})),
				subtotal,
				discount_amount: discountAmount,
				total_amount: totalAmount,
				payment_method: paymentMethod,
				payment_status: paymentStatus,
				notes: notes || null,
				item_notes: itemNotes,
				item_extra_prices: itemExtraPrices,
			};

			const { error } = await supabase.from("orders").insert([orderData]);

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
		<div className="p-4 bg-base-100 min-h-screen">
			{/* Tabs Navigation */}
			<div className="tabs tabs-boxed mb-3 bg-base-200 p-1 w-fit rounded-lg">
				<Link
					to="/orders"
					className={`tab tab-lg ${
						!isSettingsPath && activeTab === "new-order"
							? "tab-active font-bold"
							: ""
					}`}
					onClick={() => setActiveTab("new-order")}>
					New Order
				</Link>
				<Link
					to="/orders"
					className={`tab tab-lg ${
						!isSettingsPath && activeTab === "active-orders"
							? "tab-active font-bold"
							: ""
					}`}
					onClick={() => setActiveTab("active-orders")}>
					Active Orders
				</Link>
				<Link
					to="/orders"
					className={`tab tab-lg ${
						!isSettingsPath && activeTab === "order-history"
							? "tab-active font-bold"
							: ""
					}`}
					onClick={() => setActiveTab("order-history")}>
					Order History
				</Link>
				<Link
					to="/orders/settings"
					className={`tab tab-lg ${
						isSettingsPath ? "tab-active font-bold" : ""
					}`}>
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
