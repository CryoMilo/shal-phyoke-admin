// src/components/recipes/RecipeModal.jsx
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { X, ChefHat, Sparkles } from "lucide-react";
import ImageUpload from "../common/ImageUpload";
import useMeasurementUnitStore from "../../stores/measurementUnitStore";
import useMenuStore from "../../stores/menuStore";
import { showToast } from "../../utils/toastUtils";

const RecipeModal = ({ showModal, setShowModal, editingRecipe, onSubmitRecipe, loading }) => {
	const { units, fetchUnits } = useMeasurementUnitStore();
	const { allMenuItems, fetchAllMenuItems } = useMenuStore();
	const [uploadError, setUploadError] = useState("");

	const {
		register,
		handleSubmit: formSubmit,
		control,
		formState: { errors },
		reset,
		watch,
		setValue,
	} = useForm({
		defaultValues: {
			name_burmese: "",
			name_english: "",
			recipe_type: "menu_prep",
			menu_item_id: "",
			yield_quantity: 1,
			yield_unit: "portion",
			image_url: "",
			prep_time_minutes: 15,
			shelf_life_days: 1,
			instructions_burmese: "",
			instructions_english: "",
			notes: "",
		},
	});

	const watchedRecipeType = watch("recipe_type");
	const watchedMenuItemId = watch("menu_item_id");

	useEffect(() => {
		fetchUnits();
		if (allMenuItems.length === 0) {
			fetchAllMenuItems();
		}
	}, [fetchUnits, allMenuItems.length, fetchAllMenuItems]);

	// Auto-fill names and image if user picks a menu_item for a new menu_prep recipe
	useEffect(() => {
		if (watchedRecipeType === "menu_prep" && watchedMenuItemId && !editingRecipe) {
			const selectedMenu = allMenuItems.find((m) => m.id === watchedMenuItemId);
			if (selectedMenu) {
				if (selectedMenu.name_burmese) setValue("name_burmese", selectedMenu.name_burmese);
				if (selectedMenu.name_english) setValue("name_english", selectedMenu.name_english);
				if (selectedMenu.image_url) setValue("image_url", selectedMenu.image_url);
			}
		}
	}, [watchedMenuItemId, watchedRecipeType, editingRecipe, allMenuItems, setValue]);

	useEffect(() => {
		if (editingRecipe) {
			reset({
				name_burmese: editingRecipe.name_burmese || "",
				name_english: editingRecipe.name_english || "",
				recipe_type: editingRecipe.recipe_type || "menu_prep",
				menu_item_id: editingRecipe.menu_item_id || "",
				yield_quantity: editingRecipe.yield_quantity || 1,
				yield_unit: editingRecipe.yield_unit || "portion",
				image_url: editingRecipe.image_url || "",
				prep_time_minutes: editingRecipe.prep_time_minutes || 15,
				shelf_life_days: editingRecipe.shelf_life_days || 1,
				instructions_burmese: editingRecipe.instructions_burmese || "",
				instructions_english: editingRecipe.instructions_english || "",
				notes: editingRecipe.notes || "",
			});
		} else {
			reset({
				name_burmese: "",
				name_english: "",
				recipe_type: "menu_prep",
				menu_item_id: "",
				yield_quantity: 1,
				yield_unit: "portion",
				image_url: "",
				prep_time_minutes: 15,
				shelf_life_days: 1,
				instructions_burmese: "",
				instructions_english: "",
				notes: "",
			});
		}
	}, [editingRecipe, reset]);

	const handleClose = () => {
		reset();
		setUploadError("");
		setShowModal(false);
	};

	const onFormSubmit = async (data) => {
		// Validation: Image mandatory for menu_prep
		if (data.recipe_type === "menu_prep" && !data.image_url) {
			showToast.error("Dish image is mandatory for Menu Preps");
			return;
		}

		const payload = {
			name_burmese: data.name_burmese.trim(),
			name_english: data.name_english.trim(),
			recipe_type: data.recipe_type,
			menu_item_id: data.recipe_type === "menu_prep" && data.menu_item_id ? data.menu_item_id : null,
			yield_quantity: parseFloat(data.yield_quantity) || 1,
			yield_unit: data.yield_unit || "portion",
			image_url: data.image_url || null,
			prep_time_minutes: parseInt(data.prep_time_minutes, 10) || 15,
			shelf_life_days: parseInt(data.shelf_life_days, 10) || 1,
			instructions_burmese: data.instructions_burmese?.trim() || null,
			instructions_english: data.instructions_english?.trim() || null,
			notes: data.notes?.trim() || null,
		};

		const res = await onSubmitRecipe(payload);
		if (res?.success) {
			handleClose();
		}
	};

	if (!showModal) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-2xl relative max-h-[92vh] overflow-y-auto">
				<button
					type="button"
					onClick={handleClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
					<X className="w-4 h-4" />
				</button>

				<div className="mb-6 pr-8">
					<div className="flex items-center gap-2">
						<ChefHat className="w-6 h-6 text-primary" />
						<h3 className="font-bold text-xl leading-relaxed">
							{editingRecipe ? "Edit Recipe / ဟင်းချက်နည်း ပြင်ဆင်ရန်" : "Create New Recipe / ဟင်းချက်နည်း အသစ်ဖွင့်ရန်"}
						</h3>
					</div>
					<p className="text-xs text-base-content/60 mt-1">
						Define bill of materials, yield quantity, instructions, and POS menu link.
					</p>
				</div>

				<form onSubmit={formSubmit(onFormSubmit)} className="space-y-5" noValidate>
					{/* Recipe Type Selector (Segmented Cards) */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text font-semibold text-xs">Recipe Hierarchy Type</span>
						</label>
						<div className="grid grid-cols-2 gap-3">
							<label
								className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
									watchedRecipeType === "menu_prep"
										? "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200"
										: "border-base-200 hover:border-base-300 bg-base-100"
								}`}>
								<input
									type="radio"
									value="menu_prep"
									{...register("recipe_type")}
									className="radio radio-warning radio-sm mt-0.5"
								/>
								<div>
									<span className="font-bold text-xs block">
										Menu Prep (ပွဲပြင်ချက်နည်း)
									</span>
									<span className="text-[11px] text-base-content/60 block mt-0.5">
										Top-level recipe sold directly on the POS. Links to a menu item.
									</span>
								</div>
							</label>

							<label
								className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
									watchedRecipeType === "branch_prep"
										? "border-indigo-500 bg-indigo-500/10 text-indigo-950 dark:text-indigo-200"
										: "border-base-200 hover:border-base-300 bg-base-100"
								}`}>
								<input
									type="radio"
									value="branch_prep"
									{...register("recipe_type")}
									className="radio radio-primary radio-sm mt-0.5"
								/>
								<div>
									<span className="font-bold text-xs block">
										Branch Prep (အခြေခံအနှစ်/ဆီချက်)
									</span>
									<span className="text-[11px] text-base-content/60 block mt-0.5">
										Shared sub-recipe (Garlic Oil, Jaggery Sauce, Shan Curry) reused across dishes.
									</span>
								</div>
							</label>
						</div>
					</div>

					{/* Image Upload */}
					<Controller
						name="image_url"
						control={control}
						render={({ field }) => (
							<ImageUpload
								bucket="menu-images"
								folder="recipes"
								value={field.value}
								onChange={field.onChange}
								label={watchedRecipeType === "menu_prep" ? "Dish Photo (Required)" : "Recipe Photo (Optional)"}
								required={watchedRecipeType === "menu_prep"}
								maxSizeMB={5}
								allowedTypes={["image/jpeg", "image/png", "image/webp"]}
								onError={setUploadError}
								placeholder="Upload photo of finished dish or prepared sauce batch"
							/>
						)}
					/>

					{/* If Menu Prep, Show Menu Item Linker */}
					{watchedRecipeType === "menu_prep" && (
						<div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
							<div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs">
								<Sparkles className="w-4 h-4" /> Link to POS Menu Item
							</div>
							<select
								{...register("menu_item_id")}
								className="select select-bordered select-sm w-full">
								<option value="">-- Select POS Menu Item (Optional) --</option>
								{allMenuItems.map((item) => (
									<option key={item.id} value={item.id}>
										{item.name_burmese} ({item.name_english}) — ฿{item.price}
									</option>
								))}
							</select>
						</div>
					)}

					{/* Bilingual Names */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label" htmlFor="recipe_name_burmese">
								<span className="label-text font-semibold text-primary">
									Burmese Name (မြန်မာအမည်) <span className="text-error">*</span>
								</span>
							</label>
							<input
								id="recipe_name_burmese"
								type="text"
								{...register("name_burmese", { required: "Burmese name is required" })}
								placeholder="ဥပမာ - ရှမ်းခေါက်ဆွဲ၊ ကြက်သွန်ဖြူဆီချက်"
								className={`input input-bordered w-full leading-relaxed ${
									errors.name_burmese ? "input-error" : ""
								}`}
							/>
						</div>

						<div className="form-control">
							<label className="label" htmlFor="recipe_name_english">
								<span className="label-text font-medium">
									English Name <span className="text-error">*</span>
								</span>
							</label>
							<input
								id="recipe_name_english"
								type="text"
								{...register("name_english", { required: "English name is required" })}
								placeholder="e.g. Shan Noodles, Garlic Oil"
								className={`input input-bordered w-full ${
									errors.name_english ? "input-error" : ""
								}`}
							/>
						</div>
					</div>

					{/* Yield & Timing Specification */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-base-200/60 border border-base-300">
						<div className="form-control">
							<label className="label py-1">
								<span className="label-text text-xs font-semibold">Batch Yield Qty</span>
							</label>
							<input
								type="number"
								step="any"
								min="0.1"
								{...register("yield_quantity", { required: true, min: 0.001 })}
								className="input input-bordered input-sm w-full font-bold"
							/>
						</div>

						<div className="form-control">
							<label className="label py-1">
								<span className="label-text text-xs font-semibold">Yield Unit</span>
							</label>
							<select
								{...register("yield_unit")}
								className="select select-bordered select-sm w-full">
								{units.map((u) => (
									<option key={u.code} value={u.code}>
										{u.name_burmese} ({u.code})
									</option>
								))}
							</select>
						</div>

						<div className="form-control">
							<label className="label py-1">
								<span className="label-text text-xs font-semibold">Prep Time (min)</span>
							</label>
							<input
								type="number"
								min="1"
								{...register("prep_time_minutes")}
								className="input input-bordered input-sm w-full"
							/>
						</div>

						<div className="form-control">
							<label className="label py-1">
								<span className="label-text text-xs font-semibold">Shelf Life (days)</span>
							</label>
							<input
								type="number"
								min="1"
								{...register("shelf_life_days")}
								className="input input-bordered input-sm w-full"
							/>
						</div>
					</div>

					{/* Cooking Instructions (Bilingual) */}
					<div className="space-y-3">
						<div className="form-control">
							<label className="label py-1">
								<span className="label-text text-xs font-semibold">
									Instructions in Burmese (ချက်ပြုတ်ပုံ အဆင့်ဆင့်)
								</span>
							</label>
							<textarea
								rows={3}
								{...register("instructions_burmese")}
								placeholder="၁။ ဆီကို အပူပေးပါ...&#10;၂။ ကြက်သွန်ဖြူထည့်၍ ရွှေဝါရောင်သန်းသည်အထိ မွှေပေးပါ..."
								className="textarea textarea-bordered w-full leading-relaxed text-xs"
							/>
						</div>

						<div className="form-control">
							<label className="label py-1">
								<span className="label-text text-xs font-semibold">
									Instructions in English (Optional)
								</span>
							</label>
							<textarea
								rows={2}
								{...register("instructions_english")}
								placeholder="1. Heat oil in wok...&#10;2. Fry garlic until aromatic and golden brown..."
								className="textarea textarea-bordered w-full text-xs"
							/>
						</div>
					</div>

					{/* Upload Error Alert */}
					{uploadError && (
						<div className="alert alert-error text-xs py-2">
							<span>{uploadError}</span>
						</div>
					)}

					{/* Actions */}
					<div className="modal-action">
						<button
							type="button"
							onClick={handleClose}
							className="btn btn-ghost"
							disabled={loading}>
							Cancel
						</button>
						<button
							type="submit"
							className="btn btn-primary min-w-[120px]"
							disabled={loading || !!uploadError}>
							{loading ? (
								<span className="loading loading-spinner loading-sm"></span>
							) : editingRecipe ? (
								"Save Changes"
							) : (
								"Create Recipe"
							)}
						</button>
					</div>
				</form>
			</div>
			<div className="modal-backdrop" onClick={handleClose} />
		</div>
	);
};

export default RecipeModal;
