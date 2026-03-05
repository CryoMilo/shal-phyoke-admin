// src/stores/procurementStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";

const useProcurementStore = create((set, get) => ({
	// State
	vendors: [],
	inventoryItems: [],
	activeCart: [],
	marketLists: [],
	loading: false,
	error: null,

	// UI states
	isCartOpen: false,
	selectedVendor: "all",
	searchQuery: "",
	activeTab: "market-list", // 'market-list' or 'history'

	// Current user (for cart)
	currentUser: null,

	// Fetch all vendors
	fetchVendors: async () => {
		try {
			const { data, error } = await supabase
				.from("vendors")
				.select("*")
				.order("name");

			if (error) throw error;
			set({ vendors: data || [] });
		} catch (error) {
			console.error("Error fetching vendors:", error);
		}
	},

	// Fetch inventory items
	fetchInventoryItems: async () => {
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
				.order("category")
				.order("name");

			if (error) throw error;
			set({ inventoryItems: data || [] });
		} catch (error) {
			console.error("Error fetching inventory items:", error);
		}
	},

	// Fetch active cart for current user
	fetchActiveCart: async (userId) => {
		if (!userId) return;

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
			set({ activeCart: data || [] });
		} catch (error) {
			console.error("Error fetching active cart:", error);
		}
	},

	// Add to cart
	addToCart: async (item, userId) => {
		if (!userId) return { error: "No user logged in" };

		try {
			const cartItem = {
				user_id: userId,
				vendor_id: item.vendorId,
				quantity: item.quantity || 1,
				unit: item.unit,
				notes: item.notes || "",
				is_missed: item.isMissed || false,
			};

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

			return { success: true, data };
		} catch (error) {
			console.error("Error adding to cart:", error);
			return { error: error.message };
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

			return { success: true };
		} catch (error) {
			console.error("Error updating cart item:", error);
			return { error: error.message };
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

			return { success: true };
		} catch (error) {
			console.error("Error removing from cart:", error);
			return { error: error.message };
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

			return { success: true, data: marketList };
		} catch (error) {
			console.error("Error creating market list:", error);
			return { error: error.message };
		} finally {
			set({ loading: false });
		}
	},

	// Fetch market lists (ordered)
	fetchMarketLists: async (status = "Ordered") => {
		try {
			set({ loading: true });

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
				(data || []).map(async (list) => {
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
			console.error("Error fetching market lists:", error);
			set({ error: error.message });
		} finally {
			set({ loading: false });
		}
	},

	// Fetch history (arrived/cancelled)
	fetchHistory: async () => {
		try {
			set({ loading: true });

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
				(data || []).map(async (list) => {
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
			console.error("Error fetching history:", error);
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
			const currentUser = get().currentUser;
			if (currentUser?.id && missedItems.length > 0) {
				const cartItems = missedItems.map((item) => ({
					user_id: currentUser.id,
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
			console.error("Error updating market list status:", error);
			return { error: error.message };
		} finally {
			set({ loading: false });
		}
	},

	// Clear cart
	clearCart: async (userId) => {
		try {
			const { error } = await supabase
				.from("active_cart")
				.delete()
				.eq("user_id", userId);

			if (error) throw error;

			set({ activeCart: [] });
			return { success: true };
		} catch (error) {
			console.error("Error clearing cart:", error);
			return { error: error.message };
		}
	},

	// UI Actions
	toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
	setSelectedVendor: (vendor) => set({ selectedVendor: vendor }),
	setSearchQuery: (query) => set({ searchQuery: query }),
	setActiveTab: (tab) => set({ activeTab: tab }),
	setCurrentUser: (user) => set({ currentUser: user }),

	// Reset filters
	resetFilters: () =>
		set({
			selectedVendor: "all",
			searchQuery: "",
		}),

	// Get filtered inventory items by vendor
	getItemsByVendor: (vendorId) => {
		const items = get().inventoryItems;
		const { searchQuery } = get();

		console.log("getItemsByVendor called:", {
			vendorId,
			totalItems: items.length,
			searchQuery,
			items: items.map((i) => ({
				name: i.name,
				vendorId: i.default_vendor_id,
			})),
		});

		// If vendorId is 'all', show all items
		if (vendorId === "all") {
			return items.filter((item) => {
				const matchesSearch =
					searchQuery === "" ||
					item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.category?.toLowerCase().includes(searchQuery.toLowerCase());
				return matchesSearch;
			});
		}

		// Otherwise filter by vendor
		return items.filter((item) => {
			const matchesVendor = item.default_vendor_id === vendorId;
			const matchesSearch =
				searchQuery === "" ||
				item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.category?.toLowerCase().includes(searchQuery.toLowerCase());

			return matchesVendor && matchesSearch;
		});
	},

	// Get cart items grouped by vendor
	getCartByVendor: () => {
		const cart = get().activeCart;

		return cart.reduce((acc, item) => {
			const vendorId = item.vendor?.id;
			if (!acc[vendorId]) {
				acc[vendorId] = {
					vendor: item.vendor,
					items: [],
				};
			}
			acc[vendorId].items.push(item);
			return acc;
		}, {});
	},

	// Get live orders
	getLiveOrders: () => {
		return get().marketLists.filter((list) => list.status === "Ordered");
	},
}));

export default useProcurementStore;
