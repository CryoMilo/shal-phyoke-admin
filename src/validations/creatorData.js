// schemas/creatorData.js
import { z } from "zod";

// Base pricing structure schema
export const priceSchema = z.object({
	one_time: z.number().min(0, "Price must be 0 or greater"),
	multi: z.object({
		months: z.number().min(1, "Months must be at least 1"),
		value: z.number().min(0, "Value must be 0 or greater"),
	}),
});

// Individual segment pricing schema (optional)
export const segmentPriceSchema = z
	.object({
		AO: priceSchema.optional(),
		WL: priceSchema.optional(),
		WEB: priceSchema.optional(),
		TI: priceSchema.optional(),
		PS: priceSchema.optional(),
		LC: priceSchema.optional(), // Changed from Latecomers to LC
	})
	.optional();

// Course schema with optional segments and new fields
export const courseSchema = z.object({
	name: z.string().min(1, "Course name is required"),
	tag: z.string().min(1, "Course tag is required"),
	modules: z.string().optional(), // New optional field
	videos: z.string().optional(), // New optional field
	content_hours: z.string().optional(), // New optional field
	original_price: priceSchema,
	segments: z.array(z.enum(["AO", "WL", "WEB", "TI", "PS", "LC"])).optional(),
	discount_price: segmentPriceSchema,
});

// Bundle schema with optional segments and new fields
export const bundleSchema = z.object({
	name: z.string().min(1, "Bundle name is required"),
	tag: z.string().min(1, "Bundle tag is required"),
	modules: z.string().optional(), // New optional field
	videos: z.string().optional(), // New optional field
	content_hours: z.string().optional(), // New optional field
	containing_courses: z.array(z.string()).optional(), // New optional field for course references
	original_price: priceSchema,
	segments: z.array(z.enum(["AO", "WL", "WEB", "TI", "PS", "LC"])).optional(),
	discount_price: segmentPriceSchema,
});

// Bonus schema
export const bonusSchema = z.object({
	name: z.string().min(1, "Bonus name is required"),
	description: z.string().min(1, "Description is required"),
	price: z.number().min(0, "Price must be 0 or greater"),
});

// Color schema
export const colorSchema = z.object({
	name: z.string().min(1, "Color name is required"),
	hex_code: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color format"),
});

// Font schema (similar to color schema)
export const fontSchema = z.object({
	name: z.string().min(1, "Font name is required"),
	font_family: z.string().min(1, "Font family is required"),
});

// Main creator data schema
export const creatorDataSchema = z
	.object({
		creator: z.string().min(1, "Creator name is required"),
		am: z.string().min(1, "Account Manager name is required"),
		season: z.string().min(1, "Season is required"),
		year: z
			.number()
			.min(2020, "Year must be 2020 or later")
			.max(2030, "Year must be 2030 or earlier"),
		open_date: z.string().min(1, "Open date is required"),
		close_date: z.string().min(1, "Close date is required"),
		deadline: z.string().min(1, "Deadline is required"),
		creator_language: z.string().min(1, "Creator language is required"),
		website_type: z.enum(["Language", "Art"], {
			errorMap: () => ({
				message: "Website type must be either 'Language' or 'Art'",
			}),
		}),
		currency: z.string().min(1, "Currency is required"),
		language_teaching: z.string().optional(),
		notes: z.string().optional(),
		important_points: z.string().optional(),
		creators_intro: z.string().optional(),
		courses: z.array(courseSchema).optional(),
		bundles: z.array(bundleSchema).optional(),
		bonuses: z.array(bonusSchema).optional(),
		colors: z.array(colorSchema).optional(),
		fonts: z.array(fontSchema).optional(),
	})
	.refine(
		(data) => {
			// Conditional validation: Language teaching field required for Language websites
			if (data.website_type === "Language") {
				return (
					data.language_teaching &&
					data.language_teaching.length > 0
				);
			}
			return true;
		},
		{
			message: "Language teaching is required for Language websites",
			path: ["language_teaching"],
		}
	);

// Default values for forms
export const defaultPriceStructure = {
	one_time: 0,
	multi: { months: 1, value: 0 },
};

// Helper function to create segment pricing only for selected segments
export const createSegmentPricing = (selectedSegments) => {
	const segmentPricing = {};
	selectedSegments.forEach((segment) => {
		segmentPricing[segment] = { ...defaultPriceStructure };
	});
	return segmentPricing;
};

// Helper function to process optional fields - set to "X+" if empty
export const processOptionalFields = (value) => {
	return value && value.trim() !== "" ? value : "X+";
};

