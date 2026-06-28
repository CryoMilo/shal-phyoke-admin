import { create } from "zustand";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

const useEmployeeStore = create((set, get) => ({
	employees: [],
	loading: false,
	activeTab: "employees",

	setActiveTab: (tab) => set({ activeTab: tab }),

	fetchEmployees: async () => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("employees")
				.select("*")
				.order("name");

			if (error) throw error;
			set({ employees: data || [], loading: false });
		} catch (error) {
			console.error("Error fetching employees:", error);
			showToast.error("Failed to load employees");
			set({ loading: false });
		}
	},

	fetchActiveEmployees: async () => {
		const { data, error } = await supabase
			.from("employees")
			.select("*")
			.eq("is_active", true)
			.order("name");

		if (error) throw error;
		return data || [];
	},

	addEmployee: async (employeeData) => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("employees")
				.insert([
					{
						...employeeData,
						updated_at: new Date().toISOString(),
					},
				])
				.select()
				.single();

			if (error) throw error;

			set((state) => ({
				employees: [...state.employees, data].sort((a, b) =>
					a.name.localeCompare(b.name)
				),
				loading: false,
			}));

			showToast.success(`Employee added: ${data.name}`);
			return { success: true, data };
		} catch (error) {
			console.error("Error adding employee:", error);
			showToast.error(error.message || "Failed to add employee");
			set({ loading: false });
			return { success: false, error };
		}
	},

	updateEmployee: async (id, updates) => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("employees")
				.update({
					...updates,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;

			set((state) => ({
				employees: state.employees
					.map((e) => (e.id === id ? data : e))
					.sort((a, b) => a.name.localeCompare(b.name)),
				loading: false,
			}));

			showToast.success(`Employee updated: ${data.name}`);
			return { success: true, data };
		} catch (error) {
			console.error("Error updating employee:", error);
			showToast.error(error.message || "Failed to update employee");
			set({ loading: false });
			return { success: false, error };
		}
	},

	deleteEmployee: async (id) => {
		const employee = get().employees.find((e) => e.id === id);
		set({ loading: true });
		try {
			const { error } = await supabase
				.from("employees")
				.delete()
				.eq("id", id);

			if (error) throw error;

			set((state) => ({
				employees: state.employees.filter((e) => e.id !== id),
				loading: false,
			}));

			showToast.success(`Employee removed: ${employee?.name || "Employee"}`);
			return { success: true };
		} catch (error) {
			console.error("Error deleting employee:", error);
			showToast.error("Failed to delete employee");
			set({ loading: false });
			return { success: false, error };
		}
	},
}));

export default useEmployeeStore;
