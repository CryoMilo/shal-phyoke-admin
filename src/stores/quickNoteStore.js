import { create } from "zustand";
import { supabase } from "../services/supabase";

const useQuickNoteStore = create((set, get) => ({
	settings: [],
	loading: false,
	initialized: false,

	fetchSettings: async (force = false) => {
		if (get().initialized && !force) return;

		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("quick_note_settings")
				.select("*")
				.eq("is_active", true)
				.order("sort_order", { ascending: true });

			if (error) throw error;
			set({ settings: data || [], initialized: true });
		} catch (error) {
			console.error("Error fetching quick note settings:", error);
		} finally {
			set({ loading: false });
		}
	},

	// For settings page to see all including inactive
	fetchAllSettings: async () => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("quick_note_settings")
				.select("*")
				.order("sort_order", { ascending: true });

			if (error) throw error;
			set({ settings: data || [] });
		} catch (error) {
			console.error("Error fetching all quick note settings:", error);
		} finally {
			set({ loading: false });
		}
	},

	getSettingsByCategory: (category) => {
		const { settings } = get();
		return settings.filter((s) => {
			if (!s.is_active) return false;
			if (!s.applicable_categories || s.applicable_categories.length === 0)
				return true;
			return s.applicable_categories.includes(category);
		});
	},

	refresh: () => get().fetchSettings(true),
}));

export default useQuickNoteStore;
