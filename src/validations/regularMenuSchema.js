// validations/regularMenuSchema.js
import { z } from "zod";

export const regularMenuSchema = z.object({
	name_burmese: z.string().min(1, "Burmese name is required"),
	name_english: z.string().optional(),
	name_thai: z.string().optional(),
	price: z.number().min(0, "Price must be 0 or more"),
	category: z.enum(["Drink", "Extra", "Rice", "Noodles", "Combo", "Other"]),
	taste_profile: z.string().optional(),
	description: z.string().optional(),
	image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
	is_active: z.boolean().default(true),
	is_regular: z.boolean().default(true),
});
