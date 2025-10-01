// schemas/creatorData.js
import { z } from "zod";

export const subscriberSchema = z.object({
	name: z.string().min(1, "Name is required"),
	line_id: z.string().optional(),
	phone_number: z.string().min(1, "Phone number is required"),
	delivery_address: z.string().min(1, "Delivery address is required"),
	special_instructions: z.string().optional(),
	is_active: z.boolean().default(true),
});

export const planSchema = z.object({
	plan_name: z.string().min(1, "Plan name is required"),
	main_dish_choice: z.number().min(0, "Main dish choices must be 0 or more"),
	side_dish_choice: z.number().min(0, "Side dish choices must be 0 or more"),
	price: z.number().min(0, "Price must be positive"),
	points_included: z.number().min(0, "Points must be 0 or more"),
	image_url: z.string().url().optional().or(z.literal("")),
	is_active: z.boolean().default(true),
});
