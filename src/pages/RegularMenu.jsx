import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegularMenuStore } from "../stores/regularMenuStore";
import { regularMenuSchema } from "../validations/regularMenuSchema";
import { PageHeader } from "../components/common/PageHeader";

const RegularMenuPage = () => {
	const {
		menus,
		loading,
		fetchMenus,
		createMenu,
		updateMenuById,
		deleteMenuById,
	} = useRegularMenuStore();

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
		watch,
	} = useForm({
		resolver: zodResolver(regularMenuSchema),
	});

	const watchImageUrl = watch("image_url");

	useEffect(() => {
		fetchMenus();
	}, []);

	const openCreateModal = () => {
		setEditingMenu(null);
		reset({
			name: "",
			name_eng: "",
			name_thai: "",
			price: 0,
			category: "",
			taste_profile: "",
			description: "",
			image_url: "",
			is_vegan: false,
			is_active: true,
		});
		setShowModal(true);
	};

	const openEditModal = (menu) => {
		setEditingMenu(menu);
		setValue("name", menu.name);
		setValue("name_eng", menu.name_eng || "");
		setValue("name_thai", menu.name_thai || "");
		setValue("price", menu.price);
		setValue("category", menu.category);
		setValue("taste_profile", menu.taste_profile || "");
		setValue("description", menu.description || "");
		setValue("image_url", menu.image_url || "");
		setValue("is_vegan", menu.is_vegan);
		setValue("is_active", menu.is_active);
		setShowModal(true);
	};

	const openDetailsModal = (menu) => {
		setSelectedMenu(menu);
		setShowDetailsModal(true);
	};

	const onSubmit = async (data) => {
		try {
			let result;
			if (editingMenu) {
				result = await updateMenuById(editingMenu.id, data);
			} else {
				result = await createMenu(data);
			}

			if (result.error) {
				throw result.error;
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
				const result = await deleteMenuById(id);
				if (result.error) {
					throw result.error;
				}
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
			<PageHeader
				title="Regular Menu Items"
				buttons={[
					{
						type: "button",
						label: "Create Menu Item",
						shortLabel: "Create Menu Item",
						icon: Plus,
						onClick: () => openCreateModal(true),
						variant: "primary",
					},
				]}
			/>

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="table table-zebra w-full">
					<thead>
						<tr>
							<th>Name (English)</th>
							<th>Name (Burmese)</th>
							<th>Category</th>
							<th>Price</th>
							<th>Vegan</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{menus.map((menu) => (
							<tr key={menu.id}>
								<td>
									<div className="font-medium">{menu.name_eng || "-"}</div>
									<div className="text-sm text-gray-500">
										{menu.name_thai || "-"}
									</div>
								</td>
								<td className="font-medium">{menu.name}</td>
								<td>
									<span className="badge badge-outline">{menu.category}</span>
								</td>
								<td>฿{menu.price}</td>
								<td>
									{menu.is_vegan && (
										<span className="badge badge-success badge-sm">Vegan</span>
									)}
								</td>
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

						<div className="space-y-4">
							{/* Image Preview */}
							{watchImageUrl && (
								<div className="form-control">
									<label className="label">
										<span className="label-text">Image Preview</span>
									</label>
									<div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
										<img
											src={watchImageUrl}
											alt="Menu preview"
											className="w-full h-full object-cover"
											onError={(e) => {
												e.target.style.display = "none";
											}}
										/>
									</div>
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="form-control">
									<label className="label">
										<span className="label-text">Name (Burmese) *</span>
									</label>
									<input
										{...register("name")}
										className="input input-bordered"
										placeholder="Enter Burmese name"
									/>
									{errors.name && (
										<span className="text-red-500 text-sm">
											{errors.name.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Name (English)</span>
									</label>
									<input
										{...register("name_eng")}
										className="input input-bordered"
										placeholder="Enter English name"
									/>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Name (Thai)</span>
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
									<input
										{...register("category")}
										className="input input-bordered"
										placeholder="e.g., Appetizer, Main Course"
									/>
									{errors.category && (
										<span className="text-red-500 text-sm">
											{errors.category.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Price (THB) *</span>
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

							<div className="flex gap-6">
								<div className="form-control">
									<label className="label cursor-pointer">
										<span className="label-text mr-2">Vegan</span>
										<input
											{...register("is_vegan")}
											type="checkbox"
											className="checkbox checkbox-primary"
										/>
									</label>
								</div>

								<div className="form-control">
									<label className="label cursor-pointer">
										<span className="label-text mr-2">Active</span>
										<input
											{...register("is_active")}
											type="checkbox"
											className="toggle toggle-primary"
										/>
									</label>
								</div>
							</div>

							<div className="modal-action">
								<button
									type="button"
									className="btn btn-ghost"
									onClick={() => setShowModal(false)}>
									Cancel
								</button>
								<button
									onClick={handleSubmit(onSubmit)}
									className="btn btn-primary">
									{editingMenu ? "Update" : "Create"}
								</button>
							</div>
						</div>
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
									alt={selectedMenu.name_eng}
									className="w-full h-48 object-cover rounded-lg"
								/>
							</div>
						)}

						<div className="space-y-3">
							<div>
								<strong>Burmese:</strong> {selectedMenu.name}
							</div>
							{selectedMenu.name_eng && (
								<div>
									<strong>English:</strong> {selectedMenu.name_eng}
								</div>
							)}
							{selectedMenu.name_thai && (
								<div>
									<strong>Thai:</strong> {selectedMenu.name_thai}
								</div>
							)}
							<div>
								<strong>Category:</strong>
								<span className="badge badge-outline ml-2">
									{selectedMenu.category}
								</span>
							</div>
							<div>
								<strong>Price:</strong> ฿{selectedMenu.price}
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
							<div>
								<strong>Vegan:</strong>
								{selectedMenu.is_vegan ? (
									<span className="badge badge-success ml-2">Yes</span>
								) : (
									<span className="badge badge-ghost ml-2">No</span>
								)}
							</div>
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

export default RegularMenuPage;
