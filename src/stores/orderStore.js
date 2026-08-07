import { create } from "zustand";
import { persist } from "zustand/middleware";

const useOrderStore = create(
	persist(
		(set, get) => ({
			cart: [],
			orderType: "dine_in",
			customerInfo: { name: "", phone: "", address: "" },
			tableNumber: null,
			deliveryFee: 0,
			paymentMethod: "unpaid",
			discountAmount: 0,
			editingOrderId: null,
			editingDraftId: null,
			drafts: [],
			notes: "",
			itemNotes: {}, // { cartId: "note" }
			itemExtraPrices: {}, // { cartId: extraPrice }

			// Setters
			setOrderType: (type) => set({ orderType: type, deliveryFee: 0 }),
			setCustomerInfo: (info) =>
				set((state) => ({
					customerInfo: typeof info === "function" ? info(state.customerInfo) : info,
				})),
			setTableNumber: (num) => set({ tableNumber: num }),
			setDeliveryFee: (amount) => set({ deliveryFee: amount }),
			setPaymentMethod: (method) => set({ paymentMethod: method }),
			setDiscountAmount: (amount) => set({ discountAmount: amount }),
			setNotes: (notes) => set({ notes }),
			loadOrder: (order) => {
				set({
					editingOrderId: order.id,
					cart: order.order_items.map((item) => ({
						...item,
						cart_id: item.cart_id || `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					})),
					orderType: order.order_type || "dine_in",
					customerInfo: {
						name: order.customer_name || "",
						phone: order.customer_phone || "",
						address: order.delivery_address || "",
					},
					tableNumber: order.table_number || null,
					deliveryFee: order.delivery_fee || 0,
					paymentMethod: order.payment_method || "unpaid",
					discountAmount: order.discount_amount || 0,
					notes: order.notes || "",
					itemNotes: order.item_notes || {},
					itemExtraPrices: order.item_extra_prices || {},
				});
			},
			saveCurrentToDraft: () => {
				const {
					cart,
					orderType,
					customerInfo,
					tableNumber,
					deliveryFee,
					discountAmount,
					notes,
					itemNotes,
					itemExtraPrices,
					drafts,
					editingDraftId,
				} = get();

				if (cart.length === 0) return;

				const draftData = {
					cart,
					orderType,
					customerInfo,
					tableNumber,
					deliveryFee,
					discountAmount,
					notes,
					itemNotes,
					itemExtraPrices,
					updated_at: new Date().toISOString(),
				};

				if (editingDraftId) {
					set({
						drafts: drafts.map((d) =>
							d.id === editingDraftId ? { ...d, ...draftData } : d
						),
					});
				} else {
					const newDraft = {
						id: `draft_${Date.now()}`,
						created_at: new Date().toISOString(),
						...draftData,
					};
					set({
						drafts: [newDraft, ...drafts],
					});
				}
				get().clearCart();
			},
			loadDraft: (draft) => {
				set({
					editingDraftId: draft.id,
					cart: draft.cart,
					orderType: draft.orderType,
					customerInfo: draft.customerInfo,
					tableNumber: draft.tableNumber,
					deliveryFee: draft.deliveryFee,
					discountAmount: draft.discountAmount,
					notes: draft.notes,
					itemNotes: draft.itemNotes,
					itemExtraPrices: draft.itemExtraPrices,
				});
			},
			deleteDraft: (draftId) => {
				set({
					drafts: get().drafts.filter((d) => d.id !== draftId),
				});
			},

			addToCart: (menuItem, initialNote = null, initialExtraPrice = 0, initialQuantity = 1) => {
				const { cart, itemNotes } = get();
				
				// Find if there's an entry with the same menu ID AND NO NOTES yet
				const existingIndex = cart.findIndex(
					(item) => item.id === menuItem.id && !itemNotes[item.cart_id]
				);

				if (existingIndex !== -1) {
					const newCart = [...cart];
					newCart[existingIndex] = {
						...newCart[existingIndex],
						quantity: newCart[existingIndex].quantity + initialQuantity,
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
						cart: [...cart, { ...menuItem, quantity: initialQuantity, cart_id }],
						itemNotes: newItemNotes,
						itemExtraPrices: newItemExtraPrices
					})
				}
			},

			updateQuantity: (cartId, change) => {
				const { cart, itemNotes, itemExtraPrices } = get();
				
				const item = cart.find(i => i.cart_id === cartId);
				if (!item) return;

				let newQuantity = Math.max(0, item.quantity + change);

				// Enforce max quantity limit if effective_available_stock > 0
				if (item.effective_available_stock !== undefined && item.effective_available_stock > 0 && change > 0) {
					const totalInCartForThisItem = cart
						.filter(c => c.id === item.id)
						.reduce((sum, c) => sum + c.quantity, 0);
					
					if (totalInCartForThisItem >= item.effective_available_stock) {
						import("../utils/toastUtils").then(({ showToast }) => {
							showToast.error(`Cannot exceed available stock limit (${item.effective_available_stock} max).`);
						});
						return; // Prevent incrementing
					}
				}

				const updated = cart.map((c) =>
					c.cart_id === cartId
						? { ...c, quantity: newQuantity }
						: c
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
					deliveryFee: 0,
					discountAmount: 0,
					notes: "",
					itemNotes: {},
					itemExtraPrices: {},
					paymentMethod: "unpaid",
					editingOrderId: null,
					editingDraftId: null,
				});
			},

			clampCartQuantities: (menuItemsWithStock) => {
				const { cart } = get();
				if (cart.length === 0) return;

				let needsUpdate = false;
				const updatedCart = cart.map(cartItem => {
					const masterItem = menuItemsWithStock.find(m => m.id === cartItem.id);
					if (!masterItem) return cartItem;
					
					const stock = masterItem.effective_available_stock;
					if (stock !== undefined && stock !== -1 && stock !== null && stock >= 0) {
						// Wait, this item might be in the cart multiple times (different notes).
						// We need to count the total.
						// To be simple, we just cap each line item to `stock` if it exceeds it.
						// The full validation is at checkout. For now, we just clamp if a single line item exceeds the total stock.
						if (cartItem.quantity > stock) {
							needsUpdate = true;
							import("../utils/toastUtils").then(({ showToast }) => {
								showToast.error(`Stock reduced for ${cartItem.name_english || cartItem.name_burmese}. Clamped to ${stock}.`);
							});
							return { ...cartItem, quantity: stock };
						}
					}
					return cartItem;
				}).filter(item => item.quantity > 0);

				if (needsUpdate || updatedCart.length !== cart.length) {
					set({ cart: updatedCart });
				}
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
				const { deliveryFee, discountAmount } = get();
				const subtotal = get().getSubtotal();
				return Math.max(0, subtotal + (deliveryFee || 0) - (discountAmount || 0));
			}
		}),
		{
			name: "pos-order-storage",
		}
	)
);

export default useOrderStore;
