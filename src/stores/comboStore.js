import { create } from "zustand";
import { supabase } from "../services/supabase";

const useComboStore = create((set, get) => ({
	// State
	regularCombos: [],
	rotatingTemplates: [],
	loading: false,
	error: null,

	// Actions
	fetchRegularCombos: async () => {
		try {
			const { data, error } = await supabase
				.from("regular_combos")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			set({ regularCombos: data || [], error: null });
		} catch (error) {
			console.error("Error fetching regular combos:", error);
			set({ error: error.message });
		}
	},

	fetchRotatingTemplates: async () => {
		try {
			const { data, error } = await supabase
				.from("rotating_combo_templates")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			set({ rotatingTemplates: data || [], error: null });
		} catch (error) {
			console.error("Error fetching rotating templates:", error);
			set({ error: error.message });
		}
	},

	fetchAllCombos: async () => {
		set({ loading: true });
		try {
			await Promise.all([
				get().fetchRegularCombos(),
				get().fetchRotatingTemplates(),
			]);
		} finally {
			set({ loading: false });
		}
	},

	saveRegularCombo: async (data, id = null) => {
		try {
			let result;
			if (id) {
				result = await supabase
					.from("regular_combos")
					.update({ ...data, updated_at: new Date().toISOString() })
					.eq("id", id)
					.select()
					.single();
			} else {
				result = await supabase
					.from("regular_combos")
					.insert([data])
					.select()
					.single();
			}

			if (result.error) throw result.error;

			await get().fetchRegularCombos();
			return { success: true, data: result.data };
		} catch (error) {
			console.error("Error saving regular combo:", error);
			return { error: error.message };
		}
	},

	deleteRegularCombo: async (id) => {
		try {
			const { error } = await supabase
				.from("regular_combos")
				.delete()
				.eq("id", id);

			if (error) throw error;

			await get().fetchRegularCombos();
			return { success: true };
		} catch (error) {
			console.error("Error deleting regular combo:", error);
			return { error: error.message };
		}
	},

	toggleRegularCombo: async (id) => {
		try {
			const combo = get().regularCombos.find((c) => c.id === id);
			if (!combo) throw new Error("Combo not found");

			const newStatus = !combo.is_active;
			const { error } = await supabase
				.from("regular_combos")
				.update({ is_active: newStatus })
				.eq("id", id);

			if (error) throw error;

			set((state) => ({
				regularCombos: state.regularCombos.map((c) =>
					c.id === id ? { ...c, is_active: newStatus } : c
				),
			}));

			return { success: true };
		} catch (error) {
			console.error("Error toggling regular combo status:", error);
			return { error: error.message };
		}
	},

	saveRotatingTemplate: async (data, id = null) => {
		try {
			let result;
			if (id) {
				result = await supabase
					.from("rotating_combo_templates")
					.update({ ...data, updated_at: new Date().toISOString() })
					.eq("id", id)
					.select()
					.single();
			} else {
				result = await supabase
					.from("rotating_combo_templates")
					.insert([data])
					.select()
					.single();
			}

			if (result.error) throw result.error;

			await get().fetchRotatingTemplates();
			return { success: true, data: result.data };
		} catch (error) {
			console.error("Error saving rotating template:", error);
			return { error: error.message };
		}
	},

	deleteRotatingTemplate: async (id) => {
		try {
			const { error } = await supabase
				.from("rotating_combo_templates")
				.delete()
				.eq("id", id);

			if (error) throw error;

			await get().fetchRotatingTemplates();
			return { success: true };
		} catch (error) {
			console.error("Error deleting rotating template:", error);
			return { error: error.message };
		}
	},

	toggleRotatingTemplate: async (id) => {
		try {
			const template = get().rotatingTemplates.find((t) => t.id === id);
			if (!template) throw new Error("Template not found");

			const newStatus = !template.is_active;
			const { error } = await supabase
				.from("rotating_combo_templates")
				.update({ is_active: newStatus })
				.eq("id", id);

			if (error) throw error;

			set((state) => ({
				rotatingTemplates: state.rotatingTemplates.map((t) =>
					t.id === id ? { ...t, is_active: newStatus } : t
				),
			}));

			return { success: true };
		} catch (error) {
			console.error("Error toggling rotating template status:", error);
			return { error: error.message };
		}
	},
}));

export default useComboStore;
