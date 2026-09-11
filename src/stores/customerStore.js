// src/stores/customerStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const useCustomerStore = create((set, get) => ({
	customers: [],
	overview: null,
	loading: false,
	overviewLoading: false,
	selectedCustomer: null,
	customerOrders: [],
	ordersLoading: false,

	// Filters
	searchQuery: "",
	sortBy: "total_orders", // 'total_orders' | 'total_spent' | 'last_order_at' | 'name'
	filterOnlyRepeat: false,

	setSearchQuery: (query) => {
		set({ searchQuery: query });
	},

	setSortBy: (sort) => {
		set({ sortBy: sort });
	},

	setFilterOnlyRepeat: (onlyRepeat) => {
		set({ filterOnlyRepeat: onlyRepeat });
	},

	setSelectedCustomer: (customer) => {
		set({ selectedCustomer: customer });
		if (customer) {
			get().fetchCustomerOrders(customer.id);
		} else {
			set({ customerOrders: [] });
		}
	},

	// Lightweight search for autocomplete dropdown in NewOrderTab (Zero-Egress optimized)
	searchCustomers: async (queryStr) => {
		if (!queryStr || !queryStr.trim()) return [];
		try {
			const { data, error } = await supabase.rpc("search_customers", {
				p_query: queryStr.trim(),
				p_limit: 8,
			});

			if (error) {
				// Fallback to client query if RPC call fails
				const { data: fallback } = await supabase
					.from("customers")
					.select("id, name, phone, delivery_address, default_notes, total_orders")
					.or(`name.ilike.%${queryStr.trim()}%,phone.ilike.%${queryStr.trim()}%`)
					.order("total_orders", { ascending: false })
					.limit(8);
				return fallback || [];
			}

			return data || [];
		} catch (err) {
			console.error("searchCustomers error:", err);
			return [];
		}
	},

	// Fetches high-level metrics for dashboard header (<200 bytes payload)
	fetchOverview: async () => {
		set({ overviewLoading: true });
		try {
			const { data, error } = await supabase.rpc("get_customer_dashboard_overview");
			if (error) throw error;
			set({ overview: data || null });
		} catch (err) {
			console.error("Error fetching customer overview:", err);
		} finally {
			set({ overviewLoading: false });
		}
	},

	// Fetches customer cards list with sorting & filtering
	fetchCustomers: async () => {
		set({ loading: true });
		try {
			const { searchQuery, sortBy, filterOnlyRepeat } = get();

			let query = supabase
				.from("customers")
				.select(
					"id, name, phone, delivery_address, default_notes, total_orders, total_spent, first_order_at, last_order_at, frequent_notes, favorite_items"
				);

			if (filterOnlyRepeat) {
				query = query.gt("total_orders", 1);
			}

			if (searchQuery?.trim()) {
				const term = searchQuery.trim();
				query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
			}

			// Sort options
			if (sortBy === "total_spent") {
				query = query.order("total_spent", { ascending: false });
			} else if (sortBy === "last_order_at") {
				query = query.order("last_order_at", { ascending: false });
			} else if (sortBy === "name") {
				query = query.order("name", { ascending: true });
			} else {
				query = query.order("total_orders", { ascending: false });
			}

			const { data, error } = await query.limit(100);
			if (error) throw error;
			set({ customers: data || [] });
		} catch (err) {
			console.error("Error fetching customers:", err);
			showToast.error("Failed to load customer list");
		} finally {
			set({ loading: false });
		}
	},

	// Fetches last 15 delivery orders for a single customer when opening detail modal
	fetchCustomerOrders: async (customerId) => {
		if (!customerId) return;
		set({ ordersLoading: true });
		try {
			const { data, error } = await supabase
				.from("orders")
				.select(
					"id, order_number, total_amount, created_at, pos_order_status, notes, order_items, delivery_address"
				)
				.eq("customer_id", customerId)
				.order("created_at", { ascending: false })
				.limit(15);

			if (error) throw error;
			set({ customerOrders: data || [] });
		} catch (err) {
			console.error("Error fetching customer orders:", err);
		} finally {
			set({ ordersLoading: false });
		}
	},
}));

export default useCustomerStore;
