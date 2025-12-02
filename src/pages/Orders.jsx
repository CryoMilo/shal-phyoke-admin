// pages/Orders.jsx
import { useState } from "react";
import NewOrderTab from "../components/orders/NewOrderTab";
import ActiveOrdersTab from "../components/orders/ActiveOrdersTab";
import TableSelectionModal from "../components/orders/TableSelectionModal";
import { supabase } from "../services/supabase";
import OrderHistoryTab from "../components/orders/OrderHistoryTab";

export const Orders = () => {
	const [activeTab, setActiveTab] = useState("new-order");
	const [cart, setCart] = useState([]);
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
	const [itemNotes, setItemNotes] = useState({}); // { itemId: "note" }

	// Calculate totals
	const subtotal = cart.reduce(
		(sum, item) => sum + item.price * item.quantity,
		0
	);
	const totalAmount = Math.max(0, subtotal - discountAmount);

	const addToCart = (menuItem) => {
		setCart((prev) => {
			const existing = prev.find((item) => item.id === menuItem.id);
			if (existing) {
				return prev.map((item) =>
					item.id === menuItem.id
						? { ...item, quantity: item.quantity + 1 }
						: item
				);
			}
			return [...prev, { ...menuItem, quantity: 1 }];
		});
	};

	const updateQuantity = (itemId, change) => {
		setCart((prev) => {
			const updated = prev.map((item) =>
				item.id === itemId
					? { ...item, quantity: Math.max(0, item.quantity + change) }
					: item
			);
			return updated.filter((item) => item.quantity > 0);
		});
	};

	const updateItemNote = (itemId, note) => {
		setItemNotes((prev) => ({
			...prev,
			[itemId]: note,
		}));
	};

	const clearCart = () => {
		setCart([]);
		setCustomerInfo({ name: "", phone: "", address: "" });
		setTableNumber(null);
		setDiscountAmount(0);
		setNotes("");
		setItemNotes({});
		setPaymentMethod("unpaid");
	};

	const processOrder = async () => {
		try {
			// Auto-mark as paid if cash or QR is selected
			const paymentStatus =
				paymentMethod === "cash" || paymentMethod === "qr" ? "paid" : "unpaid";

			const orderData = {
				order_type: orderType,
				customer_name: customerInfo.name || null,
				customer_phone: orderType === "delivery" ? customerInfo.phone : null, // Only for delivery
				delivery_address:
					orderType === "delivery" ? customerInfo.address : null,
				table_number: orderType === "dine_in" ? tableNumber : null,
				order_items: cart,
				subtotal,
				discount_amount: discountAmount,
				total_amount: totalAmount,
				payment_method: paymentMethod,
				payment_status: paymentStatus,
				notes: notes || null,
				item_notes: itemNotes,
			};

			// eslint-disable-next-line no-unused-vars
			const { data, error } = await supabase
				.from("orders")
				.insert([orderData])
				.select()
				.single();

			if (error) throw error;

			alert("Order created successfully!");
			clearCart();
			setActiveTab("active-orders");
		} catch (error) {
			console.error("Error creating order:", error);
			alert("Error creating order: " + error.message);
		}
	};

	return (
		<div className="min-h-screen bg-base-100">
			{/* Main Content */}
			<div className="container mx-auto p-4">
				{/* Tabs */}
				<div className="tabs tabs-boxed mb-6">
					<button
						className={`tab ${activeTab === "new-order" ? "tab-active" : ""}`}
						onClick={() => setActiveTab("new-order")}>
						New Order
					</button>
					<button
						className={`tab ${
							activeTab === "active-orders" ? "tab-active" : ""
						}`}
						onClick={() => setActiveTab("active-orders")}>
						Active Orders
					</button>
					<button
						className={`tab ${
							activeTab === "order-history" ? "tab-active" : ""
						}`}
						onClick={() => setActiveTab("order-history")}>
						Order History
					</button>
				</div>

				{/* Tab Content */}
				{activeTab === "new-order" && (
					<NewOrderTab
						cart={cart}
						orderType={orderType}
						setOrderType={setOrderType}
						customerInfo={customerInfo}
						setCustomerInfo={setCustomerInfo}
						tableNumber={tableNumber}
						setTableNumber={setTableNumber}
						showTableModal={showTableModal}
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
						clearCart={clearCart}
						processOrder={processOrder}
					/>
				)}

				{activeTab === "active-orders" && <ActiveOrdersTab />}

				{activeTab === "order-history" && <OrderHistoryTab />}

				{/* Table Selection Modal */}
				{showTableModal && (
					<TableSelectionModal
						tableNumber={tableNumber}
						setTableNumber={setTableNumber}
						onClose={() => setShowTableModal(false)}
					/>
				)}
			</div>
		</div>
	);
};

export default Orders;
