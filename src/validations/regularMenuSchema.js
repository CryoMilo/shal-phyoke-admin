import z from "zod";

export const regularMenuSchema = z.object({
	name_burmese: z.string().min(1, "Burmese name is required"),
	name_english: z.string().optional(),
	name_thai: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	category: z.string().min(1, "Category is required"),
	taste_profile: z.string().optional(),
	description: z.string().optional(),
	image_url: z.string().url().optional().or(z.literal("")),
	is_active: z.boolean().default(true),
});
