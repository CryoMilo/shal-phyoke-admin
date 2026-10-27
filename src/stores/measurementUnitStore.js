// src/stores/measurementUnitStore.js
import { create } from "zustand";
import { supabase } from "../services/supabase";

// Fallback units in case DB fetch hasn't completed or is offline
const DEFAULT_UNITS = [
	{ code: "g", name_burmese: "ဂရမ်", name_english: "Gram (g)", unit_category: "weight", base_unit_code: "g", default_base_multiplier: 1 },
	{ code: "kg", name_burmese: "ကီလိုဂရမ်", name_english: "Kilogram (kg)", unit_category: "weight", base_unit_code: "g", default_base_multiplier: 1000 },
	{ code: "viss", name_burmese: "ပိဿာ", name_english: "Viss", unit_category: "weight", base_unit_code: "g", default_base_multiplier: 1630 },
	{ code: "ml", name_burmese: "မီလီလီတာ", name_english: "Milliliter (ml)", unit_category: "volume", base_unit_code: "ml", default_base_multiplier: 1 },
	{ code: "liter", name_burmese: "လီတာ", name_english: "Liter (L)", unit_category: "volume", base_unit_code: "ml", default_base_multiplier: 1000 },
	{ code: "tsp", name_burmese: "လက်ဖက်ရည်ဇွန်း", name_english: "Teaspoon (tsp)", unit_category: "volume", base_unit_code: "g", default_base_multiplier: 5 },
	{ code: "tbsp", name_burmese: "စားပွဲတင်ဇွန်း", name_english: "Tablespoon (tbsp)", unit_category: "volume", base_unit_code: "g", default_base_multiplier: 15 },
	{ code: "serving_spoon", name_burmese: "ဟင်းခတ်ဇွန်း", name_english: "Serving Spoon", unit_category: "volume", base_unit_code: "g", default_base_multiplier: 45 },
	{ code: "cup", name_burmese: "ခွက်", name_english: "Cup", unit_category: "volume", base_unit_code: "g", default_base_multiplier: 200 },
	{ code: "handful", name_burmese: "လက်တစ်ဆုပ်", name_english: "Handful", unit_category: "informal", base_unit_code: "g", default_base_multiplier: 30 },
	{ code: "sprinkle", name_burmese: "ဖြူးရုံ / အနည်းငယ်", name_english: "Sprinkle / Pinch", unit_category: "informal", base_unit_code: "g", default_base_multiplier: 2 },
	{ code: "pack", name_burmese: "ထုပ်", name_english: "Pack", unit_category: "packaging", base_unit_code: "pack", default_base_multiplier: 1 },
	{ code: "piece", name_burmese: "ခု / လုံး", name_english: "Piece", unit_category: "count", base_unit_code: "piece", default_base_multiplier: 1 },
	{ code: "can", name_burmese: "ဘူး", name_english: "Can / Tin", unit_category: "packaging", base_unit_code: "piece", default_base_multiplier: 1 },
	{ code: "bottle", name_burmese: "ပုလင်း", name_english: "Bottle", unit_category: "packaging", base_unit_code: "piece", default_base_multiplier: 1 },
	{ code: "bundle", name_burmese: "စည်း", name_english: "Bundle", unit_category: "packaging", base_unit_code: "piece", default_base_multiplier: 1 },
	{ code: "pot", name_burmese: "အိုး", name_english: "Pot (Batch)", unit_category: "batch", base_unit_code: "pot", default_base_multiplier: 1 },
	{ code: "portion", name_burmese: "ပွဲ", name_english: "Portion / Bowl", unit_category: "batch", base_unit_code: "portion", default_base_multiplier: 1 },
];

export const useMeasurementUnitStore = create((set, get) => ({
	units: DEFAULT_UNITS,
	loading: false,
	error: null,

	fetchUnits: async () => {
		set({ loading: true });
		try {
			const { data, error } = await supabase
				.from("measurement_units")
				.select("*")
				.order("unit_category")
				.order("code");

			if (error) throw error;
			if (data && data.length > 0) {
				set({ units: data, error: null });
			}
		} catch (error) {
			console.error("Error fetching measurement units:", error);
			// Keep DEFAULT_UNITS fallback on failure
			set({ error: error.message });
		} finally {
			set({ loading: false });
		}
	},

	getUnit: (code) => {
		const { units } = get();
		return units.find((u) => u.code === code) || null;
	},

	formatUnitLabel: (code) => {
		const unit = get().getUnit(code);
		if (!unit) return code;
		return `${unit.name_burmese} (${unit.name_english})`;
	},
}));

export default useMeasurementUnitStore;
