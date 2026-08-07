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

/**
 * Restores stock quantity for items and add-ons from a cancelled/refunded order.
 * If stock quantity increases above 0, automatically sets is_active to true (restoring item to active).
 * Items with stock_quantity = -1 (unlimited) are bypassed.
 * 
 * @param {Object} order - Order object containing order_items, item_notes, etc.
 */
export const restoreStockForOrder = async (order) => {
	if (!order || !order.order_items || order.order_items.length === 0) return;

	const cart = order.order_items;
	const itemNotes = order.item_notes || {};

	// Map to accumulate stock additions by menu_item id
	const additionMap = {}; // { menuItemId: totalQuantityToRestore }

	const addAddition = (id, qty) => {
		if (!id) return;
		additionMap[id] = (additionMap[id] || 0) + qty;
	};

	// 1. Accumulate main order items
	cart.forEach((cartItem) => {
		const qty = cartItem.quantity || 1;
		const itemId = cartItem.id || cartItem.menu_item_id;
		addAddition(itemId, qty);

		// 2. Accumulate add-ons / extras attached to this item
		const note = itemNotes[cartItem.cart_id];
		if (note && cartItem.available_extras && cartItem.available_extras.length > 0) {
			const noteParts = note.split(",").map((s) => s.trim());
			cartItem.available_extras.forEach((extra) => {
				const toppingName = extra.name_burmese || extra.name_english;
				if (toppingName && noteParts.includes(toppingName)) {
					const extraItemId = extra.extra_item_id || extra.extra_item?.id;
					if (extraItemId) {
						addAddition(extraItemId, qty);
					}
				}
			});
		}
	});

	const itemIds = Object.keys(additionMap);
	if (itemIds.length === 0) return;

	// 3. Fetch current stock_quantity and is_active from database
	const { data: dbItems, error: fetchError } = await supabase
		.from("menu_items")
		.select("id, stock_quantity, is_active")
		.in("id", itemIds);

	if (fetchError) {
		console.error("Error fetching stock for restoration:", fetchError);
		return;
	}

	// 4. Restore stock and set is_active = true if stock > 0
	const updatePromises = dbItems.map(async (item) => {
		if (item.stock_quantity === -1 || item.stock_quantity === null || item.stock_quantity === undefined) {
			return; // Unlimited stock
		}

		const qtyToRestore = additionMap[item.id] || 0;
		const newStock = item.stock_quantity + qtyToRestore;
		// Re-activate item if new stock > 0
		const newIsActive = newStock > 0 ? true : item.is_active;

		const { error: updateError } = await supabase
			.from("menu_items")
			.update({
				stock_quantity: newStock,
				is_active: newIsActive,
			})
			.eq("id", item.id);

		if (updateError) {
			console.error(`Error restoring stock for menu item ${item.id}:`, updateError);
		}
	});

	await Promise.all(updatePromises);
};

/**
 * Checks whether an add-on extra option is available (in-stock).
 *
 * @param {Object} extra - Extra object from item.available_extras
 * @returns {boolean} - True if stock > 0 or -1 (unlimited) or stock is undefined
 */
export const isAddonAvailable = (extra) => {
	if (!extra) return false;
	
	if (extra.effective_available_stock !== undefined) {
		if (extra.effective_available_stock === 0) return false;
	} else if (extra.extra_item) {
		if (extra.extra_item.is_active === false) return false;
		if (extra.extra_item.stock_quantity === 0) return false;
	}
	return true;
};

/**
 * Computes availability of a base menu item.
 * Rule:
 * 1. If base item is_active is false, return false (out of stock / inactive).
 * 2. If base item stock_quantity === 0 (or effective_available_stock === 0), return false.
 * 3. If base item requires add-on selection (`requires_addon === true`)
 *    AND all linked extras are out of stock (`stock_quantity === 0`), return false (SOLD OUT).
 *
 * @param {Object} item - Menu item object with available_extras
 * @returns {boolean} - True if item can be ordered
 */
export const isBaseItemAvailable = (item) => {
	if (!item) return false;
	if (!item.is_active) return false;
	
	if (item.effective_available_stock !== undefined) {
		if (item.effective_available_stock === 0) return false;
	} else if (item.stock_quantity === 0) {
		return false;
	}

	const hasExtras = Array.isArray(item.available_extras) && item.available_extras.length > 0;

	// If add-on selection is mandatory (requires_addon === true) and item has linked extras
	if (item.requires_addon && hasExtras) {
		const hasAvailableAddon = item.available_extras.some((extra) => isAddonAvailable(extra));
		if (!hasAvailableAddon) {
			return false; // All mandatory add-on choices are sold out
		}
	}

	return true;
};
