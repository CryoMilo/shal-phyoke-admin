import {
	Leaf,
	Package,
	Beef,
	Flame,
	Droplets,
	Ban,
	CircleOff,
	Sparkles,
	Utensils,
	Wind,
	ArrowDown,
	ArrowUp,
	Coffee,
	Milk,
	Check,
	Cloud,
} from "lucide-react";

export const DEFAULT_ORDER_NOTES = [
	{ id: "no_vege", label: "No Vege", icon: Leaf, color: "text-green-500" },
	{
		id: "takeaway",
		label: "Takeaway",
		icon: Package,
		color: "text-orange-500",
	},
	{ id: "no_meat", label: "No Meat", icon: Beef, color: "text-red-500" },
	{ id: "less_spicy", label: "Less Spicy", icon: Wind, color: "text-blue-400" },
	{
		id: "extra_spicy",
		label: "Extra Spicy",
		icon: Flame,
		color: "text-red-600",
	},
	{ id: "no_chili", label: "No Chili", icon: Ban, color: "text-orange-600" },
	{
		id: "no_onions",
		label: "No Onions",
		icon: CircleOff,
		color: "text-yellow-600",
	},
	{ id: "no_garlic", label: "No Garlic", icon: Ban, color: "text-gray-500" },
	{
		id: "more_sauce",
		label: "More Sauce",
		icon: Droplets,
		color: "text-blue-600",
	},
	{ id: "no_msg", label: "No MSG", icon: Sparkles, color: "text-purple-500" },
	{
		id: "well_done",
		label: "Well Done",
		icon: Utensils,
		color: "text-amber-700",
	},
	{
		id: "less_oil",
		label: "Less Oil",
		icon: Droplets,
		color: "text-yellow-500",
	},
];

export const CATEGORY_SPECIFIC_NOTES = {
	Drink: [
		{ id: "no_sweet", label: "No Sweet", icon: Ban, color: "text-red-500" },
		{
			id: "less_sweet",
			label: "Less Sweet",
			icon: ArrowDown,
			color: "text-blue-500",
		},
		{
			id: "extra_sweet",
			label: "Extra Sweet",
			icon: ArrowUp,
			color: "text-red-600",
		},
		{
			id: "normal_sweet",
			label: "ပုံမှန်",
			icon: Check,
			color: "text-green-500",
		},
		{
			id: "sweet_creamy",
			label: "ချိုဆိမ့်",
			icon: Milk,
			color: "text-pink-400",
		},
		{
			id: "strong_creamy",
			label: "ကျဆိမ့်",
			icon: Coffee,
			color: "text-amber-800",
		},
		{
			id: "light_creamy",
			label: "ပေါ့ဆိမ့်",
			icon: Cloud,
			color: "text-blue-300",
		},
		{
			id: "takeaway_drink",
			label: "Takeaway",
			icon: Package,
			color: "text-orange-500",
		},
	],
};
