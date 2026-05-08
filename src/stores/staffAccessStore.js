import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";

export const DEFAULT_PERMISSIONS = {
	admin: [
		"/dashboard",
		"/weekly-menu",
		"/orders",
		"/combo-manager",
		"/all-menu",
		"/regular-menu",
		"/menu-status",
		"/procurement",
		"/inventory-items",
		"/daily-cash",
		"/daily-expenses",
		"/monthly-overheads",
		"/quick-note-settings",
	],
	staff: [
		"/weekly-menu",
		"/orders",
		"/combo-manager",
		"/all-menu",
		"/regular-menu",
		"/menu-status",
		"/procurement",
		"/inventory-items",
		"/daily-cash",
		"/daily-expenses",
		"/quick-note-settings",
	],
};

const useStaffAccessStore = create(
	persist(
		(set) => ({
			permissions: DEFAULT_PERMISSIONS,
			loading: false,

			fetchPermissions: async () => {
				set({ loading: true });
				try {
					const { data, error } = await supabase
						.from("app_settings")
						.select("value")
						.eq("key", "sidebar_permissions")
						.maybeSingle();

					if (error && error.code !== "PGRST116") {
						// PGRST116 is 'no rows returned', which is fine
						// If the table doesn't exist, it will likely be a 404 or similar
						console.warn("Could not fetch permissions from database, using local settings:", error);
					} else if (data?.value) {
						set({ permissions: data.value });
					}
				} catch (err) {
					console.warn("Error fetching permissions:", err);
				} finally {
					set({ loading: false });
				}
			},

			savePermissions: async (newPermissions) => {
				set({ loading: true });
				try {
					// 1. Update local state
					set({ permissions: newPermissions });

					// 2. Try to update database
					const { error } = await supabase
						.from("app_settings")
						.upsert({
							key: "sidebar_permissions",
							value: newPermissions,
							updated_at: new Date().toISOString(),
						}, { onConflict: "key" });

					if (error) {
						console.error("Failed to save permissions to database:", error);
						showToast.info("Settings saved locally on this device. Database sync failed.");
					} else {
						showToast.success("Permissions updated successfully");
					}
				} catch (err) {
					console.error("Error saving permissions:", err);
					showToast.info("Settings saved locally on this device.");
				} finally {
					set({ loading: false });
				}
			},

			resetToDefault: () => {
				set({ permissions: DEFAULT_PERMISSIONS });
			},
		}),
		{
			name: "staff-access-storage",
		}
	)
);

export default useStaffAccessStore;
