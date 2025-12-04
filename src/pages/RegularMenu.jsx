import React, { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useMenuStore from "../stores/menuStore";
import { regularMenuSchema } from "../validations/regularMenuSchema";
import { PageHeader } from "../components/common/PageHeader";
import RegularMenuCard from "../components/menu/RegularMenuCard";

const RegularMenuPage = () => {
	const {
		allMenuItems,
		loading,
		fetchRegularMenuItems,
		createMenuItem,
		updateMenuItemById,
		deleteMenuItemById,
		getRegularItemsByCategory,
		toggleMenuStatus,
		getRegularCategories,
	} = useMenuStore();

	const [showModal, setShowModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [editingMenu, setEditingMenu] = useState(null);
	const [selectedMenu, setSelectedMenu] = useState(null);
	const [activeCategory, setActiveCategory] = useState("all");

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
		fetchRegularMenuItems();
	}, []);

	// Get regular items only (filtered from all items)
	const regularItems = allMenuItems.filter((item) => item.is_regular);

	// Filter menus based on active category
	const filteredMenus =
		activeCategory === "all"
			? regularItems
			: getRegularItemsByCategory(activeCategory);

	// Get all regular categories
	const regularCategories = getRegularCategories();

	// Category display names
	const categoryDisplayNames = {
		Drink: "Drinks",
		Extra: "Extras & Sides",
		Rice: "Rice Dishes",
		Noodles: "Noodles",
		Combo: "Combos",
		Other: "Others",
	};

	// Available categories for form
	const availableCategories = [
		"Drink",
		"Extra",
		"Rice",
		"Noodles",
		"Combo",
		"Other",
	];

	const openCreateModal = () => {
		setEditingMenu(null);
		reset({
			name_burmese: "",
			name_english: "",
			name_thai: "",
			price: 0,
			category: "Drink", // Default
			taste_profile: "",
			description: "",
			image_url: "",
			is_active: true,
			is_regular: true, // Always true for regular menu page
		});
		setShowModal(true);
	};

	const openEditModal = (menu) => {
		setEditingMenu(menu);
		setValue("name_burmese", menu.name_burmese);
		setValue("name_english", menu.name_english || "");
		setValue("name_thai", menu.name_thai || "");
		setValue("price", menu.price);
		setValue("category", menu.category);
		setValue("taste_profile", menu.taste_profile || "");
		setValue("description", menu.description || "");
		setValue("image_url", menu.image_url || "");
		setValue("is_active", menu.is_active);
		setValue("is_regular", true);
		setShowModal(true);
	};

	const openDetailsModal = (menu) => {
		setSelectedMenu(menu);
		setShowDetailsModal(true);
	};

	const onSubmit = async (data) => {
		try {
			// Ensure is_regular is always true for this page
			data.is_regular = true;

			let result;
			if (editingMenu) {
				result = await updateMenuItemById(editingMenu.id, data);
			} else {
				result = await createMenuItem(data);
			}

			if (result.error) {
				throw result.error;
			}

			setShowModal(false);
			reset();
			// Refresh the data
			await fetchRegularMenuItems();
		} catch (error) {
			console.error("Error saving menu:", error);
			alert("Error saving menu item: " + error.message);
		}
	};

	const handleDelete = async (id) => {
		if (confirm("Are you sure you want to delete this menu item?")) {
			try {
				const result = await deleteMenuItemById(id);
				if (result.error) {
					throw result.error;
				}
				// Refresh the data
				await fetchRegularMenuItems();
			} catch (error) {
				console.error("Error deleting menu:", error);
				alert("Error deleting menu item");
			}
		}
	};

	const handleToggleStatus = async (id) => {
		const result = await toggleMenuStatus(id);
		if (!result.success) {
			alert("Error updating menu status");
		}
		// Refresh the data
		await fetchRegularMenuItems();
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
				description="Manage always-available menu items"
				buttons={[
					{
						type: "button",
						label: "Create Menu Item",
						icon: Plus,
						onClick: openCreateModal,
						variant: "primary",
					},
				]}
			/>

			{/* Category Filter Tabs */}
			<div className="tabs tabs-boxed mb-6 justify-center flex-wrap">
				<button
					className={`tab ${activeCategory === "all" ? "tab-active" : ""}`}
					onClick={() => setActiveCategory("all")}>
					All ({regularItems.length})
				</button>
				{regularCategories.map((category) => (
					<button
						key={category}
						className={`tab ${activeCategory === category ? "tab-active" : ""}`}
						onClick={() => setActiveCategory(category)}>
						{categoryDisplayNames[category] || category} (
						{getRegularItemsByCategory(category).length})
					</button>
				))}
			</div>

			{/* Card Grid */}
			{filteredMenus.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{filteredMenus.map((menu) => (
						<RegularMenuCard
							key={menu.id}
							menu={menu}
							onEdit={openEditModal}
							onDelete={handleDelete}
							onViewDetails={openDetailsModal}
							onToggleStatus={handleToggleStatus}
						/>
					))}
				</div>
			) : null}

			{filteredMenus.length === 0 && (
				<div className="text-center py-12 bg-base-100 rounded-lg shadow">
					<p className="text-gray-500 text-lg mb-4">
						{activeCategory === "all"
							? "No regular menu items found"
							: `No ${
									categoryDisplayNames[activeCategory] || activeCategory
							  } items found`}
					</p>
					<button className="btn btn-primary" onClick={openCreateModal}>
						<Plus className="w-4 h-4 mr-2" />
						Create New Menu Item
					</button>
				</div>
			)}

			{/* Create/Edit Modal */}
			{showModal && (
				<div className="modal modal-open">
					<div className="modal-box w-11/12 max-w-2xl">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">
								{editingMenu ? "Edit Menu Item" : "Create New Menu Item"}
							</h3>
							<button
								className="btn btn-sm btn-ghost"
								onClick={() => setShowModal(false)}>
								<X className="w-4 h-4" />
							</button>
						</div>

						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
										<span className="label-text">Name (English)</span>
									</label>
									<input
										{...register("name_english")}
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
									<select
										{...register("category")}
										className="select select-bordered w-full">
										{availableCategories.map((category) => (
											<option key={category} value={category}>
												{categoryDisplayNames[category] || category}
											</option>
										))}
									</select>
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
									<label className="label cursor-pointer gap-4">
										<span className="label-text">Active</span>
										<input
											{...register("is_active")}
											type="checkbox"
											defaultChecked
											className="toggle toggle-primary"
										/>
									</label>
								</div>
							</div>

							{/* Hidden is_regular field */}
							<input type="hidden" {...register("is_regular")} value="true" />

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
								<strong>Burmese</strong> {selectedMenu.name_burmese}
							</div>
							{selectedMenu.name_english && (
								<div>
									<strong>In English:</strong> {selectedMenu.name_english}
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
									{categoryDisplayNames[selectedMenu.category] ||
										selectedMenu.category}
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
								<strong>Type:</strong>
								<span className="badge badge-primary ml-2">
									{selectedMenu.is_regular
										? "Regular (Always Available)"
										: "Rotating"}
								</span>
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
