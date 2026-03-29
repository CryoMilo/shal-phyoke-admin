import { create } from "zustand";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const useQuickNoteStore = create((set, get) => ({
	// State
	notes: [], // All notes for the management library
	activeNotes: [], // Only active notes for ordering/assignment
	loading: false,
	initialized: false,

	// Actions
	
	// Fetch all notes (for Management Library)
	fetchAllNotes: async () => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("quick_notes")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;

			set({
				notes: data || [],
				loading: false,
			});
		} catch (error) {
			console.error("Error fetching all quick notes:", error);
			showToast.error("Failed to load quick notes library");
			set({ loading: false });
		}
	},

	// Fetch only active notes (for UI Pickers)
	fetchActiveNotes: async (force = false) => {
		if (get().initialized && !force) return;

		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("quick_notes")
				.select("*")
				.eq("is_active", true)
				.order("label", { ascending: true });

			if (error) throw error;

			set({
				activeNotes: data || [],
				initialized: true,
				loading: false,
			});
		} catch (error) {
			console.error("Error fetching active quick notes:", error);
			set({ loading: false });
		}
	},

	// CRUD for the Library
	addNote: async (noteData) => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("quick_notes")
				.insert([
					{
						...noteData,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					},
				])
				.select()
				.single();

			if (error) throw error;

			set((state) => ({
				notes: [data, ...state.notes],
				activeNotes: data.is_active ? [...state.activeNotes, data] : state.activeNotes,
				loading: false,
			}));
			
			showToast.success("Quick Note added to library");
			return { success: true, data };
		} catch (error) {
			console.error("Error adding quick note:", error);
			showToast.error("Failed to add quick note");
			set({ loading: false });
			return { success: false, error };
		}
	},

	updateNote: async (id, updates) => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("quick_notes")
				.update({
					...updates,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;

			set((state) => ({
				notes: state.notes.map((n) => (n.id === id ? data : n)),
				activeNotes: data.is_active 
					? state.activeNotes.some(n => n.id === id) 
						? state.activeNotes.map(n => n.id === id ? data : n)
						: [...state.activeNotes, data].sort((a,b) => a.label.localeCompare(b.label))
					: state.activeNotes.filter(n => n.id !== id),
				loading: false,
			}));

			showToast.success("Quick Note updated");
			return { success: true, data };
		} catch (error) {
			console.error("Error updating quick note:", error);
			showToast.error("Failed to update quick note");
			set({ loading: false });
			return { success: false, error };
		}
	},

	deleteNote: async (id) => {
		set({ loading: true });
		try {
			const { error } = await supabase
				.from("quick_notes")
				.delete()
				.eq("id", id);

			if (error) throw error;

			set((state) => ({
				notes: state.notes.filter((n) => n.id !== id),
				activeNotes: state.activeNotes.filter((n) => n.id !== id),
				loading: false,
			}));

			showToast.success("Quick Note removed from library");
			return { success: true };
		} catch (error) {
			console.error("Error deleting quick note:", error);
			showToast.error("Failed to delete quick note");
			set({ loading: false });
			return { success: false, error };
		}
	},

	// Helper to get notes by their IDs (for the ordering UI)
	getNotesByIds: (ids) => {
		if (!ids || !Array.isArray(ids)) return [];
		const activeNotes = get().activeNotes;
		return activeNotes.filter(note => ids.includes(note.id));
	},

	refresh: () => {
		get().fetchActiveNotes(true);
		get().fetchAllNotes();
	},
}));

export default useQuickNoteStore;
