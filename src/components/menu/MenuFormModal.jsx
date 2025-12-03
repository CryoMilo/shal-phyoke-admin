import React from "react";
import { useForm } from "react-hook-form";
import { menuSchema } from "../../validations/menuSchema";
import { zodResolver } from "@hookform/resolvers/zod";

const MenuFormModal = ({
	showModal,
	setShowModal,
	editingMenu,
	handleSubmit,
}) => {
	const {
		register,
		handleSubmit: formHandleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(menuSchema),
		defaultValues: editingMenu
			? {
					...editingMenu,
					sensitive_ingredients: Array.isArray(
						editingMenu.sensitive_ingredients
					)
						? editingMenu.sensitive_ingredients.join(", ")
						: "",
			  }
			: {},
	});

	if (!showModal) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box w-11/12 max-w-2xl">
				<h3 className="font-bold text-lg mb-4">
					{editingMenu ? "Edit Menu Item" : "Create New Menu Item"}
				</h3>

				<form onSubmit={formHandleSubmit(handleSubmit)} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text">English Name *</span>
							</label>
							<input
								{...register("name_english")}
								className="input input-bordered"
								placeholder="Enter English name"
							/>
							{errors.name_english && (
								<span className="text-red-500 text-sm">
									{errors.name_english.message}
								</span>
							)}
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text">Burmese Name *</span>
							</label>
							<input
								{...register("name_burmese")}
								className="input input-bordered"
								placeholder="Enter Burmese name"
							/>
							{errors.name_burmese && (
								<span className="text-red-500 text-sm">
									{errors.name_burmese.message}
								</span>
							)}
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text">Thai Name</span>
							</label>
							<input
								{...register("name_thai")}
								className="input input-bordered"
								placeholder="Enter Thai name"
							/>
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text">Category *</span>
							</label>
							<select
								{...register("category")}
								className="select select-bordered">
								<option value="Chicken">Chicken</option>
								<option value="Pork">Pork</option>
								<option value="Beef">Beef</option>
								<option value="Vege">Vege</option>
								<option value="Salad">Salad</option>
								<option value="Special">Special</option>
								<option value="Regular">Regular</option>
								<option value="Regular_Drinks">Regular Drinks</option>
								<option value="Regular_Extras">Regular Extras</option>
							</select>
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text">Price *</span>
							</label>
							<input
								{...register("price", { valueAsNumber: true })}
								type="number"
								step="0.01"
								className="input input-bordered"
								placeholder="0.00"
							/>
							{errors.price && (
								<span className="text-red-500 text-sm">
									{errors.price.message}
								</span>
							)}
						</div>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Taste Profile</span>
						</label>
						<input
							{...register("taste_profile")}
							className="input input-bordered"
							placeholder="e.g., Spicy, Sweet, Savory"
						/>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Image URL</span>
						</label>
						<input
							{...register("image_url")}
							className="input input-bordered"
							placeholder="https://example.com/image.jpg"
						/>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Description</span>
						</label>
						<textarea
							{...register("description")}
							className="textarea textarea-bordered"
							placeholder="Enter description"
							rows="3"></textarea>
					</div>

					<div className="form-control">
						<label className="label">
							<span className="label-text">Sensitive Ingredients</span>
						</label>
						<input
							{...register("sensitive_ingredients")}
							className="input input-bordered"
							placeholder="Comma separated, e.g., Peanuts, Dairy, Gluten"
						/>
					</div>

					<div className="form-control">
						<label className="label cursor-pointer">
							<span className="label-text">Active</span>
							<input
								{...register("is_active")}
								type="checkbox"
								className="toggle toggle-primary"
							/>
						</label>
					</div>

					<div className="modal-action">
						<button
							type="button"
							className="btn btn-ghost"
							onClick={() => setShowModal(false)}>
							Cancel
						</button>
						<button type="submit" className="btn btn-primary">
							{editingMenu ? "Update" : "Create"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default MenuFormModal;
