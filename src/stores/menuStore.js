// stores/menuStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const useMenuStore = create(
	persist(
		(set, get) => ({
			// State
			allMenuItems: [],
			loading: false,
			searchQuery: "",
			activeCategory: "all",
			showActiveOnly: true,
			filteredMenus: [],
			showRegularOnly: false,
			// state for menu item extras
			menuItemExtras: [],
			loadingExtras: false,

			// ===== SETTERS =====
			setAllMenuItems: (items) => set({ allMenuItems: items }),
			setLoading: (loading) => set({ loading }),

			setSearchQuery: (query) => {
				set({ searchQuery: query });
				get().applyFilters();
			},

			setActiveCategory: (category) => {
				set({ activeCategory: category });
				get().applyFilters();
			},

			setShowActiveOnly: (showActiveOnly) => {
				set({ showActiveOnly });
				get().applyFilters();
			},

			setShowRegularOnly: (showRegularOnly) => {
				set({ showRegularOnly });
				get().applyFilters();
			},

			// ===== FILTERS =====
			applyFilters: () => {
				const {
					allMenuItems,
					searchQuery,
					activeCategory,
					showActiveOnly,
					showRegularOnly,
				} = get();

				let filtered = allMenuItems;

				// Apply search filter
				if (searchQuery.trim()) {
					const query = searchQuery.toLowerCase();
					filtered = filtered.filter(
						(menu) =>
							menu.name_english?.toLowerCase().includes(query) ||
							menu.name_burmese?.toLowerCase().includes(query) ||
							menu.name_thai?.toLowerCase().includes(query) ||
							menu.description?.toLowerCase().includes(query)
					);
				}

				// Apply category filter
				if (activeCategory !== "all") {
					filtered = filtered.filter(
						(menu) => menu.category === activeCategory
					);
				}

				// Apply regular/rotating filter
				if (showRegularOnly) {
					filtered = filtered.filter((menu) => menu.is_regular);
				}

				// Apply active status filter
				if (showActiveOnly) {
					filtered = filtered.filter((menu) => menu.is_active);
				}

				set({ filteredMenus: filtered });
			},

			// Quick filter helpers
			showOnlyRegularItems: () => {
				set({
					showRegularOnly: true,
					activeCategory: "all",
				});
				get().applyFilters();
			},

			showOnlyRotatingItems: () => {
				set({
					showRegularOnly: false,
					activeCategory: "all",
				});
				get().applyFilters();
			},

			resetFilters: () => {
				set({
					searchQuery: "",
					activeCategory: "all",
					showActiveOnly: true,
					showRegularOnly: false,
					filteredMenus: get().allMenuItems,
				});
			},

			// ===== GETTERS =====
			getAllRegularItems: () => {
				const state = get();
				return state.allMenuItems.filter(
					(item) => item.is_regular && item.is_active
				);
			},

			getAllRotatingItems: () => {
				const state = get();
				return state.allMenuItems.filter(
					(item) => !item.is_regular && item.is_active
				);
			},

			getActiveFixedCombos: () => {
				return get().allMenuItems.filter(
					(item) =>
						item.is_combo === true &&
						item.combo_type === "fixed" &&
						item.is_active === true
				);
			},

			getActiveRotatingCombos: () => {
				return get().allMenuItems.filter(
					(item) =>
						item.is_combo === true &&
						item.combo_type === "rotating" &&
						item.is_active === true
				);
			},

			getItemsByCategory: (category) => {
				const state = get();
				return state.allMenuItems.filter(
					(item) => item.category === category && item.is_active
				);
			},

			getRegularItemsByCategory: (category) => {
				const state = get();
				return state.allMenuItems.filter(
					(item) =>
						item.is_regular && item.category === category && item.is_active
				);
			},

			getRotatingItemsByCategory: (category) => {
				const state = get();
				return state.allMenuItems.filter(
					(item) =>
						!item.is_regular && item.category === category && item.is_active
				);
			},

			// Get unique categories (with type info)
			getAllCategories: () => {
				const state = get();
				const categories = [
					...new Set(state.allMenuItems.map((item) => item.category)),
				];
				return categories.sort();
			},

			getRegularCategories: () => {
				const state = get();
				const categories = [
					...new Set(
						state.allMenuItems
							.filter((item) => item.is_regular)
							.map((item) => item.category)
					),
				];
				return categories.sort();
			},

			getRotatingCategories: () => {
				const state = get();
				const categories = [
					...new Set(
						state.allMenuItems
							.filter((item) => !item.is_regular)
							.map((item) => item.category)
					),
				];
				return categories.sort();
			},

			// ===== CRUD OPERATIONS =====
			addMenuItem: (menu) => {
				set((state) => ({
					allMenuItems: [...state.allMenuItems, menu],
					filteredMenus: [...state.filteredMenus, menu],
				}));
			},

			updateMenuItem: (id, updatedMenu) => {
				set((state) => {
					const updatedMenus = state.allMenuItems.map((menu) =>
						menu.id === id ? { ...menu, ...updatedMenu } : menu
					);

					return {
						allMenuItems: updatedMenus,
						filteredMenus: updatedMenus,
					};
				});
				get().applyFilters();
			},

			deleteMenuItem: (id) => {
				set((state) => ({
					allMenuItems: state.allMenuItems.filter((menu) => menu.id !== id),
					filteredMenus: state.filteredMenus.filter((menu) => menu.id !== id),
				}));
			},

			// In menuStore.js
			fetchAllMenuItems: async () => {
				set({ loading: true });
				try {
					// First, fetch all menu items
					const { data: menuItems, error: menuError } = await supabase
						.from("menu_items")
						.select("*")
						.order("is_regular", { ascending: false })
						.order("category")
						.order("name_burmese");

					if (menuError) throw menuError;

					// Then, fetch all menu item extras
					const { data: extras, error: extrasError } = await supabase
						.from("menu_item_extras")
						.select(
							`
        *,
        extra_item:extra_item_id(
          id,
          name_burmese,
          name_english,
          price,
          category,
          is_active
        )
      `
						)
						.eq("is_active", true);

					if (extrasError) throw extrasError;

					// Group extras by menu_item_id, filtering out extras where the item itself is inactive
					const extrasByMenuItem = (extras || []).reduce((acc, extra) => {
						if (extra.extra_item && extra.extra_item.is_active) {
							if (!acc[extra.menu_item_id]) {
								acc[extra.menu_item_id] = [];
							}
							acc[extra.menu_item_id].push({
								...extra,
								// Flatten for easier access in UI if needed, but keeping original structure too
								name_burmese: extra.extra_item.name_burmese,
								name_english: extra.extra_item.name_english,
							});
						}
						return acc;
					}, {});

					// Attach extras to menu items
					const menuItemsWithExtras = (menuItems || []).map((item) => ({
						...item,
						available_extras: extrasByMenuItem[item.id] || [],
					}));

					set({
						allMenuItems: menuItemsWithExtras,
						filteredMenus: menuItemsWithExtras,
						loading: false,
					});
				} catch (error) {
					console.error("Error fetching menus:", error);
					showToast.error("Failed to load menu items");
					set({ loading: false });
				}
			},

			fetchRegularMenuItems: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.eq("is_regular", true)
						.order("category")
						.order("name_burmese");

					if (error) throw error;

					set({
						allMenuItems: data || [],
						filteredMenus: data || [],
						loading: false,
					});
				} catch (error) {
					console.error("Error fetching regular menus:", error);
					showToast.error("Failed to load regular menu items");
					set({ loading: false });
				}
			},

			fetchRotatingMenuItems: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.eq("is_regular", false)
						.order("category")
						.order("name_burmese");

					if (error) throw error;

					set({
						allMenuItems: data || [],
						filteredMenus: data || [],
						loading: false,
					});
				} catch (error) {
					console.error("Error fetching rotating menus:", error);
					showToast.error("Failed to load rotating menu items");
					set({ loading: false });
				}
			},

			fetchMenuItemById: async (id) => {
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.eq("id", id)
						.maybeSingle();

					if (error) throw error;
					return { data, error: null };
				} catch (error) {
					console.error("Error fetching menu by id:", error);
					showToast.error("Failed to fetch menu item details");
					return { data: null, error };
				}
			},

			createMenuItem: async (menuData) => {
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.insert([menuData])
						.select()
						.maybeSingle();

					if (error) throw error;

					if (data) {
						get().addMenuItem(data);
					}
					showToast.success("Menu item created successfully");
					return { data, error: null };
				} catch (error) {
					console.error("Error creating menu:", error);
					showToast.error("Failed to create menu item");
					return { data: null, error };
				}
			},

			updateMenuItemById: async (id, menuData) => {
				try {
					// First, check if the item exists
					const { data: existingItem, error: checkError } = await supabase
						.from("menu_items")
						.select("id")
						.eq("id", id)
						.maybeSingle();

					if (checkError) throw checkError;

					if (!existingItem) {
						showToast.error("Menu item not found");
						return { data: null, error: new Error("Menu item not found") };
					}

					// Perform the update
					const { data, error } = await supabase
						.from("menu_items")
						.update(menuData)
						.eq("id", id)
						.select(); // Remove .maybeSingle() to get array

					if (error) throw error;

					// Check if we got data back
					if (!data || data.length === 0) {
						// If no data returned, fetch the updated item separately
						const { data: refreshedData, error: refreshError } = await supabase
							.from("menu_items")
							.select("*")
							.eq("id", id)
							.single();

						if (refreshError) throw refreshError;

						get().updateMenuItem(id, refreshedData);
						showToast.success("Menu item updated successfully");
						return { data: refreshedData, error: null };
					}

					// Use the first item from the returned array
					const updatedItem = data[0];
					get().updateMenuItem(id, updatedItem);
					showToast.success("Menu item updated successfully");
					return { data: updatedItem, error: null };
				} catch (error) {
					console.error("Error updating menu:", error);
					showToast.error("Failed to update menu item");
					return { data: null, error };
				}
			},

			deleteMenuItemById: async (id) => {
				try {
					const { error } = await supabase
						.from("menu_items")
						.delete()
						.eq("id", id);

					if (error) throw error;

					get().deleteMenuItem(id);
					return { error: null };
				} catch (error) {
					console.error("Error deleting menu:", error);
					return { error };
				}
			},

			toggleMenuStatus: async (id) => {
				try {
					const menu = get().allMenuItems.find((m) => m.id === id);
					if (!menu) throw new Error("Menu not found");

					const newStatus = !menu.is_active;
					const { error } = await supabase
						.from("menu_items")
						.update({ is_active: newStatus })
						.eq("id", id);

					if (error) throw error;

					get().updateMenuItem(id, { is_active: newStatus });
					showToast.success(
						`Menu item is now ${newStatus ? "active" : "inactive"}`
					);
					return { success: true };
				} catch (error) {
					console.error("Error toggling menu status:", error);
					return { success: false, error };
				}
			},

			// For compatibility with existing code
			getMenusByCategory: (category) => {
				return get().getItemsByCategory(category);
			},

			fetchMenus: async () => {
				return get().fetchAllMenuItems();
			},

			fetchMenusByCategory: async (category) => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("menu_items")
						.select("*")
						.eq("category", category)
						.order("name_burmese");

					if (error) throw error;

					// Update state with these items
					const state = get();
					const otherItems = state.allMenuItems.filter(
						(item) => item.category !== category
					);
					set({
						allMenuItems: [...otherItems, ...(data || [])],
						loading: false,
					});

					return { data, error: null };
				} catch (error) {
					console.error(`Error fetching ${category} menus:`, error);
					showToast.error(`Failed to load ${category} items`);
					set({ loading: false });
					return { data: null, error };
				}
			},

			fetchMenuItemExtras: async (menuItemId) => {
				set({ loadingExtras: true });
				try {
					const { data, error } = await supabase
						.from("menu_item_extras")
						.select(
							`
							*,
							extra_item:extra_item_id (
								id,
								name_burmese,
								name_english,
								price,
								category,
								is_active
							)
						`
						)
						.eq("menu_item_id", menuItemId)
						.eq("is_active", true)
						.order("sort_order");

					if (error) throw error;

					// Filter out inactive items and flatten
					const filteredData = (data || [])
						.filter((extra) => extra.extra_item && extra.extra_item.is_active)
						.map((extra) => ({
							...extra,
							name_burmese: extra.extra_item.name_burmese,
							name_english: extra.extra_item.name_english,
						}));

					set({ menuItemExtras: filteredData });
					return filteredData;
				} catch (error) {
					console.error("Error fetching menu item extras:", error);
					showToast.error("Failed to load extras");
					return []; // Return empty array on error
				} finally {
					set({ loadingExtras: false });
				}
			},

			// Add extra to menu item
			addMenuItemExtra: async (extraData) => {
				try {
					const { data, error } = await supabase
						.from("menu_item_extras")
						.insert([extraData])
						.select()
						.single();

					if (error) throw error;

					// Refresh the list
					await get().fetchMenuItemExtras(extraData.menu_item_id);
					showToast.success("Extra added successfully");

					return data;
				} catch (error) {
					console.error("Error adding menu item extra:", error);
					showToast.error("Failed to add extra");
				}
			},

			// Update menu item extra
			updateMenuItemExtra: async (id, updates) => {
				try {
					const { error } = await supabase
						.from("menu_item_extras")
						.update(updates)
						.eq("id", id);

					if (error) throw error;

					// Refresh the list for the current menu item
					const currentItemId = updates.menu_item_id; // Try to get from updates
					if (currentItemId) {
						await get().fetchMenuItemExtras(currentItemId);
					}
					// No toast for silent reordering
				} catch (error) {
					console.error("Error updating menu item extra:", error);
					showToast.error("Failed to update extra");
				}
			},

			// Remove extra from menu item
			removeMenuItemExtra: async (id) => {
				try {
					const { error } = await supabase
						.from("menu_item_extras")
						.update({ is_active: false })
						.eq("id", id);

					if (error) throw error;
					// No need to fetch here if it was successful, as components handle state
				} catch (error) {
					console.error("Error removing menu item extra:", error);
					showToast.error("Failed to remove extra");
				}
			},
		}),
		{
			name: "menu-store",
			partialize: (state) => ({
				allMenuItems: state.allMenuItems,
				// Don't persist filter states
			}),
		}
	)
);

export default useMenuStore;
