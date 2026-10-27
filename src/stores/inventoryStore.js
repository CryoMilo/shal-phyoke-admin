// src/stores/inventoryStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const useInventoryStore = create(
	persist(
		(set, get) => ({
			// State
			inventoryItems: [],
			vendors: [],
			loading: false,
			error: null,
			pendingUpdates: {}, // Store itemID -> newQuantity
			syncTimeout: null,

			// Filter states
			searchQuery: "",
			selectedVendors: [],
			selectedItemType: "all", // 'all' | 'ingredient' | 'packaging' | 'operational_supply'
			showRegularOnly: false,

			// Setters
			setSelectedItemType: (type) => set({ selectedItemType: type }),

			// Fetch all inventory items
			fetchInventoryItems: async () => {
				// If we have pending updates, we might want to be careful about refetching
				// but typically we can just refetch and then re-apply pending updates if needed.
				// For simplicity, we just fetch.
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
          ),
          conversions:item_unit_conversions (*)
        `
						)
						.order("category")
						.order("name_english");

					if (error) throw error;

					// If we have pending updates, merge them with the fetched data
					const { pendingUpdates } = get();
					const fetchedItems = data || [];
					const mergedItems = fetchedItems.map((item) => ({
						...item,
						name: item.name_english || item.name || item.name_burmese || "",
						item_unit_conversions: item.conversions || item.item_unit_conversions || [],
						quantity:
							pendingUpdates[item.id] !== undefined
								? pendingUpdates[item.id]
								: item.quantity,
					}));

					set({ inventoryItems: mergedItems, error: null });
				} catch (error) {
					console.error("Error fetching inventory items:", error);
					showToast.error("Failed to load inventory items");
					set({ error: error.message });
				} finally {
					set({ loading: false });
				}
			},

			// Set up real-time subscription
			subscribeToInventory: () => {
				let inventoryRefetchTimer = null;
				const subscription = supabase
					.channel("inventory_changes")
					.on(
						"postgres_changes",
						{ event: "*", schema: "public", table: "inventory_items" },
						(payload) => {
							console.log("Real-time update:", payload);
							// Only refetch if we don't have pending updates to avoid flickering
							// or if the update is from another source.
							const { pendingUpdates } = get();
							if (Object.keys(pendingUpdates).length === 0) {
								if (inventoryRefetchTimer) clearTimeout(inventoryRefetchTimer);
								inventoryRefetchTimer = setTimeout(() => {
									get().fetchInventoryItems();
								}, 1500);
							}
						}
					)
					.subscribe((status, err) => {
						if (err || status === "CHANNEL_ERROR") {
							console.error("Inventory subscription error:", err);
							showToast.error("Real-time updates disconnected. Please refresh.");
						}
					});

				return subscription;
			},

			// Update quantity (Optimistic & Debounced)
			updateQuantity: (id, newQuantity) => {
				// 1. Optimistically update local state
				set((state) => ({
					inventoryItems: state.inventoryItems.map((item) =>
						item.id === id ? { ...item, quantity: newQuantity } : item
					),
					// 2. Add to pending updates
					pendingUpdates: {
						...state.pendingUpdates,
						[id]: newQuantity,
					},
				}));

				// 3. Debounce the sync
				const { syncTimeout } = get();
				if (syncTimeout) clearTimeout(syncTimeout);

				const timeout = setTimeout(() => {
					get().syncPendingUpdates();
				}, 3000); // Wait 3 seconds of inactivity before syncing

				set({ syncTimeout: timeout });
			},

			// Actual Background Sync
			syncPendingUpdates: async () => {
				const { pendingUpdates } = get();
				const updateEntries = Object.entries(pendingUpdates);

				if (updateEntries.length === 0) return;

				// Clear pending state immediately to allow new updates to accumulate
				set({ pendingUpdates: {}, syncTimeout: null });

				try {
					// Perform updates in parallel
					const promises = updateEntries.map(([id, quantity]) =>
						supabase.from("inventory_items").update({ quantity }).eq("id", id)
					);

					const results = await Promise.all(promises);
					const hasError = results.some((r) => r.error);

					if (hasError) {
						console.error(
							"Some inventory updates failed",
							results.map((r) => r.error).filter(Boolean)
						);
						showToast.error("Some stock updates failed to save. Please refresh.");
						// Optional: restore snapshot to pendingUpdates if we want to retry
					}
				} catch (error) {
					console.error("Error syncing inventory updates:", error);
					showToast.error("Failed to sync inventory updates");
				}
			},

			// Update threshold
			updateThreshold: async (id, newThreshold) => {
				try {
					const { error } = await supabase
						.from("inventory_items")
						.update({ threshold: newThreshold })
						.eq("id", id);

					if (error) throw error;

					set((state) => ({
						inventoryItems: state.inventoryItems.map((item) =>
							item.id === id ? { ...item, threshold: newThreshold } : item
						),
					}));

					showToast.success("Threshold updated");
					return { success: true };
				} catch (error) {
					console.error("Error updating threshold:", error);
					showToast.error("Failed to update threshold");
					return { error: error.message };
				}
			},

			// Fetch vendors for filters
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
					showToast.error("Failed to load vendors");
				}
			},

			// Filter actions
			setSearchQuery: (query) => set({ searchQuery: query }),

			toggleVendorFilter: (vendorId) => {
				set((state) => {
					const isSelected = state.selectedVendors.includes(vendorId);
					return {
						selectedVendors: isSelected
							? state.selectedVendors.filter((id) => id !== vendorId)
							: [...state.selectedVendors, vendorId],
					};
				});
			},

			setShowRegularOnly: (show) => set({ showRegularOnly: show }),

			// Reset filters
			resetFilters: () =>
				set({
					searchQuery: "",
					selectedVendors: [],
					showRegularOnly: false,
				}),

			// Get all unique vendors with counts
			getVendorsWithCounts: () => {
				const items = get().inventoryItems;
				const vendors = get().vendors;

				return vendors.map((vendor) => ({
					...vendor,
					count: items.filter((item) => item.default_vendor_id === vendor.id)
						.length,
				}));
			},

			// Filtered items
			getFilteredItems: () => {
				const items = get().inventoryItems;
				const { searchQuery, selectedVendors, selectedItemType, showRegularOnly } = get();
				const q = (searchQuery || "").trim().toLowerCase();

				return items.filter((item) => {
					// Item type filter (ingredient vs packaging vs operational_supply)
					const matchesType =
						!selectedItemType ||
						selectedItemType === "all" ||
						(item.item_type || "ingredient") === selectedItemType;

					// Bilingual search filter
					const matchesSearch =
						q === "" ||
						(item.name_english && item.name_english.toLowerCase().includes(q)) ||
						(item.name_burmese && item.name_burmese.toLowerCase().includes(q)) ||
						(item.name && item.name.toLowerCase().includes(q)) ||
						(item.category && item.category.toLowerCase().includes(q));

					// Vendor filter - if no vendors selected, show all
					const matchesVendor =
						selectedVendors.length === 0 ||
						(item.default_vendor_id &&
							selectedVendors.includes(item.default_vendor_id));

					// Regular only filter
					const matchesRegular = !showRegularOnly || item.is_regular === true;

					return matchesType && matchesSearch && matchesVendor && matchesRegular;
				});
			},

			createInventoryItem: async (itemData) => {
				try {
					const { data, error } = await supabase
						.from("inventory_items")
						.insert([itemData])
						.select()
						.single();

					if (error) throw error;

					await get().fetchInventoryItems();
					showToast.success("Inventory item created");
					return { success: true, item: data };
				} catch (error) {
					console.error("Error creating inventory item:", error);
					showToast.error("Failed to create inventory item");
					return { error: error.message };
				}
			},

			updateInventoryItem: async (id, itemData) => {
				try {
					const { error } = await supabase
						.from("inventory_items")
						.update(itemData)
						.eq("id", id);

					if (error) throw error;

					// Refetch to get updated data with vendor relations
					await get().fetchInventoryItems();
					showToast.success("Inventory item updated");
					return { success: true };
				} catch (error) {
					console.error("Error updating inventory item:", error);
					showToast.error("Failed to update inventory item");
					return { error: error.message };
				}
			},

			// Unit conversions management (Item-specific calibrations)
			addOrUpdateConversion: async (conversionData) => {
				try {
					const { error } = await supabase
						.from("item_unit_conversions")
						.upsert(conversionData, {
							onConflict: "inventory_item_id,unit_code",
						});

					if (error) throw error;

					await get().fetchInventoryItems();
					showToast.success("Unit conversion calibrated");
					return { success: true };
				} catch (error) {
					console.error("Error saving unit conversion:", error);
					showToast.error("Failed to save unit conversion");
					return { error: error.message };
				}
			},

			deleteConversion: async (conversionId) => {
				try {
					const { error } = await supabase
						.from("item_unit_conversions")
						.delete()
						.eq("id", conversionId);

					if (error) throw error;

					await get().fetchInventoryItems();
					showToast.success("Unit conversion removed");
					return { success: true };
				} catch (error) {
					console.error("Error deleting unit conversion:", error);
					showToast.error("Failed to delete unit conversion");
					return { error: error.message };
				}
			},

			// Staff Daily Stock Checklist Submission
			// Automatically audits variance and updates on-hand stock
			submitStockChecklist: async (checklistEntries, wasteReasons = {}) => {
				const entries = Object.entries(checklistEntries).filter(
					([, qty]) => qty !== "" && !isNaN(parseFloat(qty))
				);
				if (entries.length === 0) {
					showToast.error("No stock count values entered");
					return { error: "No values entered" };
				}

				set({ loading: true });
				try {
					const items = get().inventoryItems;
					const auditRecords = [];
					const itemUpdates = [];

					for (const [id, val] of entries) {
						const item = items.find((i) => i.id === id);
						if (!item) continue;

						const actual = parseFloat(val);
						const theoretical = item.quantity || 0;
						const variance = actual - theoretical;
						const cost = Math.round(variance * (item.cost_per_unit || 0) * 100) / 100;
						const reason = wasteReasons[id] || (variance !== 0 ? "Daily Checklist Count" : null);

						auditRecords.push({
							inventory_item_id: id,
							audit_date: new Date().toISOString().split("T")[0],
							theoretical_closing_qty: theoretical,
							actual_closing_qty: actual,
							variance_cost: cost,
							waste_reason: reason,
						});

						itemUpdates.push(
							supabase.from("inventory_items").update({ quantity: actual }).eq("id", id)
						);
					}

					// Insert audit ledger records
					if (auditRecords.length > 0) {
						const { error: auditErr } = await supabase
							.from("inventory_stock_audits")
							.insert(auditRecords);
						if (auditErr) console.warn("Audit log notice:", auditErr);
					}

					// Update inventory items quantities
					await Promise.all(itemUpdates);

					await get().fetchInventoryItems();
					showToast.success(`Checklist submitted! Audited ${entries.length} items.`);
					return { success: true, count: entries.length };
				} catch (error) {
					console.error("Error submitting stock checklist:", error);
					showToast.error("Failed to submit checklist");
					return { error: error.message };
				} finally {
					set({ loading: false });
				}
			},
		}),
		{
			name: "inventory-storage",
			partialize: (state) => ({
				searchQuery: state.searchQuery,
				selectedVendors: state.selectedVendors,
				showRegularOnly: state.showRegularOnly,
			}),
		}
	)
);

export default useInventoryStore;
