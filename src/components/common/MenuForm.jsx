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
	const watchStockLinkId = watch("stock_link_id");
	const isLinkedStock =
		watchStockLinkId !== null &&
		watchStockLinkId !== "" &&
		watchStockLinkId !== "select_master";
	const selectedMasterForBadge = isLinkedStock
		? allMenuItems.find((m) => String(m.id) === String(watchStockLinkId))
		: null;

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
		const finalStockLinkId =
			data.stock_link_id === "select_master" || data.stock_link_id === ""
				? null
				: data.stock_link_id;
		const finalConsumptionRatio =
			finalStockLinkId === null
				? 1
				: parseInt(data.stock_consumption_ratio, 10) || 1;

		const processedData = {
			...data,
			stock_quantity:
				finalStockLinkId !== null
					? null
					: typeof data.stock_quantity === "number"
					? data.stock_quantity
					: parseInt(data.stock_quantity, 10) || -1,
			stock_link_id: finalStockLinkId,
			stock_consumption_ratio: finalConsumptionRatio,
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
				{/* Top Section: Image Upload (Left) & Stock Control (Right) */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-base-200/50 p-4 rounded-xl border border-base-300">
					{/* Left Column: Image Upload */}
					<div className="flex flex-col justify-center">
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

					{/* Right Column: Stock Quantity Control */}
					<div className="flex flex-col justify-between">
						<Controller
							name="stock_quantity"
							control={control}
							render={({ field }) => {
								const stockVal =
									typeof field.value === "number"
										? field.value
										: parseInt(field.value, 10) || -1;
								const isUnlimited = stockVal === -1;

								const handleIncrement = (delta) => {
									if (isUnlimited) {
										field.onChange(1);
									} else {
										const next = Math.max(0, stockVal + delta);
										field.onChange(next);
									}
								};

								const handleToggleUnlimited = () => {
									if (isUnlimited) {
										field.onChange(10); // default starting stock
									} else {
										field.onChange(-1);
									}
								};

								return (
									<div className="form-control h-full flex flex-col justify-between">
										<label className="label py-1">
											<span className="label-text font-medium text-xs text-base-content/80">
												Stock Quantity
											</span>
										</label>

										{isLinkedStock ? (
											<div className="bg-info/10 text-info p-4 rounded-xl border border-info/20 flex-1 flex flex-col justify-center gap-3">
												<div className="flex items-start gap-3">
													<span className="text-xl">ℹ️</span>
													<p className="text-sm">
														Direct stock input is disabled for this item because
														its stock is linked to{" "}
														<strong>
															{selectedMasterForBadge
																? selectedMasterForBadge.name_english ||
																  selectedMasterForBadge.name_burmese
																: "Master Item"}
														</strong>
														. Physical inventory is managed on the master item.
													</p>
												</div>
											</div>
										) : (
											<div className="bg-base-100 p-4 rounded-xl border border-base-300 flex-1 flex flex-col justify-center gap-3">
												<div className="flex items-center justify-between gap-3">
													<div className="flex items-center gap-2 flex-1">
														<button
															type="button"
															className="btn btn-circle btn-outline btn-sm font-bold text-lg"
															onClick={() => handleIncrement(-1)}
															disabled={
																loading || isUnlimited || stockVal <= 0
															}>
															-
														</button>

														<div className="flex-1 text-center">
															{isUnlimited ? (
																<span className="text-2xl font-bold text-primary">
																	∞
																</span>
															) : (
																<input
																	type="number"
																	className="input input-bordered input-sm w-full text-center font-bold text-lg"
																	value={stockVal}
																	onChange={(e) => {
																		const val = parseInt(e.target.value, 10);
																		field.onChange(
																			isNaN(val) ? 0 : Math.max(0, val)
																		);
																	}}
																	disabled={loading}
																/>
															)}
														</div>

														<button
															type="button"
															className="btn btn-circle btn-outline btn-sm font-bold text-lg"
															onClick={() => handleIncrement(1)}
															disabled={loading}>
															+
														</button>
													</div>
												</div>

												<div className="flex items-center justify-between border-t border-base-200 pt-2">
													<span className="text-xs font-semibold text-base-content/70">
														Unlimited Stock (∞)
													</span>
													<input
														type="checkbox"
														className="toggle toggle-primary toggle-sm"
														checked={isUnlimited}
														onChange={handleToggleUnlimited}
														disabled={loading}
													/>
												</div>
											</div>
										)}

										{!isLinkedStock && (
											<label className="label py-1">
												<span className="label-text-alt text-gray-500">
													{isUnlimited
														? "Stock is unlimited."
														: stockVal === 0
														? "Item will automatically show as Out of Stock."
														: `Stock will drop by 1 with each order.`}
												</span>
											</label>
										)}
									</div>
								);
							}}
						/>
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

			{/* Stock Link Tab */}
			<div
				className={
					activeTab === "stock" ? "block space-y-4 md:space-y-6" : "hidden"
				}>
				<div className="bg-base-200/50 p-6 rounded-xl border border-base-300">
					<h3 className="font-bold text-lg mb-4">
						Stock Linking Configuration
					</h3>

					{/* Strategy Selector */}
					<Controller
						name="stock_link_id"
						control={control}
						render={({ field }) => {
							const isLinked = field.value !== null && field.value !== "";
							return (
								<div className="space-y-6">
									<div className="form-control">
										<label className="label cursor-pointer justify-start gap-4 p-4 border rounded-lg bg-base-100 hover:border-primary transition-colors">
											<input
												type="radio"
												name="stock_strategy"
												className="radio radio-primary"
												checked={!isLinked}
												onChange={() => {
													field.onChange(null);
													const currentStock = watch("stock_quantity");
													if (currentStock === null) {
														setValue("stock_quantity", -1);
													}
												}}
											/>
											<div>
												<span className="font-bold block">
													Standalone Stock
												</span>
												<span className="text-sm text-base-content/70">
													Use this item's own direct stock count
												</span>
											</div>
										</label>
									</div>
									<div className="form-control">
										<label className="label cursor-pointer justify-start gap-4 p-4 border rounded-lg bg-base-100 hover:border-primary transition-colors">
											<input
												type="radio"
												name="stock_strategy"
												className="radio radio-primary"
												checked={isLinked}
												onChange={() => {
													if (!field.value) field.onChange("select_master");
													setValue("stock_quantity", null);
												}}
											/>
											<div>
												<span className="font-bold block">Linked Stock</span>
												<span className="text-sm text-base-content/70">
													Derive from master item's stock
												</span>
											</div>
										</label>
									</div>

									{isLinked && (
										<div className="mt-4 p-4 bg-base-100 rounded-xl border border-primary/20 space-y-4">
											<div className="form-control">
												<label className="label">
													<span className="label-text font-bold">
														Select Master Item
													</span>
												</label>
												<select
													className="select select-bordered w-full"
													value={
														field.value === "select_master"
															? ""
															: field.value || ""
													}
													onChange={(e) => field.onChange(e.target.value)}>
													<option value="" disabled>
														-- Select a master item --
													</option>
													{allMenuItems
														.filter(
															(m) => String(m.id) !== String(editingMenu?.id)
														)
														.map((m) => (
															<option key={m.id} value={m.id}>
																{m.name_burmese}{" "}
																{m.name_english && `(${m.name_english})`} -
																Stock:{" "}
																{m.stock_quantity === -1
																	? "∞"
																	: m.stock_quantity}
															</option>
														))}
												</select>
											</div>

											<Controller
												name="stock_consumption_ratio"
												control={control}
												render={({ field: ratioField }) => {
													const ratio = parseInt(ratioField.value, 10) || 1;
													const selectedMaster = allMenuItems.find(
														(m) => String(m.id) === String(field.value)
													);

													let previewText =
														"Please select a master item to see the preview.";
													let previewClass = "bg-base-200/50";

													if (selectedMaster) {
														if (selectedMaster.stock_quantity === -1) {
															previewText = `👉 Preview: Master item has unlimited stock. This dish will also be unlimited.`;
															previewClass = "bg-info/10 text-info";
														} else if (selectedMaster.stock_quantity === 0) {
															previewText = `🚫 Preview: Master item is out of stock. This dish will show as SOLD OUT on the POS grid.`;
															previewClass = "bg-error/10 text-error";
														} else {
															const yieldAmount = Math.floor(
																selectedMaster.stock_quantity / ratio
															);
															previewText = `👉 Preview: With ${selectedMaster.stock_quantity} units in stock, this dish will display as ${yieldAmount} servings available on the POS grid.`;
															previewClass =
																"bg-success/10 text-success-content";
														}
													}

													return (
														<>
															<div className="form-control">
																<label className="label">
																	<span className="label-text font-bold">
																		Consumption Ratio per Portion
																	</span>
																	<span className="label-text-alt text-base-content/60">
																		How many units of the master item does 1
																		order consume?
																	</span>
																</label>
																<div className="flex items-center gap-3">
																	<button
																		type="button"
																		className="btn btn-circle btn-sm btn-outline"
																		onClick={() =>
																			ratioField.onChange(
																				Math.max(1, ratio - 1)
																			)
																		}>
																		-
																	</button>
																	<span className="font-bold text-lg w-8 text-center">
																		{ratio}
																	</span>
																	<button
																		type="button"
																		className="btn btn-circle btn-sm btn-outline"
																		onClick={() =>
																			ratioField.onChange(ratio + 1)
																		}>
																		+
																	</button>
																</div>
															</div>

															<div
																className={`mt-4 p-4 rounded-lg border font-medium text-sm ${previewClass}`}>
																{previewText}
															</div>
														</>
													);
												}}
											/>
										</div>
									)}
								</div>
							);
						}}
					/>
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
