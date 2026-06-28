import { create } from "zustand";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const useEmployeeAbsenceStore = create((set) => ({
	absences: [],
	loading: false,

	fetchAbsences: async (monthStr) => {
		set({ loading: true });
		try {
			let query = supabase
				.from("employee_absences")
				.select("*, employee:employee_id(id, name)")
				.order("absence_date", { ascending: false });

			if (monthStr) {
				const monthStart = `${monthStr}-01`;
				const [year, month] = monthStr.split("-").map(Number);
				const lastDay = new Date(year, month, 0).getDate();
				const monthEnd = `${monthStr}-${String(lastDay).padStart(2, "0")}`;

				query = query
					.gte("absence_date", monthStart)
					.lte("absence_date", monthEnd);
			}

			const { data, error } = await query;
			if (error) throw error;

			set({ absences: data || [], loading: false });
		} catch (error) {
			console.error("Error fetching absences:", error);
			showToast.error("Failed to load absences");
			set({ loading: false });
		}
	},

	fetchAbsencesForMonth: async (monthStr) => {
		const monthStart = `${monthStr}-01`;
		const [year, month] = monthStr.split("-").map(Number);
		const lastDay = new Date(year, month, 0).getDate();
		const monthEnd = `${monthStr}-${String(lastDay).padStart(2, "0")}`;

		const { data, error } = await supabase
			.from("employee_absences")
			.select("*")
			.gte("absence_date", monthStart)
			.lte("absence_date", monthEnd);

		if (error) throw error;
		return data || [];
	},

	addAbsence: async (absenceData) => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("employee_absences")
				.insert([absenceData])
				.select("*, employee:employee_id(id, name)")
				.single();

			if (error) throw error;

			set((state) => ({
				absences: [data, ...state.absences],
				loading: false,
			}));

			showToast.success("Absence recorded");
			return { success: true, data };
		} catch (error) {
			console.error("Error adding absence:", error);
			const msg =
				error.code === "23505"
					? "Absence already recorded for this employee on this date"
					: error.message || "Failed to record absence";
			showToast.error(msg);
			set({ loading: false });
			return { success: false, error };
		}
	},

	updateAbsence: async (id, updates) => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("employee_absences")
				.update(updates)
				.eq("id", id)
				.select("*, employee:employee_id(id, name)")
				.single();

			if (error) throw error;

			set((state) => ({
				absences: state.absences.map((a) => (a.id === id ? data : a)),
				loading: false,
			}));

			showToast.success("Absence updated");
			return { success: true, data };
		} catch (error) {
			console.error("Error updating absence:", error);
			showToast.error(error.message || "Failed to update absence");
			set({ loading: false });
			return { success: false, error };
		}
	},

	deleteAbsence: async (id) => {
		set({ loading: true });
		try {
			const { error } = await supabase
				.from("employee_absences")
				.delete()
				.eq("id", id);

			if (error) throw error;

			set((state) => ({
				absences: state.absences.filter((a) => a.id !== id),
				loading: false,
			}));

			showToast.success("Absence removed");
			return { success: true };
		} catch (error) {
			console.error("Error deleting absence:", error);
			showToast.error("Failed to delete absence");
			set({ loading: false });
			return { success: false, error };
		}
	},
}));

export default useEmployeeAbsenceStore;
