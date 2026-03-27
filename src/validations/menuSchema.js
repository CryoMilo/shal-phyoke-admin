// src/validations/menuSchema.js
import { z } from "zod";

export const menuSchema = z.object({
	name_burmese: z.string().min(1, "Burmese name is required"),
	name_english: z.string().min(1, "English name is required"),
	name_thai: z.string().optional(),
	price: z.number().min(0, "Price must be 0 or greater"),
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
	image_url: z.string().optional(),
	sensitive_ingredients: z.string().optional(),
	is_active: z.boolean().default(true),
	is_regular: z.boolean().default(false),
	is_vegan: z.boolean().default(false),
	// Combo fields (optional/nullable since most items are not combos)
	is_combo: z.boolean().default(false),
	combo_type: z.enum(["fixed", "rotating"]).nullable().optional(),
	combo_members: z.any().nullable().optional(),
	combo_slots: z.any().nullable().optional(),
	combo_note_summary: z.string().nullable().optional(),
});

// For regular menu page
export const regularMenuSchema = menuSchema.extend({
	is_regular: z.literal(true), // Force true for regular menu page
});
