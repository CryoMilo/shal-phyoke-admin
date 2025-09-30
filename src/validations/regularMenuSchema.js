import z from "zod";

export const regularMenuSchema = z.object({
	name: z.string().min(1, "Name (Burmese) is required"),
	name_eng: z.string().optional(),
	name_thai: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	category: z.string().min(1, "Category is required"),
	taste_profile: z.string().optional(),
	description: z.string().optional(),
	image_url: z.string().url().optional().or(z.literal("")),
	is_vegan: z.boolean().default(false),
	is_active: z.boolean().default(true),
});
