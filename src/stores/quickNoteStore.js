import { create } from "zustand";
import { supabase } from "../services/supabase";

const useQuickNoteStore = create((set, get) => ({
	// State
	settings: [], // all settings for management page
	activeSettings: [], // is_active true only, for POS use
	loading: false,
	initialized: false,

	// Actions
	fetchSettings: async (force = false) => {
		if (get().initialized && !force) return;

		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("quick_note_settings")
				.select("*")
				.eq("is_active", true)
				.order("created_at", { ascending: true });

			if (error) throw error;

			set({
				activeSettings: data || [],
				initialized: true,
				loading: false,
			});
		} catch (error) {
			console.error("Error fetching active quick note settings:", error);
			set({ loading: false });
		}
	},

	fetchAllSettings: async () => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("quick_note_settings")
				.select("*")
				.order("created_at", { ascending: true });

			if (error) throw error;

			set({
				settings: data || [],
				loading: false,
			});
		} catch (error) {
			console.error("Error fetching all quick note settings:", error);
			set({ loading: false });
		}
	},

	getSettingsByItem: (item) => {
		const activeSettings = get().activeSettings;
		if (!item) return [];

		const isCombo = item.category === "Combo";
		const isRegular = item.is_regular === true;
		const category = item.category;

		return activeSettings.filter((s) => {
			// Condition 1: Scope check
			let scopeMatch = false;
			if (s.scope === "all") {
				scopeMatch = true;
			} else if (s.scope === "combo" && isCombo) {
				scopeMatch = true;
			} else if (s.scope === "regular" && isRegular && !isCombo) {
				scopeMatch = true;
			} else if (s.scope === "rotating" && !isRegular && !isCombo) {
				scopeMatch = true;
			}

			if (!scopeMatch) return false;

			// Condition 2: Category narrowing
			if (!s.applicable_categories || s.applicable_categories.length === 0) {
				return true; // No narrowing, applies to whole scope
			}

			return s.applicable_categories.includes(category);
		});
	},

	refresh: () => {
		get().fetchSettings(true);
	},
}));

export default useQuickNoteStore;
