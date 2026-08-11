import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { menuSchema } from "../../validations/menuSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ALL_CATEGORIES, CATEGORY_DISPLAY_NAMES, MENU_TAGS } from "../../constants";
import ImageUploadField from "./ImageUploadField";
import useQuickNoteStore from "../../stores/quickNoteStore";
import useMenuStore from "../../stores/menuStore";

const MenuForm = ({
	editingMenu,
	onSubmit,
	onCancel,
	loading = false,
	isRegularOnly = false,
	activeTab = "basic",
}) => {
	const { activeNotes, fetchActiveNotes } = useQuickNoteStore();
	const { allMenuItems } = useMenuStore();

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
		watch,
		setValue,
		trigger,
		control,
	} = useForm({
		resolver: zodResolver(menuSchema),
		defaultValues: editingMenu
			? {
					...editingMenu,
					stock_quantity: editingMenu?.stock_quantity ?? -1,
					aliases: Array.isArray(editingMenu?.aliases)
						? editingMenu.aliases.join(", ")
						: typeof editingMenu?.aliases === "string"
						? editingMenu.aliases
						: "",
					requires_addon: editingMenu?.requires_addon ?? false,
					is_vegan: editingMenu?.is_vegan ?? false,
					quick_note_ids: editingMenu?.quick_note_ids ?? [],
					tags: editingMenu?.tags ?? [],
					stock_link_id: editingMenu?.stock_link_id ?? null,
					stock_consumption_ratio: editingMenu?.stock_consumption_ratio ?? 1,
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
					stock_quantity: -1,
					aliases: "",
					category: "Rice",
					taste_profile: "",
					description: "",
					image_url: "",
					sensitive_ingredients: "",
					is_active: true,
					is_regular: isRegularOnly ? true : false,
					is_vegan: false,
					requires_addon: false,
					quick_note_ids: [],
					tags: [],
					stock_link_id: null,
					stock_consumption_ratio: 1,
			  },
	});

	useEffect(() => {
		fetchActiveNotes();
	}, [fetchActiveNotes]);

	const watchIsRegular = watch("is_regular");

	useEffect(() => {
		if (editingMenu) {
			reset({
				...editingMenu,
				stock_quantity: editingMenu?.stock_quantity ?? -1,
				aliases: Array.isArray(editingMenu?.aliases)
					? editingMenu.aliases.join(", ")
					: typeof editingMenu?.aliases === "string"
					? editingMenu.aliases
					: "",
				requires_addon: editingMenu?.requires_addon ?? false,
				is_vegan: editingMenu?.is_vegan ?? false,
				quick_note_ids: editingMenu?.quick_note_ids ?? [],
				tags: editingMenu?.tags ?? [],
				stock_link_id: editingMenu?.stock_link_id ?? null,
				stock_consumption_ratio: editingMenu?.stock_consumption_ratio ?? 1,
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
				stock_quantity: -1,
				aliases: "",
				category: "Rice",
				taste_profile: "",
				description: "",
				image_url: "",
				sensitive_ingredients: "",
				is_active: true,
				is_regular: isRegularOnly ? true : false,
				is_vegan: false,
				requires_addon: false,
				quick_note_ids: [],
				tags: [],
				stock_link_id: null,
				stock_consumption_ratio: 1,
			});
		}
	}, [editingMenu, reset, isRegularOnly]);

	const handleFormSubmit = (data) => {
		const rawAliases =
			typeof data.aliases === "string"
				? data.aliases
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean)
				: Array.isArray(data.aliases)
				? data.aliases
				: [];

		const processedData = {
			...data,
			stock_quantity: -1,
			stock_link_id: null,
			stock_consumption_ratio: 1,
			aliases: rawAliases,
			sensitive_ingredients: data.sensitive_ingredients
				? data.sensitive_ingredients.split(",").map((item) => item.trim())
				: [],
			tags: Array.isArray(data.tags) ? data.tags : [],
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
			<div
				className={
					activeTab === "basic" ? "block space-y-4 md:space-y-6" : "hidden"
				}>
				{/* Top Section: Image Upload */}
				<div className="bg-base-200/50 p-4 rounded-xl border border-base-300 flex flex-col items-center justify-center">
					<div className="w-full max-w-md">
						<ImageUploadField
							name="image_url"
							control={control}
							bucket="menu_items"
							label="Menu Item Image"
							placeholder="Optional: Upload photo"
							required={false}
						/>
						{errors.image_url && (
							<label className="label">
								<span className="label-text-alt text-error">
									{errors.image_url.message}
								</span>
							</label>
						)}
					</div>
				</div>

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

					<div className="form-control col-span-1 md:col-span-2">
						<label className="label">
							<span className="label-text font-medium">
								Aliases (Comma separated)
							</span>
						</label>
						<input
							{...register("aliases")}
							className="input input-bordered w-full"
							placeholder="e.g., Mohinga, Fish Soup, Noodle Soup"
							disabled={loading}
						/>
						<label className="label">
							<span className="label-text-alt text-gray-500">
								Alternative or search keywords for this item.
							</span>
						</label>
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

				{/* Taste Profile */}
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
						<span className="label-text font-medium">
							Sensitive Ingredients
						</span>
					</label>
					<input
						{...register("sensitive_ingredients")}
						className="input input-bordered w-full"
						placeholder="Peanuts, Dairy, Gluten, Soy, Shellfish (comma separated)"
						disabled={loading}
					/>
				</div>

				{/* Quick Note Assignment */}
				<div className="bg-base-200/30 p-4 rounded-xl border border-base-300">
					<label className="label pt-0">
						<span className="label-text font-bold text-sm">
							Quick Note Assignment
						</span>
					</label>
					<p className="text-[10px] text-gray-500 mb-3 -mt-1 italic">
						Choose which note templates from the library should appear when
						ordering this item.
					</p>

					<Controller
						name="quick_note_ids"
						control={control}
						render={({ field }) => (
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								{activeNotes.length > 0 ? (
									activeNotes.map((note) => (
										<label
											key={note.id}
											className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-base-200 ${
												field.value?.includes(note.id)
													? "border-primary bg-primary/5"
													: "border-base-300 bg-base-100"
											}`}>
											<input
												type="checkbox"
												className="checkbox checkbox-xs checkbox-primary"
												checked={field.value?.includes(note.id)}
												onChange={() => {
													const newValue = field.value?.includes(note.id)
														? field.value.filter((id) => id !== note.id)
														: [...(field.value || []), note.id];
													field.onChange(newValue);
												}}
											/>
											<div className="flex flex-col min-w-0">
												<span className="text-xs font-bold truncate">
													{note.label}
												</span>
												<span className="text-[8px] opacity-60 truncate">
													{note.type === "radio"
														? "Single Choice"
														: "Multi-select"}
												</span>
											</div>
										</label>
									))
								) : (
									<p className="col-span-full text-xs text-center opacity-50 py-4 italic">
										No active note templates found in library.
									</p>
								)}
							</div>
						)}
					/>
				</div>

				{/* Tag Assignment */}
				<div className="bg-base-200/30 p-4 rounded-xl border border-base-300">
					<label className="label pt-0">
						<span className="label-text font-bold text-sm">
							Tag Assignment
						</span>
					</label>
					<p className="text-[10px] text-gray-500 mb-3 -mt-1 italic">
						Select tags to categorize this item for special behaviors (e.g., Night menu).
					</p>

					<Controller
						name="tags"
						control={control}
						render={({ field }) => (
							<div className="flex flex-wrap gap-3">
								{MENU_TAGS.map((tag) => {
									const isSelected = field.value?.includes(tag);
									return (
										<label
											key={tag}
											className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all hover:bg-base-200 ${
												isSelected
													? "border-primary bg-primary/5 text-primary"
													: "border-base-300 bg-base-100 text-base-content/85"
											}`}>
											<input
												type="checkbox"
												className="checkbox checkbox-xs checkbox-primary"
												checked={isSelected || false}
												onChange={() => {
													const currentVal = field.value || [];
													const newValue = isSelected
														? currentVal.filter((t) => t !== tag)
														: [...currentVal, tag];
													field.onChange(newValue);
												}}
											/>
											<span className="text-xs font-bold capitalize">
												{tag}
											</span>
										</label>
									);
								})}
							</div>
						)}
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

					<div className="form-control">
						<label className="label cursor-pointer justify-start gap-3 p-0">
							<input
								{...register("is_vegan")}
								type="checkbox"
								className="toggle toggle-success"
								disabled={loading}
							/>
							<div className="flex flex-col">
								<span className="label-text font-medium">Vegan</span>
								<span className="label-text-alt text-gray-500">
									Mark this item as vegan-friendly
								</span>
							</div>
						</label>
					</div>

					<div className="form-control">
						<label className="label cursor-pointer justify-start gap-3 p-0">
							<input
								{...register("requires_addon")}
								type="checkbox"
								className="toggle toggle-accent"
								disabled={loading}
							/>
							<div className="flex flex-col">
								<span className="label-text font-medium">Must have Add-on</span>
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
