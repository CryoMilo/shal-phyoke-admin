// schemas/creatorData.js
import { z } from "zod";

export const menuSchema = z.object({
	name_burmese: z.string().min(1, "Burmese name is required"),
	name_english: z.string().min(1, "English name is required"),
	name_thai: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	class: z.enum(["A", "B", "C", "S", "FOC"]),
	taste_profile: z.string().optional(),
	category: z.enum([
		"Chicken",
		"Pork",
		"Beef",
		"Vegetarian",
		"Salad",
		"Seafood",
		"Special",
	]),
	image_url: z.string().url().optional().or(z.literal("")),
	description: z.string().optional(),
	sensitive_ingredients: z.string().optional(),
	is_active: z.boolean().default(true),
});
