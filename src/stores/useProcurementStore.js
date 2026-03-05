// src/stores/procurementStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";

const useProcurementStore = create((set, get) => ({
	// State
	vendors: [],
	inventoryItems: [],
	activeCart: [],
	marketLists: [],
	marketListItems: {},
	loading: false,
	error: null,

	// Selected vendor filter
	selectedVendor: "all",

	// Search query
	searchQuery: "",

	// Cart drawer visibility
	isCartOpen: false,

	// Selected market list for detail view
	selectedMarketList: null,

	// Current user
	currentUser: null,

	// Fetch all vendors
	fetchVendors: async () => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("vendors")
				.select("*")
				.order("name");

			if (error) throw error;
			set({ vendors: data, error: null });
		} catch (error) {
			set({ error: error.message });
		} finally {
			set({ loading: false });
		}
	},

	// Fetch inventory items
	fetchInventoryItems: async () => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("inventory_items")
				.select(
					`
          *,
          default_vendor:default_vendor_id (
            id,
            name,
            line_id
          )
        `
				)
				.order("category", { ascending: true })
				.order("name", { ascending: true });

			if (error) throw error;
			set({ inventoryItems: data, error: null });
		} catch (error) {
			set({ error: error.message });
		} finally {
			set({ loading: false });
		}
	},

	// Fetch active cart for current user
	fetchActiveCart: async (userId) => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("active_cart")
				.select(
					`
          *,
          inventory_item:inventory_item_id (
            id,
            name,
            category,
            image_url,
            unit
          ),
          vendor:vendor_id (
            id,
            name,
            line_id
          )
        `
				)
				.eq("user_id", userId)
				.order("is_missed", { ascending: false })
				.order("added_at", { ascending: false });

			if (error) throw error;
			set({ activeCart: data, error: null });
		} catch (error) {
			set({ error: error.message });
		} finally {
			set({ loading: false });
		}
	},

	// Add to cart
	addToCart: async (item, userId) => {
		try {
			const cartItem = {
				user_id: userId,
				vendor_id: item.vendorId,
				quantity: item.quantity || 1,
				unit: item.unit,
				notes: item.notes || "",
				is_missed: item.isMissed || false,
			};

			// Handle regular inventory item vs custom item
			if (item.inventoryItemId) {
				cartItem.inventory_item_id = item.inventoryItemId;
			} else {
				cartItem.custom_item_name = item.customItemName;
			}

			const { data, error } = await supabase
				.from("active_cart")
				.insert(cartItem)
				.select(
					`
          *,
          inventory_item:inventory_item_id (
            id,
            name,
            category,
            image_url,
            unit
          ),
          vendor:vendor_id (
            id,
            name,
            line_id
          )
        `
				)
				.single();

			if (error) throw error;

			set((state) => ({
				activeCart: [data, ...state.activeCart],
			}));

			return data;
		} catch (error) {
			set({ error: error.message });
			throw error;
		}
	},

	// Update cart item
	updateCartItem: async (cartItemId, updates) => {
		try {
			const { data, error } = await supabase
				.from("active_cart")
				.update(updates)
				.eq("id", cartItemId)
				.select(
					`
          *,
          inventory_item:inventory_item_id (
            id,
            name,
            category,
            image_url,
            unit
          ),
          vendor:vendor_id (
            id,
            name,
            line_id
          )
        `
				)
				.single();

			if (error) throw error;

			set((state) => ({
				activeCart: state.activeCart.map((item) =>
					item.id === cartItemId ? data : item
				),
			}));
		} catch (error) {
			set({ error: error.message });
		}
	},

	// Remove from cart
	removeFromCart: async (cartItemId) => {
		try {
			const { error } = await supabase
				.from("active_cart")
				.delete()
				.eq("id", cartItemId);

			if (error) throw error;

			set((state) => ({
				activeCart: state.activeCart.filter((item) => item.id !== cartItemId),
			}));
		} catch (error) {
			set({ error: error.message });
		}
	},

	// Clear cart (after confirming orders)
	clearCart: async (userId) => {
		try {
			const { error } = await supabase
				.from("active_cart")
				.delete()
				.eq("user_id", userId);

			if (error) throw error;

			set({ activeCart: [] });
		} catch (error) {
			set({ error: error.message });
		}
	},

	// Create market list (confirm order)
	createMarketList: async (vendorId, items, notes = "") => {
		try {
			set({ loading: true });

			// Insert market list
			const { data: marketList, error: listError } = await supabase
				.from("market_lists")
				.insert({
					vendor_id: vendorId,
					notes,
					status: "Ordered",
				})
				.select()
				.single();

			if (listError) throw listError;

			// Insert market list items
			const marketListItems = items.map((item) => ({
				market_list_id: marketList.id,
				inventory_item_id: item.inventory_item_id || null,
				custom_item_name: item.custom_item_name || null,
				quantity: item.quantity,
				unit: item.unit,
				notes: item.notes || "",
				is_missed: false,
			}));

			const { error: itemsError } = await supabase
				.from("market_list_items")
				.insert(marketListItems);

			if (itemsError) throw itemsError;

			// Remove these items from active cart
			const cartItemIds = items.map((item) => item.cart_id).filter((id) => id);
			if (cartItemIds.length > 0) {
				await supabase.from("active_cart").delete().in("id", cartItemIds);
			}

			// Update local state
			set((state) => ({
				activeCart: state.activeCart.filter(
					(item) => !cartItemIds.includes(item.id)
				),
				marketLists: [marketList, ...state.marketLists],
			}));

			return marketList;
		} catch (error) {
			set({ error: error.message });
			throw error;
		} finally {
			set({ loading: false });
		}
	},

	// Fetch market lists (ordered)
	fetchMarketLists: async (status = "Ordered") => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("market_lists")
				.select(
					`
          *,
          vendor:vendor_id (
            id,
            name,
            line_id
          )
        `
				)
				.eq("status", status)
				.order("created_at", { ascending: false });

			if (error) throw error;

			// Fetch items for each market list
			const marketListsWithItems = await Promise.all(
				data.map(async (list) => {
					const { data: items } = await supabase
						.from("market_list_items")
						.select(
							`
              *,
              inventory_item:inventory_item_id (
                id,
                name,
                category,
                image_url,
                unit
              )
            `
						)
						.eq("market_list_id", list.id);

					return { ...list, items: items || [] };
				})
			);

			set({ marketLists: marketListsWithItems, error: null });
		} catch (error) {
			set({ error: error.message });
		} finally {
			set({ loading: false });
		}
	},

	// Fetch history (arrived/cancelled)
	fetchHistory: async () => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("market_lists")
				.select(
					`
          *,
          vendor:vendor_id (
            id,
            name,
            line_id
          )
        `
				)
				.in("status", ["Arrived", "Cancelled"])
				.order("created_at", { ascending: false })
				.limit(50);

			if (error) throw error;

			// Fetch items for each market list
			const historyWithItems = await Promise.all(
				data.map(async (list) => {
					const { data: items } = await supabase
						.from("market_list_items")
						.select(
							`
              *,
              inventory_item:inventory_item_id (
                id,
                name,
                category,
                image_url,
                unit
              )
            `
						)
						.eq("market_list_id", list.id);

					return { ...list, items: items || [] };
				})
			);

			set({ marketLists: historyWithItems, error: null });
		} catch (error) {
			set({ error: error.message });
		} finally {
			set({ loading: false });
		}
	},

	// Update market list status (Arrived with missed items)
	updateMarketListStatus: async (
		marketListId,
		status,
		receivedItems,
		missedItems,
		notes = ""
	) => {
		try {
			set({ loading: true });

			// Update market list
			const { error: listError } = await supabase
				.from("market_lists")
				.update({
					status,
					received_items: receivedItems,
					missed_items: missedItems,
					notes: notes,
				})
				.eq("id", marketListId);

			if (listError) throw listError;

			// Update individual items
			for (const item of receivedItems) {
				await supabase
					.from("market_list_items")
					.update({ is_missed: false })
					.eq("id", item.id);
			}

			for (const item of missedItems) {
				await supabase
					.from("market_list_items")
					.update({ is_missed: true })
					.eq("id", item.id);
			}

			// Add missed items back to cart
			const { data: currentUser } = await supabase.auth.getUser();
			if (currentUser?.user && missedItems.length > 0) {
				const cartItems = missedItems.map((item) => ({
					user_id: currentUser.user.id,
					inventory_item_id: item.inventory_item_id || null,
					custom_item_name: item.custom_item_name || null,
					vendor_id: item.vendor_id,
					quantity: item.quantity,
					unit: item.unit,
					notes: `Missed from order`,
					is_missed: true,
				}));

				await supabase.from("active_cart").insert(cartItems);
			}

			// Refresh data
			await get().fetchMarketLists("Ordered");
		} catch (error) {
			set({ error: error.message });
		} finally {
			set({ loading: false });
		}
	},

	// Set selected vendor filter
	setSelectedVendor: (vendor) => set({ selectedVendor: vendor }),

	// Set search query
	setSearchQuery: (query) => set({ searchQuery: query }),

	// Toggle cart drawer
	toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

	// Set selected market list
	setSelectedMarketList: (marketList) =>
		set({ selectedMarketList: marketList }),

	// Set current user
	setCurrentUser: (user) => set({ currentUser: user }),
}));

export default useProcurementStore;
