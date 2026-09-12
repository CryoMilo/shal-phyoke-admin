import { describe, it, expect, beforeEach } from "vitest";
import useOrderStore from "../orderStore";

describe("orderStore.js - POS Cart and Order Lifecycle", () => {
	beforeEach(() => {
		useOrderStore.getState().clearCart();
		useOrderStore.setState({ drafts: [], isNightMode: false });
	});

	it("adds items to cart and increments quantity for duplicate items without extras", () => {
		const item = { id: "menu-1", name_burmese: "ကြက်ကြော်", price: 100 };

		useOrderStore.getState().addToCart(item);
		let cart = useOrderStore.getState().cart;
		expect(cart.length).toBe(1);
		expect(cart[0].quantity).toBe(1);

		useOrderStore.getState().addToCart(item);
		cart = useOrderStore.getState().cart;
		expect(cart.length).toBe(1);
		expect(cart[0].quantity).toBe(2);
	});

	it("removes item when quantity is decremented to 0 via change = -1", () => {
		const item = { id: "menu-2", name_burmese: "လက်ဖက်ရည်", price: 40 };
		useOrderStore.getState().addToCart(item);

		const cartId = useOrderStore.getState().cart[0].cart_id;
		expect(useOrderStore.getState().cart.length).toBe(1);

		// updateQuantity expects a delta (+1 or -1)
		useOrderStore.getState().updateQuantity(cartId, -1);
		expect(useOrderStore.getState().cart.length).toBe(0);
	});

	it("correctly splits multi-quantity items into separate single-quantity items with preserved notes", () => {
		const item = { id: "menu-3", name_burmese: "ခေါက်ဆွဲကြော်", price: 80 };
		useOrderStore.getState().addToCart(item);

		// Added with qty 1; add delta of +2 to reach qty 3
		const cartId = useOrderStore.getState().cart[0].cart_id;
		useOrderStore.getState().updateQuantity(cartId, 2);
		expect(useOrderStore.getState().cart[0].quantity).toBe(3);

		useOrderStore.getState().updateItemNote(cartId, "ကြက်သွန်နီ မထည့်", 15);

		// Split the item
		useOrderStore.getState().splitItem(cartId);

		const cart = useOrderStore.getState().cart;
		const itemNotes = useOrderStore.getState().itemNotes;
		const itemExtraPrices = useOrderStore.getState().itemExtraPrices;

		expect(cart.length).toBe(3);
		cart.forEach((lineItem) => {
			expect(lineItem.quantity).toBe(1);
			expect(lineItem.id).toBe("menu-3");
			expect(itemNotes[lineItem.cart_id]).toBe("ကြက်သွန်နီ မထည့်");
			expect(itemExtraPrices[lineItem.cart_id]).toBe(15);
		});
	});

	it("calculates subtotal and total amount with extra prices, delivery fee, and discount", () => {
		const item1 = { id: "m-1", price: 100 };
		const item2 = { id: "m-2", price: 50 };

		useOrderStore.getState().addToCart(item1);
		useOrderStore.getState().addToCart(item2);

		const cart = useOrderStore.getState().cart;
		const cart1 = cart.find((i) => i.id === "m-1").cart_id;

		// Add extra 20 to item 1
		useOrderStore.getState().updateItemNote(cart1, "Extra Egg", 20);

		// Subtotal = (100 + 20) * 1 + (50 + 0) * 1 = 170
		expect(useOrderStore.getState().getSubtotal()).toBe(170);

		// Apply delivery fee of 30 and discount of 15
		useOrderStore.getState().setDeliveryFee(30);
		useOrderStore.getState().setDiscountAmount(15);

		// Total = 170 + 30 - 15 = 185
		expect(useOrderStore.getState().getTotalAmount()).toBe(185);
	});

	it("supports saving to draft and loading draft back into active cart", () => {
		const item = { id: "m-draft", name_burmese: "ဝက်သားကြော်", price: 120 };
		useOrderStore.getState().addToCart(item);
		useOrderStore.getState().setTableNumber(5);

		useOrderStore.getState().saveCurrentToDraft();
		expect(useOrderStore.getState().cart.length).toBe(0); // Cart is cleared after saving draft
		expect(useOrderStore.getState().drafts.length).toBe(1);

		// Load draft back
		const savedDraft = useOrderStore.getState().drafts[0];
		useOrderStore.getState().loadDraft(savedDraft);

		expect(useOrderStore.getState().cart.length).toBe(1);
		expect(useOrderStore.getState().cart[0].id).toBe("m-draft");
		expect(useOrderStore.getState().tableNumber).toBe(5);
	});

	it("updates general order notes via setNotes", () => {
		expect(useOrderStore.getState().notes).toBe("");
		useOrderStore.getState().setNotes("Please pack chili sauce separately");
		expect(useOrderStore.getState().notes).toBe("Please pack chili sauce separately");
	});
});
