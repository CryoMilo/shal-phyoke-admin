// src/stores/kitchenLogStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

export const useKitchenLogStore = create((set, get) => ({
	logs: [],
	selectedDate: new Date().toISOString().split("T")[0],
	loading: false,

	setSelectedDate: (dateStr) => set({ selectedDate: dateStr }),

	fetchLogs: async (startDate, endDate) => {
		set({ loading: true });
		try {
			let query = supabase
				.from("kitchen_prep_logs")
				.select(
					`
          *,
          recipe:recipe_id (
            id,
            name_burmese,
            name_english,
            recipe_type,
            yield_quantity,
            yield_unit,
            image_url
          ),
          inventory_item:inventory_item_id (
            id,
            name_burmese,
            name_english,
            unit,
            cost_per_unit,
            image_url
          )
        `
				)
				.order("created_at", { ascending: false });

			if (startDate && endDate) {
				query = query.gte("log_date", startDate).lte("log_date", endDate);
			}

			const { data, error } = await query;
			if (error) throw error;

			set({ logs: data || [], loading: false });
		} catch (error) {
			console.error("Error fetching kitchen logs:", error);
			showToast.error("Failed to load kitchen prep logs");
			set({ loading: false });
		}
	},

	createPrepBatch: async (prepData) => {
		try {
			const { error } = await supabase.from("kitchen_prep_logs").insert([
				{
					...prepData,
					log_type: "prep",
				},
			]);

			if (error) throw error;

			showToast.success("Batch prep logged successfully");
			const { selectedDate } = get();
			await get().fetchLogs(selectedDate, selectedDate);
			return { success: true };
		} catch (error) {
			console.error("Error logging prep batch:", error);
			showToast.error("Failed to log prep batch");
			return { error: error.message };
		}
	},

	createSpoilageLog: async (spoilageData) => {
		try {
			const { error } = await supabase.from("kitchen_prep_logs").insert([
				{
					...spoilageData,
					log_type: "spoilage",
				},
			]);

			if (error) throw error;

			showToast.success("Spoilage / waste recorded");
			const { selectedDate } = get();
			await get().fetchLogs(selectedDate, selectedDate);
			return { success: true };
		} catch (error) {
			console.error("Error recording spoilage:", error);
			showToast.error("Failed to record spoilage");
			return { error: error.message };
		}
	},

	deleteLog: async (logId) => {
		try {
			const { error } = await supabase
				.from("kitchen_prep_logs")
				.delete()
				.eq("id", logId);

			if (error) throw error;

			set((state) => ({
				logs: state.logs.filter((l) => l.id !== logId),
			}));
			showToast.success("Log entry deleted");
			return { success: true };
		} catch (error) {
			console.error("Error deleting log:", error);
			showToast.error("Failed to delete log entry");
			return { error: error.message };
		}
	},

	// Helper: Get preps and spoilages for a given day
	getLogsForDate: (dateStr) => {
		const { logs } = get();
		const dayLogs = logs.filter((l) => l.log_date === dateStr);
		const preps = dayLogs.filter((l) => (l.log_type || "prep") === "prep" && (l.batches_produced > 0 || l.quantity_produced > 0));
		const spoilages = dayLogs.filter(
			(l) => l.log_type === "spoilage" || (Number(l.waste_quantity) > 0)
		);
		return { preps, spoilages };
	},
}));

export default useKitchenLogStore;
