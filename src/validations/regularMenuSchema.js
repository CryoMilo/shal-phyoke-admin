// validations/regularMenuSchema.js
import { z } from "zod";

export const regularMenuSchema = z.object({
	name_burmese: z.string().min(1, "Burmese name is required"),
	name_english: z.string().optional(),
	name_thai: z.string().optional(),
	price: z.number().min(0, "Price must be 0 or more"),
	category: z.enum([
		"Chicken",
		"Pork",
		"Beef",
		"Vege",
		"Salad",
		"Seafood",
		"Soup",
		"Side",
		"Rice",
		"Noodles",
		"Drink",
		"Extra",
		"Combo",
		"Other",
		"Comfort",
	]),
	taste_profile: z.string().optional(),
	description: z.string().optional(),
	image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
	is_active: z.boolean().default(true),
	is_regular: z.boolean().default(true),
	is_vegan: z.boolean().default(false),
	// Combo fields (optional/nullable since most items are not combos)
	is_combo: z.boolean().default(false),
	combo_type: z.enum(["fixed", "rotating"]).nullable().optional(),
	combo_members: z.any().nullable().optional(),
	combo_slots: z.any().nullable().optional(),
	combo_note_summary: z.string().nullable().optional(),
});
