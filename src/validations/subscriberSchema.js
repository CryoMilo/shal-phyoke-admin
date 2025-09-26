// schemas/creatorData.js
import { z } from "zod";

export const subscriberSchema = z.object({
	name: z.string().min(1, "Name is required"), // Direct name field
	line_id: z.string().optional(), // LINE ID for messaging
	user_id: z.string().optional(), // Still keep for auth reference
	subscription_plan_id: z.string().min(1, "Subscription plan is required"),
	remaining_points: z.number().min(0, "Points must be positive"),
	subscription_start_date: z.string().min(1, "Start date is required"),
	subscription_end_date: z.string().min(1, "End date is required"),
	delivery_address: z.string().min(1, "Delivery address is required"),
	phone_number: z.string().min(1, "Phone number is required"),
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
