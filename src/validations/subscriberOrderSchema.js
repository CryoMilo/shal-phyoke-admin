import z from "zod";

// Validation Schema
export const subscriberOrderSchema = z.object({
	subscriber_id: z.string().min(1, "Subscriber is required"),
	order_date: z.string().min(1, "Order date is required"),
	menu_items: z.array(z.string()).min(1, "At least one menu item is required"),
	eat_in: z.boolean().default(false),
	point_use: z.number().min(1, "Points must be at least 1"),
	add_on: z.string().optional(),
	note: z.string().optional(),
	status: z
		.enum(["Cooking", "Ready", "Delivering", "Delivered", "Cancelled"])
		.default("Cooking"),
});
