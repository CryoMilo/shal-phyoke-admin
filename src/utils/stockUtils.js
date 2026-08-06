import { supabase } from "../services/supabase";

/**
 * Deducts stock quantity for ordered items and selected add-ons.
 * If stock quantity drops to 0, automatically updates is_active to false (out of stock).
 * Items with stock_quantity = -1 (unlimited) are bypassed.
 * 
 * @param {Array} cart - Array of cart items from orderStore
 * @param {Object} itemNotes - Map of cart_id -> note string
 * @param {Array} allMenuItems - Master list of all menu items from menuStore
 */
export const deductStockForOrder = async (cart, itemNotes = {}, allMenuItems = []) => {
	if (!cart || cart.length === 0) return;

	// Map to accumulate stock deductions by menu_item id
	const deductionMap = {}; // { menuItemId: totalQuantityToDeduct }

	// Helper to add deduction
	const addDeduction = (id, qty) => {
		if (!id) return;
		deductionMap[id] = (deductionMap[id] || 0) + qty;
	};

	// 1. Accumulate main cart items
	cart.forEach((cartItem) => {
		const qty = cartItem.quantity || 1;
		addDeduction(cartItem.id, qty);

		// 2. Accumulate add-ons / extras attached to this item
		const note = itemNotes[cartItem.cart_id];
		if (note && cartItem.available_extras && cartItem.available_extras.length > 0) {
			const noteParts = note.split(",").map((s) => s.trim());
			cartItem.available_extras.forEach((extra) => {
				const toppingName = extra.name_burmese || extra.name_english;
				if (toppingName && noteParts.includes(toppingName)) {
					// Extra target item ID is extra.extra_item_id or extra.extra_item?.id
					const extraItemId = extra.extra_item_id || extra.extra_item?.id;
					if (extraItemId) {
						addDeduction(extraItemId, qty);
					}
				}
			});
		}
	});

	const itemIds = Object.keys(deductionMap);
	if (itemIds.length === 0) return;

	// 3. Fetch current stock_quantity and is_active from database for these items
	const { data: dbItems, error: fetchError } = await supabase
		.from("menu_items")
		.select("id, stock_quantity, is_active")
		.in("id", itemIds);

	if (fetchError) {
		console.error("Error fetching stock for deduction:", fetchError);
		return;
	}

	// 4. Perform stock deduction for items with defined stock (stock_quantity !== -1)
	const updatePromises = dbItems.map(async (item) => {
		if (item.stock_quantity === -1 || item.stock_quantity === null || item.stock_quantity === undefined) {
			return; // Unlimited stock
		}

		const qtyToDeduct = deductionMap[item.id] || 0;
		const newStock = Math.max(0, item.stock_quantity - qtyToDeduct);
		const newIsActive = newStock > 0 ? item.is_active : false;

		const { error: updateError } = await supabase
			.from("menu_items")
			.update({
				stock_quantity: newStock,
				is_active: newIsActive,
			})
			.eq("id", item.id);

		if (updateError) {
			console.error(`Error updating stock for menu item ${item.id}:`, updateError);
		}
	});

	await Promise.all(updatePromises);
};
