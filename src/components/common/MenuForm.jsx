import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { menuSchema } from "../../validations/menuSchema";
import { zodResolver } from "@hookform/resolvers/zod";

// Category display names for better UX
const CATEGORY_DISPLAY_NAMES = {
	Chicken: "Chicken 🍗",
	Pork: "Pork 🐷",
	Beef: "Beef 🥩",
	Vege: "Vegetarian 🥬",
	Salad: "Salad 🥗",
	Seafood: "Seafood 🐟",
	Soup: "Soup 🍲",
	Side: "Side Dishes 🍚",
	Rice: "Rice Dishes 🍚",
	Noodles: "Noodles 🍜",
	Drink: "Drinks 🥤",
	Extra: "Extras & Sides",
	Combo: "Combos 🍱",
	Other: "Others",
};

const ALL_CATEGORIES = [
	"Chicken",
	"Pork",
	"Beef",
	"Vege",
	"Salad",
	"Seafood",
	"Soup",
	"Side",
	"Rice",
	"Noodles",
	"Drink",
	"Extra",
	"Combo",
	"Other",
];

const MenuForm = ({
	editingMenu,
	onSubmit,
	onCancel,
	loading = false,
	isRegularOnly = false,
}) => {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
		watch,
		setValue,
		trigger,
	} = useForm({
		resolver: zodResolver(menuSchema),
		defaultValues: editingMenu
			? {
					...editingMenu,
					sensitive_ingredients: Array.isArray(
						editingMenu.sensitive_ingredients
					)
						? editingMenu.sensitive_ingredients.join(", ")
						: editingMenu.sensitive_ingredients || "",
			  }
			: {
					name_burmese: "",
					name_english: "",
					name_thai: "",
					price: 0,
					category: "Chicken",
					taste_profile: "",
					description: "",
					image_url: "",
					sensitive_ingredients: "",
					is_active: true,
					is_regular: isRegularOnly ? true : false,
			  },
	});

	const watchImageUrl = watch("image_url");
	const watchIsRegular = watch("is_regular");

	useEffect(() => {
		if (editingMenu) {
			reset({
				...editingMenu,
				sensitive_ingredients: Array.isArray(editingMenu.sensitive_ingredients)
					? editingMenu.sensitive_ingredients.join(", ")
					: editingMenu.sensitive_ingredients || "",
			});
		} else {
			reset({
				name_burmese: "",
				name_english: "",
				name_thai: "",
				price: 0,
				category: "Chicken",
				taste_profile: "",
				description: "",
				image_url: "",
				sensitive_ingredients: "",
				is_active: true,
				is_regular: isRegularOnly ? true : false,
			});
		}
	}, [editingMenu, reset, isRegularOnly]);

	const handleFormSubmit = (data) => {
		const processedData = {
			...data,
			sensitive_ingredients: data.sensitive_ingredients
				? data.sensitive_ingredients.split(",").map((item) => item.trim())
				: [],
		};
		onSubmit(processedData);
	};

	const handleMenuTypeChange = (isRegular) => {
		setValue("is_regular", isRegular, { shouldValidate: true });
		trigger("is_regular");
	};

	const isRegularValue = watchIsRegular === true || watchIsRegular === "true";

	return (
		<form
			onSubmit={handleSubmit(handleFormSubmit)}
			className="space-y-4 md:space-y-6">
			{/* Image Preview */}
			{watchImageUrl && (
				<div className="form-control">
					<label className="label">
						<span className="label-text font-medium">Image Preview</span>
					</label>
					<div className="relative w-full h-40 bg-base-200 rounded-lg overflow-hidden border border-base-300">
						<img
							src={watchImageUrl}
							alt="Menu preview"
							className="w-full h-full object-cover"
							onError={(e) => {
								e.target.onerror = null;
								e.target.src =
									"data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'400'%20height%3D'200'%20viewBox%3D'0%200%20400%20200'%3E%3Crect%20width%3D'400'%20height%3D'200'%20fill%3D'%23e5e7eb'%2F%3E%3Ctext%20x%3D'50%25'%20y%3D'50%25'%20font-family%3D'Arial%2C%20sans-serif'%20font-size%3D'16'%20text-anchor%3D'middle'%20dy%3D'.3em'%20fill%3D'%239ca3af'%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E";
							}}
						/>
					</div>
				</div>
			)}

			{/* Basic Information Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
				<div className="form-control">
					<label className="label">
						<span className="label-text font-medium">Burmese Name *</span>
					</label>
					<input
						{...register("name_burmese")}
						className="input input-bordered w-full"
						placeholder="Enter Burmese name"
						disabled={loading}
					/>
					{errors.name_burmese && (
						<label className="label">
							<span className="label-text-alt text-error">
								{errors.name_burmese.message}
							</span>
						</label>
					)}
				</div>

				<div className="form-control">
					<label className="label">
						<span className="label-text font-medium">English Name *</span>
					</label>
					<input
						{...register("name_english")}
						className="input input-bordered w-full"
						placeholder="Enter English name"
						disabled={loading}
					/>
					{errors.name_english && (
						<label className="label">
							<span className="label-text-alt text-error">
								{errors.name_english.message}
							</span>
						</label>
					)}
				</div>

				<div className="form-control">
					<label className="label">
						<span className="label-text font-medium">Thai Name</span>
					</label>
					<input
						{...register("name_thai")}
						className="input input-bordered w-full"
						placeholder="Enter Thai name"
						disabled={loading}
					/>
				</div>

				<div className="form-control">
					<label className="label">
						<span className="label-text font-medium">Price (THB) *</span>
					</label>
					<input
						{...register("price", { valueAsNumber: true })}
						type="number"
						step="0.01"
						min="0"
						className="input input-bordered w-full"
						placeholder="0.00"
						disabled={loading}
					/>
					{errors.price && (
						<label className="label">
							<span className="label-text-alt text-error">
								{errors.price.message}
							</span>
						</label>
					)}
				</div>

				<div className="form-control">
					<label className="label">
						<span className="label-text font-medium">Category *</span>
					</label>
					<select
						{...register("category")}
						className="select select-bordered w-full"
						disabled={loading}>
						{ALL_CATEGORIES.map((category) => (
							<option key={category} value={category}>
								{CATEGORY_DISPLAY_NAMES[category] || category}
							</option>
						))}
					</select>
					{errors.category && (
						<label className="label">
							<span className="label-text-alt text-error">
								{errors.category.message}
							</span>
						</label>
					)}
				</div>

				{!isRegularOnly && (
					<div className="form-control">
						<label className="label">
							<span className="label-text font-medium">Menu Type *</span>
						</label>
						<div className="flex space-x-2">
							<button
								type="button"
								onClick={() => handleMenuTypeChange(true)}
								className={`btn flex-1 ${
									isRegularValue ? "btn-primary" : "btn-outline"
								}`}>
								<span className="text-sm">Regular</span>
							</button>
							<button
								type="button"
								onClick={() => handleMenuTypeChange(false)}
								className={`btn flex-1 ${
									!isRegularValue ? "btn-primary" : "btn-outline"
								}`}>
								<span className="text-sm">Rotating</span>
							</button>
						</div>
						<input
							type="hidden"
							{...register("is_regular")}
							value={isRegularValue}
						/>
					</div>
				)}
			</div>

			{/* Taste Profile and Image URL - Side by side on desktop */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
				<div className="form-control">
					<label className="label">
						<span className="label-text font-medium">Taste Profile</span>
					</label>
					<input
						{...register("taste_profile")}
						className="input input-bordered w-full"
						placeholder="e.g., Spicy, Sweet, Savory"
						disabled={loading}
					/>
				</div>

				<div className="form-control">
					<label className="label">
						<span className="label-text font-medium">Image URL</span>
					</label>
					<input
						{...register("image_url")}
						className="input input-bordered w-full"
						placeholder="https://example.com/image.jpg"
						disabled={loading}
					/>
					<label className="label">
						<span className="label-text-alt text-gray-500 text-xs">
							Leave empty for no image
						</span>
					</label>
				</div>
			</div>

			{/* Description - Full width */}
			<div className="form-control">
				<label className="label">
					<span className="label-text font-medium">Description</span>
				</label>
				<textarea
					{...register("description")}
					className="textarea textarea-bordered h-24 w-full"
					placeholder="Enter description (ingredients, preparation, serving suggestions)"
					disabled={loading}
				/>
			</div>

			{/* Sensitive Ingredients - Full width */}
			<div className="form-control">
				<label className="label">
					<span className="label-text font-medium">Sensitive Ingredients</span>
				</label>
				<input
					{...register("sensitive_ingredients")}
					className="input input-bordered w-full"
					placeholder="Peanuts, Dairy, Gluten, Soy, Shellfish (comma separated)"
					disabled={loading}
				/>
			</div>

			{/* Status Toggles - Side by side */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-2 border-t border-base-300">
				<div className="form-control">
					<label className="label cursor-pointer justify-start gap-3 p-0">
						<input
							{...register("is_active")}
							type="checkbox"
							className="toggle toggle-primary"
							disabled={loading}
						/>
						<div className="flex flex-col">
							<span className="label-text font-medium">Active Menu</span>
						</div>
					</label>
				</div>

				{isRegularOnly && (
					<div className="form-control">
						<label className="label cursor-pointer justify-start gap-3 p-0">
							<input
								type="checkbox"
								checked={true}
								className="toggle toggle-primary"
								disabled
							/>
							<div className="flex flex-col">
								<span className="label-text font-medium">Menu Type</span>
								<span className="label-text-alt text-gray-500">
									Regular - Always Available
								</span>
							</div>
						</label>
					</div>
				)}
			</div>

			{/* Form Errors Summary */}
			{Object.keys(errors).length > 0 && (
				<div className="alert alert-error">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="stroke-current shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
					<div className="text-sm">
						<h3 className="font-bold">Please fix the following errors:</h3>
						<ul className="mt-1">
							{Object.entries(errors).map(([field, error]) => (
								<li key={field} className="flex items-start">
									<span className="mr-1">•</span>
									<span className="capitalize">
										{field.replace(/_/g, " ")}: {error.message}
									</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			)}

			{/* Submit Buttons */}
			<div className="modal-action flex-col sm:flex-row gap-3 pt-4">
				<button
					type="button"
					className="btn btn-outline flex-1 sm:flex-none"
					onClick={onCancel}
					disabled={loading}>
					Cancel
				</button>
				<button
					type="submit"
					className="btn btn-primary flex-1 sm:flex-none"
					disabled={loading}>
					{loading ? (
						<>
							<span className="loading loading-spinner loading-sm"></span>
							{editingMenu ? "Updating..." : "Creating..."}
						</>
					) : editingMenu ? (
						"Update Menu Item"
					) : (
						"Create Menu Item"
					)}
				</button>
			</div>
		</form>
	);
};

export default MenuForm;
