import z from "zod";

export const subscriberOrderSchema = z.object({
	subscriber_id: z.string().min(1, "Please select a subscriber"),
	day_selection: z.enum(["today", "tomorrow"], {
		errorMap: () => ({ message: "Please select either today or tomorrow" }),
	}),
	menu_selections: z
		.array(z.string())
		.min(1, "Please select at least one menu item"),
	eat_in: z.boolean().default(false),
	note: z.string().optional(),
});
