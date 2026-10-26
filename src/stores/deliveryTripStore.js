import { create } from "zustand";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";
import { startOfMonth, endOfMonth } from "date-fns";
import { getBangkokDayRange } from "../utils/dateUtils";

const useDeliveryTripStore = create((set, get) => ({
	todayTrips: [],
	monthlyTrips: [],
	boltMonthlyOrders: [],
	loading: false,

	fetchTodayTrips: async () => {
		try {
			const { start: todayStart, end: todayEnd } = getBangkokDayRange();

			const { data, error } = await supabase
				.from("delivery_trips")
				.select(`
					id,
					employee_id,
					trip_fee,
					order_count,
					notes,
					created_at,
					employees (id, name, phone),
					orders (id, order_number, customer_name, total_amount, pos_order_status)
				`)
				.gte("created_at", todayStart)
				.lte("created_at", todayEnd)
				.order("created_at", { ascending: false });

			if (error) throw error;
			set({ todayTrips: data || [] });
			return data || [];
		} catch (error) {
			console.error("Error fetching today's delivery trips:", error);
			return [];
		}
	},

	fetchMonthlyTrips: async (date = new Date()) => {
		set({ loading: true });
		try {
			const monthStart = startOfMonth(date).toISOString();
			const monthEnd = endOfMonth(date).toISOString();

			// 1. Fetch delivery trips with employee and linked orders
			const { data: tripsData, error: tripsError } = await supabase
				.from("delivery_trips")
				.select(`
					id,
					employee_id,
					trip_fee,
					order_count,
					notes,
					created_at,
					employees (id, name, phone, is_active),
					orders (id, order_number, customer_name, total_amount, pos_order_status, created_at)
				`)
				.gte("created_at", monthStart)
				.lte("created_at", monthEnd)
				.order("created_at", { ascending: false });

			if (tripsError) throw tripsError;

			// 2. Fetch Bolt delivery orders for the same month
			const { data: boltData, error: boltError } = await supabase
				.from("orders")
				.select("id, order_number, customer_name, total_amount, delivery_fee, created_at, pos_order_status")
				.eq("delivery_provider", "bolt")
				.gte("created_at", monthStart)
				.lte("created_at", monthEnd)
				.order("created_at", { ascending: false });

			if (boltError) throw boltError;

			set({
				monthlyTrips: tripsData || [],
				boltMonthlyOrders: boltData || [],
				loading: false,
			});
		} catch (error) {
			console.error("Error fetching monthly delivery trips:", error);
			showToast.error("Failed to load delivery trips data");
			set({ loading: false });
		}
	},

	recordStaffTrip: async ({ employeeId, orderIds, tripFee = 20, notes = null }) => {
		if (!employeeId || !orderIds || orderIds.length === 0) {
			showToast.error("Please select a staff member and at least one order");
			return { success: false };
		}

		set({ loading: true });
		try {
			// 1. Create delivery_trips row
			const { data: tripData, error: tripError } = await supabase
				.from("delivery_trips")
				.insert([
					{
						employee_id: employeeId,
						trip_fee: Number(tripFee) || 20,
						order_count: orderIds.length,
						notes: notes || null,
					},
				])
				.select()
				.single();

			if (tripError) throw tripError;

			// 2. Update orders with trip ID and paid delivery status
			const { error: ordersError } = await supabase
				.from("orders")
				.update({
					delivery_trip_id: tripData.id,
					delivery_provider: "in_house",
					delivery_fee_paid: true,
					updated_at: new Date().toISOString(),
				})
				.in("id", orderIds);

			if (ordersError) throw ordersError;

			showToast.success(`Trip recorded for staff (฿${Number(tripFee || 20).toFixed(2)})`);
			await get().fetchTodayTrips();
			set({ loading: false });
			return { success: true, trip: tripData };
		} catch (error) {
			console.error("Error recording staff delivery trip:", error);
			showToast.error(error.message || "Failed to record delivery trip");
			set({ loading: false });
			return { success: false, error };
		}
	},

	recordBoltDelivery: async ({ orderIds }) => {
		if (!orderIds || orderIds.length === 0) {
			showToast.error("Please select at least one order for Bolt");
			return { success: false };
		}

		set({ loading: true });
		try {
			const { error } = await supabase
				.from("orders")
				.update({
					delivery_provider: "bolt",
					delivery_trip_id: null,
					delivery_fee_paid: true,
					updated_at: new Date().toISOString(),
				})
				.in("id", orderIds);

			if (error) throw error;

			showToast.success(`Marked ${orderIds.length} order(s) for Bolt delivery`);
			set({ loading: false });
			return { success: true };
		} catch (error) {
			console.error("Error assigning Bolt delivery:", error);
			showToast.error(error.message || "Failed to mark Bolt delivery");
			set({ loading: false });
			return { success: false, error };
		}
	},

	unmarkBoltDelivery: async (orderId) => {
		if (!orderId) return { success: false };

		set({ loading: true });
		try {
			const { error } = await supabase
				.from("orders")
				.update({
					delivery_provider: null,
					delivery_trip_id: null,
					delivery_fee_paid: false,
					updated_at: new Date().toISOString(),
				})
				.eq("id", orderId);

			if (error) throw error;

			showToast.success("Removed Bolt delivery assignment");
			set({ loading: false });
			return { success: true };
		} catch (error) {
			console.error("Error unmarking Bolt delivery:", error);
			showToast.error(error.message || "Failed to remove Bolt delivery");
			set({ loading: false });
			return { success: false, error };
		}
	},

	deleteTrip: async (tripId, successMessage = "Trip deleted successfully") => {
		if (!tripId) return { success: false };

		set({ loading: true });
		try {
			// 1. Reset orders linked to this trip
			const { error: orderResetError } = await supabase
				.from("orders")
				.update({
					delivery_trip_id: null,
					delivery_fee_paid: false,
					delivery_provider: null,
					updated_at: new Date().toISOString(),
				})
				.eq("delivery_trip_id", tripId);

			if (orderResetError) throw orderResetError;

			// 2. Delete trip record
			const { error: tripDeleteError } = await supabase
				.from("delivery_trips")
				.delete()
				.eq("id", tripId);

			if (tripDeleteError) throw tripDeleteError;

			showToast.success(successMessage);
			await get().fetchTodayTrips();
			set((state) => ({
				monthlyTrips: state.monthlyTrips.filter((t) => t.id !== tripId),
				loading: false,
			}));
			return { success: true };
		} catch (error) {
			console.error("Error deleting delivery trip:", error);
			showToast.error(error.message || "Failed to delete trip");
			set({ loading: false });
			return { success: false, error };
		}
	},

	undoTrip: async (tripId) => {
		return get().deleteTrip(tripId, "Trip undone successfully");
	},

	transferTrip: async (tripId, newEmployeeId) => {
		if (!tripId || !newEmployeeId) {
			showToast.error("Missing trip or staff information");
			return { success: false };
		}

		set({ loading: true });
		try {
			const { error } = await supabase
				.from("delivery_trips")
				.update({
					employee_id: newEmployeeId,
				})
				.eq("id", tripId);

			if (error) throw error;

			showToast.success("Trip transferred successfully");
			await get().fetchTodayTrips();
			set({ loading: false });
			return { success: true };
		} catch (error) {
			console.error("Error transferring delivery trip:", error);
			showToast.error(error.message || "Failed to transfer trip");
			set({ loading: false });
			return { success: false, error };
		}
	},

	resetAllTrips: async () => {
		set({ loading: true });
		try {
			// 1. Reset all orders linked to delivery trips
			const { error: ordersResetError } = await supabase
				.from("orders")
				.update({
					delivery_trip_id: null,
					delivery_fee_paid: false,
					delivery_provider: null,
					updated_at: new Date().toISOString(),
				})
				.not("delivery_trip_id", "is", null);

			if (ordersResetError) throw ordersResetError;

			// 2. Delete all records from delivery_trips
			const { error: tripsDeleteError } = await supabase
				.from("delivery_trips")
				.delete()
				.neq("id", "00000000-0000-0000-0000-000000000000");

			if (tripsDeleteError) throw tripsDeleteError;

			showToast.success("All delivery trips have been reset successfully");
			set({
				todayTrips: [],
				monthlyTrips: [],
				loading: false,
			});
			return { success: true };
		} catch (error) {
			console.error("Error resetting all delivery trips:", error);
			showToast.error("Failed to reset delivery trips");
			set({ loading: false });
			return { success: false, error };
		}
	},
}));

export default useDeliveryTripStore;
