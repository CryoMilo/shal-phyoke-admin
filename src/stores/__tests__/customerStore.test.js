import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Supabase service before importing store
vi.mock("../../services/supabase", () => ({
	supabase: {
		rpc: vi.fn(),
		from: vi.fn(),
	},
}));

import { supabase } from "../../services/supabase";
import useCustomerStore from "../customerStore";

describe("customerStore.js - Customer Analytics & Autocomplete State", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useCustomerStore.setState({
			customers: [],
			overview: null,
			loading: false,
			overviewLoading: false,
			selectedCustomer: null,
			customerOrders: [],
			ordersLoading: false,
			searchQuery: "",
			sortBy: "total_orders",
			filterOnlyRepeat: false,
		});
	});

	it("initializes with correct default filter state", () => {
		const state = useCustomerStore.getState();
		expect(state.customers).toEqual([]);
		expect(state.searchQuery).toBe("");
		expect(state.sortBy).toBe("total_orders");
		expect(state.filterOnlyRepeat).toBe(false);
	});

	it("updates search query, sort by, and repeat customer filter", () => {
		const store = useCustomerStore.getState();
		store.setSearchQuery("Aung");
		store.setSortBy("total_spent");
		store.setFilterOnlyRepeat(true);

		const updatedState = useCustomerStore.getState();
		expect(updatedState.searchQuery).toBe("Aung");
		expect(updatedState.sortBy).toBe("total_spent");
		expect(updatedState.filterOnlyRepeat).toBe(true);
	});

	it("searchCustomers returns empty array for blank or whitespace query without calling RPC", async () => {
		const store = useCustomerStore.getState();
		const results1 = await store.searchCustomers("");
		const results2 = await store.searchCustomers("   ");

		expect(results1).toEqual([]);
		expect(results2).toEqual([]);
		expect(supabase.rpc).not.toHaveBeenCalled();
	});

	it("searchCustomers calls search_customers RPC and returns data", async () => {
		const mockData = [
			{ id: "cust-1", name: "Daw Mya", phone: "0812345678", total_orders: 5 },
		];
		supabase.rpc.mockResolvedValueOnce({ data: mockData, error: null });

		const store = useCustomerStore.getState();
		const results = await store.searchCustomers("Daw");

		expect(supabase.rpc).toHaveBeenCalledWith("search_customers", {
			p_query: "Daw",
			p_limit: 8,
		});
		expect(results).toEqual(mockData);
	});

	it("fetchOverview invokes get_customer_dashboard_overview RPC and updates store", async () => {
		const mockOverview = {
			total_customers: 25,
			repeat_customers: 10,
			total_delivery_revenue: 15400,
			total_delivery_orders: 45,
			avg_spend_per_customer: 616,
		};
		supabase.rpc.mockResolvedValueOnce({ data: mockOverview, error: null });

		const store = useCustomerStore.getState();
		await store.fetchOverview();

		const updated = useCustomerStore.getState();
		expect(updated.overview).toEqual(mockOverview);
		expect(updated.overviewLoading).toBe(false);
	});

	it("setSelectedCustomer selects customer and clears or fetches customer orders", () => {
		const store = useCustomerStore.getState();
		const mockCustomer = { id: "cust-123", name: "Ko Lin", total_orders: 3 };

		// Mock fetchCustomerOrders
		const fetchOrdersSpy = vi.spyOn(store, "fetchCustomerOrders").mockImplementation(() => {});

		store.setSelectedCustomer(mockCustomer);
		expect(useCustomerStore.getState().selectedCustomer).toEqual(mockCustomer);
		expect(fetchOrdersSpy).toHaveBeenCalledWith("cust-123");

		store.setSelectedCustomer(null);
		expect(useCustomerStore.getState().selectedCustomer).toBeNull();
		expect(useCustomerStore.getState().customerOrders).toEqual([]);
	});
});
