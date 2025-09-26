import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../services/supabase";
import { menuSchema } from "../validations/menuSchema";
import useMenuStore from "../stores/menuStore";

const AllMenuPage = () => {
	const { menus, loading, fetchMenus, addMenu, updateMenu, deleteMenu } =
		useMenuStore();
	const [showModal, setShowModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [editingMenu, setEditingMenu] = useState(null);
	const [selectedMenu, setSelectedMenu] = useState(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
		setValue,
	} = useForm({
		resolver: zodResolver(menuSchema),
	});

	useEffect(() => {
		fetchMenus();
	}, [fetchMenus]);

	const getClassColor = (menuClass) => {
		const colors = {
			A: "badge-error", // 60 THB
			B: "badge-warning", // 50 THB
			C: "badge-info", // 40 THB
			S: "badge-success", // 80 THB Special
			FOC: "badge-neutral", // Free
		};
		return colors[menuClass] || "badge-neutral";
	};

	// eslint-disable-next-line no-unused-vars
	const getClassPrice = (menuClass) => {
		const prices = { A: "60", B: "50", C: "40", S: "80", FOC: "0" };
		return prices[menuClass] || "0";
	};

	const openCreateModal = () => {
		setEditingMenu(null);
		reset({
			name_burmese: "",
			name_english: "",
			name_thai: "",
			price: 0,
			class: "A",
			taste_profile: "",
			category: "Chicken",
			image_url: "",
			description: "",
			sensitive_ingredients: "",
			is_active: true,
		});
		setShowModal(true);
	};

	const openEditModal = (menu) => {
		setEditingMenu(menu);
		setValue("name_burmese", menu.name_burmese);
		setValue("name_english", menu.name_english);
		setValue("name_thai", menu.name_thai || "");
		setValue("price", menu.price);
		setValue("class", menu.class);
		setValue("taste_profile", menu.taste_profile || "");
		setValue("category", menu.category);
		setValue("image_url", menu.image_url || "");
		setValue("description", menu.description || "");
		setValue(
			"sensitive_ingredients",
			Array.isArray(menu.sensitive_ingredients)
				? menu.sensitive_ingredients.join(", ")
				: ""
		);
		setValue("is_active", menu.is_active);
		setShowModal(true);
	};

	const openDetailsModal = (menu) => {
		setSelectedMenu(menu);
		setShowDetailsModal(true);
	};

	const onSubmit = async (data) => {
		try {
			const menuData = {
				...data,
				sensitive_ingredients: data.sensitive_ingredients
					? data.sensitive_ingredients.split(",").map((s) => s.trim())
					: [],
			};

			if (editingMenu) {
				const { error } = await supabase
					.from("menu_items")
					.update(menuData)
					.eq("id", editingMenu.id);

				if (error) throw error;
				updateMenu(editingMenu.id, menuData);
			} else {
				const { data: newMenu, error } = await supabase
					.from("menu_items")
					.insert([menuData]);

				if (error) throw error;
				addMenu(newMenu[0]);
			}

			setShowModal(false);
			reset();
		} catch (error) {
			console.error("Error saving menu:", error);
			alert("Error saving menu item");
		}
	};

	const handleDelete = async (id) => {
		if (confirm("Are you sure you want to delete this menu item?")) {
			try {
				const { error } = await supabase
					.from("menu_items")
					.delete()
					.eq("id", id);

				if (error) throw error;
				deleteMenu(id);
			} catch (error) {
				console.error("Error deleting menu:", error);
				alert("Error deleting menu item");
			}
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<span className="loading loading-spinner loading-lg"></span>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">All Menu Items</h1>
					<p className="text-gray-600">Manage your restaurant menu items</p>
				</div>
				<button className="btn btn-primary" onClick={openCreateModal}>
					<Plus className="w-4 h-4 mr-2" />
					Create Menu Item
				</button>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="table table-zebra w-full">
					<thead>
						<tr>
							<th>Name (English)</th>
							<th>Name (Burmese)</th>
							<th>Category</th>
							<th>Class</th>
							<th>Price</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{menus.map((menu) => (
							<tr key={menu.id}>
								<td>
									<div className="font-medium">{menu.name_english}</div>
									<div className="text-sm text-gray-500">{menu.name_thai}</div>
								</td>
								<td className="font-medium">{menu.name_burmese}</td>
								<td>
									<span className="badge badge-outline">{menu.category}</span>
								</td>
								<td>
									<span className={`badge ${getClassColor(menu.class)}`}>
										{menu.class}
									</span>
								</td>
								<td>₹{menu.price}</td>
								<td>
									<span
										className={`badge ${
											menu.is_active ? "badge-success" : "badge-error"
										}`}>
										{menu.is_active ? "Active" : "Inactive"}
									</span>
								</td>
								<td>
									<div className="flex gap-2">
										<button
											className="btn btn-sm btn-ghost"
											onClick={() => openDetailsModal(menu)}>
											<Eye className="w-4 h-4" />
										</button>
										<button
											className="btn btn-sm btn-ghost"
											onClick={() => openEditModal(menu)}>
											<Edit className="w-4 h-4" />
										</button>
										<button
											className="btn btn-sm btn-ghost text-red-600"
											onClick={() => handleDelete(menu.id)}>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{menus.length === 0 && (
				<div className="text-center py-12">
					<p className="text-gray-500 text-lg">No menu items found</p>
					<button className="btn btn-primary mt-4" onClick={openCreateModal}>
						Create Your First Menu Item
					</button>
				</div>
			)}

			{/* Create/Edit Modal */}
			{showModal && (
				<div className="modal modal-open">
					<div className="modal-box w-11/12 max-w-2xl">
						<h3 className="font-bold text-lg mb-4">
							{editingMenu ? "Edit Menu Item" : "Create New Menu Item"}
						</h3>

						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
										<option value="Vegetarian">Vegetarian</option>
										<option value="Salad">Salad</option>
										<option value="Special">Special</option>
									</select>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Class *</span>
									</label>
									<select
										{...register("class")}
										className="select select-bordered">
										<option value="A">A - 60 THB</option>
										<option value="B">B - 50 THB</option>
										<option value="C">C - 40 THB</option>
										<option value="S">S - 80 THB (Special)</option>
										<option value="FOC">FOC - Free</option>
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
			)}

			{/* Details Modal */}
			{showDetailsModal && selectedMenu && (
				<div className="modal modal-open">
					<div className="modal-box w-11/12 max-w-lg">
						<div className="flex justify-between items-start mb-4">
							<h3 className="font-bold text-lg">Menu Item Details</h3>
							<button
								className="btn btn-sm btn-ghost"
								onClick={() => setShowDetailsModal(false)}>
								<X className="w-4 h-4" />
							</button>
						</div>

						{selectedMenu.image_url && (
							<div className="mb-4">
								<img
									src={selectedMenu.image_url}
									alt={selectedMenu.name_english}
									className="w-full h-48 object-cover rounded-lg"
								/>
							</div>
						)}

						<div className="space-y-3">
							<div>
								<strong>English:</strong> {selectedMenu.name_english}
							</div>
							<div>
								<strong>Burmese:</strong> {selectedMenu.name_burmese}
							</div>
							{selectedMenu.name_thai && (
								<div>
									<strong>Thai:</strong> {selectedMenu.name_thai}
								</div>
							)}
							<div className="flex gap-4">
								<div>
									<strong>Category:</strong>
									<span className="badge badge-outline ml-2">
										{selectedMenu.category}
									</span>
								</div>
								<div>
									<strong>Class:</strong>
									<span
										className={`badge ${getClassColor(
											selectedMenu.class
										)} ml-2`}>
										{selectedMenu.class}
									</span>
								</div>
							</div>
							<div>
								<strong>Price:</strong> ₹{selectedMenu.price}
							</div>
							{selectedMenu.taste_profile && (
								<div>
									<strong>Taste Profile:</strong> {selectedMenu.taste_profile}
								</div>
							)}
							{selectedMenu.description && (
								<div>
									<strong>Description:</strong> {selectedMenu.description}
								</div>
							)}
							{selectedMenu.sensitive_ingredients &&
								selectedMenu.sensitive_ingredients.length > 0 && (
									<div>
										<strong>Sensitive Ingredients:</strong>
										<div className="flex flex-wrap gap-1 mt-1">
											{selectedMenu.sensitive_ingredients.map(
												(ingredient, index) => (
													<span
														key={index}
														className="badge badge-warning badge-sm">
														{ingredient}
													</span>
												)
											)}
										</div>
									</div>
								)}
							<div>
								<strong>Status:</strong>
								<span
									className={`badge ${
										selectedMenu.is_active ? "badge-success" : "badge-error"
									} ml-2`}>
									{selectedMenu.is_active ? "Active" : "Inactive"}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default AllMenuPage;