// Default form values
export const defaultFormValues = {
	creator: "",
	am: "",
	season: "",
	year: new Date().getFullYear(),
	open_date: "",
	close_date: "",
	deadline: "",
	creator_language: "",
	website_type: "Language",
	currency: "USD",
	language_teaching: "",
	notes: "",
	important_points: "",
	creators_intro: "",
	courses: [],
	bundles: [],
	bonuses: [],
	colors: [],
	fonts: [],
};

// Updated mock data with new fields
export const mockFormValues = {
	creator: "John Doe",
	am: "Jane Smith",
	season: "Fall",
	year: 2025,
	open_date: "2025-08-01",
	close_date: "2025-12-01",
	deadline: "2025-07-31",
	creator_language: "English",
	website_type: "Language",
	currency: "USD",
	language_teaching: "Japanese",
	notes: "This creator specializes in beginner-friendly Japanese lessons with cultural context.",
	important_points: "Focus on practical conversation skills and cultural understanding. Students should feel comfortable making mistakes.",
	creators_intro: "Hello! I'm John, your Japanese language guide. I've been living in Japan for over 10 years and I'm passionate about making Japanese accessible to everyone.",
	courses: [
		{
			name: "Japanese Beginner",
			tag: "JP-BEG",
			modules: "20+", // Optional field with default
			videos: "50+", // Optional field with default
			content_hours: "15+", // Optional field with default
			original_price: {
				one_time: 200,
				multi: {
					months: 3,
					value: 70,
				},
			},
			segments: ["AO", "WL", "WEB", "TI", "PS", "LC"], // Updated segments
			discount_price: {
				AO: { one_time: 150, multi: { months: 3, value: 60 } },
				WL: { one_time: 160, multi: { months: 3, value: 65 } },
				WEB: { one_time: 170, multi: { months: 3, value: 68 } },
				TI: { one_time: 140, multi: { months: 3, value: 55 } },
				PS: { one_time: 130, multi: { months: 2, value: 50 } },
				LC: { one_time: 180, multi: { months: 3, value: 75 } },
			},
		},
	],
	bundles: [
		{
			name: "Language Master Pack",
			tag: "LMP",
			modules: "50+", // Optional field with default
			videos: "120+", // Optional field with default
			content_hours: "40+", // Optional field with default
			containing_courses: ["Japanese Beginner"], // References to courses
			original_price: {
				one_time: 500,
				multi: {
					months: 6,
					value: 90,
				},
			},
			segments: ["AO", "WL", "TI", "PS"], // Only selected segments
			discount_price: {
				AO: { one_time: 450, multi: { months: 6, value: 80 } },
				WL: { one_time: 460, multi: { months: 6, value: 82 } },
				TI: { one_time: 430, multi: { months: 6, value: 78 } },
				PS: { one_time: 420, multi: { months: 5, value: 75 } },
			},
		},
	],
	bonuses: [
		{
			name: "Pronunciation Mastery",
			description: "Bonus module to improve your accent and clarity.",
			price: 0,
		},
		{
			name: "Free eBook",
			description:
				"Get an exclusive eBook on daily Japanese conversation tips.",
			price: 10,
		},
	],
	colors: [
		{
			name: "Primary",
			hex_code: "#5E60CE",
		},
		{
		name: "Accent",
		hex_code: "#F72585",
	},
],
	fonts: [
		{
			name: "Heading Font",
			font_family: "Inter, sans-serif",
		},
		{
			name: "Body Font",
			font_family: "Open Sans, sans-serif",
		},
	],
};

// Constants for form options

export const AVAILABLE_SEGMENTS = [
	{ value: "AO", label: "All Others" },
	{ value: "WL", label: "Waitlist" },
	{ value: "WEB", label: "Webinars" },
	{ value: "TI", label: "Tuesday Installments" },
	{ value: "PS", label: "Past Students" },
	{ value: "LC", label: "Latecomers" }, // Updated from Latecomers
];

export const SEGMENT_LABELS = {
	AO: "All Others",
	WL: "Waitlist",
	WEB: "Webinars",
	TI: "Tuesday Installments",
	PS: "Past Students",
	LC: "Latecomers", // Updated from Latecomers
};

export const SEASONS = ["Spring", "Summer", "Fall", "Winter"];

export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];

export const WEBSITE_TYPES = ["Language", "Art"];

// Helper function to validate segment pricing matches selected segments
export const validateSegmentPricing = (selectedSegments, discountPrice) => {
	if (!selectedSegments || !discountPrice) return true;

	// Check if all selected segments have pricing
	return selectedSegments.every(
		(segment) =>
			discountPrice[segment] &&
			typeof discountPrice[segment].one_time === "number" &&
			discountPrice[segment].multi &&
			typeof discountPrice[segment].multi.value === "number"
	);
};
