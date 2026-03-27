import { create } from "zustand";
import { persist } from "zustand/middleware";

const useOrderStore = create(
	persist(
		(set, get) => ({
			cart: [],
			orderType: "dine_in",
			customerInfo: { name: "", phone: "", address: "" },
			tableNumber: null,
			paymentMethod: "unpaid",
			discountAmount: 0,
			notes: "",
			itemNotes: {}, // { cartId: "note" }
			itemExtraPrices: {}, // { cartId: extraPrice }

			// Setters
			setOrderType: (type) => set({ orderType: type }),
			setCustomerInfo: (info) =>
				set((state) => ({
					customerInfo: typeof info === "function" ? info(state.customerInfo) : info,
				})),
			setTableNumber: (num) => set({ tableNumber: num }),
			setPaymentMethod: (method) => set({ paymentMethod: method }),
			setDiscountAmount: (amount) => set({ discountAmount: amount }),
			setNotes: (notes) => set({ notes }),

			addToCart: (menuItem, initialNote = null, initialExtraPrice = 0) => {
				const { cart, itemNotes } = get();
				
				// Find if there's an entry with the same menu ID AND NO NOTES yet
				const existingIndex = cart.findIndex(
					(item) => item.id === menuItem.id && !itemNotes[item.cart_id]
				);

				if (existingIndex !== -1) {
					const newCart = [...cart];
					newCart[existingIndex] = {
						...newCart[existingIndex],
						quantity: newCart[existingIndex].quantity + 1,
					};
					set({ cart: newCart });
				} else {
					const cart_id = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
					
					const newItemNotes = initialNote
						? { ...itemNotes, [cart_id]: initialNote }
						: itemNotes

					const newItemExtraPrices = initialExtraPrice
						? { ...get().itemExtraPrices, [cart_id]: initialExtraPrice }
						: get().itemExtraPrices

					set({
						cart: [...cart, { ...menuItem, quantity: 1, cart_id }],
						itemNotes: newItemNotes,
						itemExtraPrices: newItemExtraPrices
					})
				}
			},

			updateQuantity: (cartId, change) => {
				const { cart, itemNotes, itemExtraPrices } = get();
				const updated = cart.map((item) =>
					item.cart_id === cartId
						? { ...item, quantity: Math.max(0, item.quantity + change) }
						: item
				);
				const filtered = updated.filter((item) => item.quantity > 0);
				
				// Clean up notes and extra prices if removed
				if (filtered.length < updated.length) {
					const remainingCartIds = filtered.map(item => item.cart_id);
					const newItemNotes = { ...itemNotes };
					const newItemExtraPrices = { ...itemExtraPrices };
					
					Object.keys(newItemNotes).forEach(id => {
						if (!remainingCartIds.includes(id)) delete newItemNotes[id];
					});
					Object.keys(newItemExtraPrices).forEach(id => {
						if (!remainingCartIds.includes(id)) delete newItemExtraPrices[id];
					});
					
					set({ itemNotes: newItemNotes, itemExtraPrices: newItemExtraPrices });
				}
				
				set({ cart: filtered });
			},

			splitItem: (cartId) => {
				const { cart, itemNotes, itemExtraPrices } = get();
				const itemToSplit = cart.find((item) => item.cart_id === cartId);
				if (!itemToSplit || itemToSplit.quantity <= 1) return;

				const otherItems = cart.filter((item) => item.cart_id !== cartId);
				const newItems = [];
				const originalNote = itemNotes[cartId] || "";
				const originalExtraPrice = itemExtraPrices[cartId] || 0;

				const newItemNotes = { ...itemNotes };
				const newItemExtraPrices = { ...itemExtraPrices };
				delete newItemNotes[cartId];
				delete newItemExtraPrices[cartId];

				for (let i = 0; i < itemToSplit.quantity; i++) {
					const newCartId = `cart_${Date.now()}_split_${i}_${Math.random().toString(36).substr(2, 5)}`;
					newItems.push({ ...itemToSplit, quantity: 1, cart_id: newCartId });
					if (originalNote) newItemNotes[newCartId] = originalNote;
					if (originalExtraPrice) newItemExtraPrices[newCartId] = originalExtraPrice;
				}

				set({ cart: [...otherItems, ...newItems], itemNotes: newItemNotes, itemExtraPrices: newItemExtraPrices });
			},

			updateItemNote: (cartId, note, extraPrice = 0) => {
				set((state) => ({
					itemNotes: { ...state.itemNotes, [cartId]: note },
					itemExtraPrices: { ...state.itemExtraPrices, [cartId]: extraPrice },
				}));
			},

			clearCart: () => {
				set({
					cart: [],
					customerInfo: { name: "", phone: "", address: "" },
					tableNumber: null,
					discountAmount: 0,
					notes: "",
					itemNotes: {},
					itemExtraPrices: {},
					paymentMethod: "unpaid",
				});
			},

			// Computed values
			getSubtotal: () => {
				const { cart, itemExtraPrices } = get();
				return cart.reduce((sum, item) => {
					const extraPrice = itemExtraPrices[item.cart_id] || 0;
					return sum + (item.price + extraPrice) * item.quantity;
				}, 0);
			},
			
			getTotalAmount: () => {
				const subtotal = get().getSubtotal();
				return Math.max(0, subtotal - get().discountAmount);
			}
		}),
		{
			name: "pos-order-storage",
		}
	)
);

export default useOrderStore;
