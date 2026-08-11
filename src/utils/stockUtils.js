import { supabase } from "../services/supabase";

/**
 * Deducts stock quantity for ordered items and selected add-ons.
 * Bypassed/No-op.
 */
export const deductStockForOrder = async (cart, itemNotes = {}, allMenuItems = []) => {
	// Stock deduction is disabled
	return;
};

/**
 * Restores stock quantity for items and add-ons from a cancelled/refunded order.
 * Bypassed/No-op.
 */
export const restoreStockForOrder = async (order) => {
	// Stock restoration is disabled
	return;
};

/**
 * Checks whether an add-on extra option is available.
 *
 * @param {Object} extra - Extra object from item.available_extras
 * @returns {boolean} - True if extra item is active
 */
export const isAddonAvailable = (extra) => {
	if (!extra) return false;
	if (extra.extra_item && extra.extra_item.is_active === false) return false;
	return true;
};

/**
 * Computes availability of a base menu item.
 *
 * @param {Object} item - Menu item object with available_extras
 * @returns {boolean} - True if item is active and can be ordered
 */
export const isBaseItemAvailable = (item) => {
	if (!item) return false;
	if (!item.is_active) return false;

	const hasExtras = Array.isArray(item.available_extras) && item.available_extras.length > 0;

	// If add-on selection is mandatory (requires_addon === true) and item has linked extras
	if (item.requires_addon && hasExtras) {
		const hasAvailableAddon = item.available_extras.some((extra) => isAddonAvailable(extra));
		if (!hasAvailableAddon) {
			return false; // All mandatory add-on choices are inactive
		}
	}

	return true;
};
