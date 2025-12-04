import React, { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../services/supabase";
import { menuSchema } from "../validations/menuSchema";
import useMenuStore from "../stores/menuStore";
import Loading from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";
import MenuFilters from "../components/menu/MenuFilters";
import MenuTable from "../components/menu/MenuTable";
import MenuFormModal from "../components/menu/MenuFormModal";
import MenuDetailsModal from "../components/menu/MenuDetailsModal";

const AllMenuPage = () => {
	const {
		allMenuItems: menus,
		loading,
		filteredMenus,
		searchQuery,
		activeCategory,
		showActiveOnly,
		showRegularOnly,
		fetchAllMenuItems,
		addMenuItem,
		updateMenuItem,
		deleteMenuItem,
		setSearchQuery,
		setActiveCategory,
		setShowActiveOnly,
		setShowRegularOnly,
		showOnlyRegularItems,
		showOnlyRotatingItems,
		resetFilters,
		toggleMenuStatus,
	} = useMenuStore();

	const [showModal, setShowModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [editingMenu, setEditingMenu] = useState(null);
	const [selectedMenu, setSelectedMenu] = useState(null);

	const { reset, setValue } = useForm({
		resolver: zodResolver(menuSchema),
	});

	useEffect(() => {
		fetchAllMenuItems();
	}, [fetchAllMenuItems]);

	// Extract unique categories
	const categories = [...new Set(menus.map((menu) => menu.category))].sort();

	const openCreateModal = () => {
		setEditingMenu(null);
		reset({
			name_burmese: "",
			name_english: "",
			name_thai: "",
			price: 0,
			taste_profile: "",
			category: "Chicken",
			image_url: "",
			description: "",
			sensitive_ingredients: "",
			is_active: true,
			is_regular: true, // Added is_regular field
		});
		setShowModal(true);
	};

	const openEditModal = (menu) => {
		setEditingMenu(menu);
		setValue("name_burmese", menu.name_burmese);
		setValue("name_english", menu.name_english);
		setValue("name_thai", menu.name_thai || "");
		setValue("price", menu.price);
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
		setValue("is_regular", menu.is_regular); // Added is_regular field
		setShowModal(true);
	};

	const openDetailsModal = (menu) => {
		setSelectedMenu(menu);
		setShowDetailsModal(true);
	};

	const handleSubmit = async (data) => {
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
				updateMenuItem(editingMenu.id, menuData);
			} else {
				const { data: newMenu, error } = await supabase
					.from("menu_items")
					.insert([menuData]);

				if (error) throw error;
				addMenuItem(newMenu[0]);
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
				deleteMenuItem(id);
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
	};

	const handleClearFilters = () => {
		resetFilters();
	};

	if (loading && menus.length === 0) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<PageHeader
				title="All Menu Items"
				buttons={[
					{
						type: "button",
						label: "Create Menu Item",
						shortLabel: "Create Menu Item",
						icon: Plus,
						onClick: openCreateModal,
						variant: "primary",
					},
				]}
			/>

			{/* Filters - Updated with new props */}
			<MenuFilters
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				activeCategory={activeCategory}
				setActiveCategory={setActiveCategory}
				showActiveOnly={showActiveOnly}
				setShowActiveOnly={setShowActiveOnly}
				showRegularOnly={showRegularOnly}
				setShowRegularOnly={setShowRegularOnly}
				showOnlyRegularItems={showOnlyRegularItems}
				showOnlyRotatingItems={showOnlyRotatingItems}
				categories={categories}
				filteredCount={filteredMenus.length}
				totalCount={menus.length}
			/>

			{/* Table */}
			{filteredMenus.length > 0 ? (
				<MenuTable
					menus={filteredMenus}
					openEditModal={openEditModal}
					openDetailsModal={openDetailsModal}
					handleDelete={handleDelete}
					toggleMenuStatus={handleToggleStatus}
				/>
			) : (
				<div className="text-center py-12 bg-base-100 rounded-lg">
					<p className="text-gray-500 text-lg mb-4">
						{menus.length === 0
							? "No menu items found"
							: "No items match your filters"}
					</p>
					{menus.length === 0 ? (
						<button className="btn btn-primary" onClick={openCreateModal}>
							Create Your First Menu Item
						</button>
					) : (
						<button className="btn btn-outline" onClick={handleClearFilters}>
							Clear All Filters
						</button>
					)}
				</div>
			)}

			{/* Create/Edit Modal */}
			<MenuFormModal
				showModal={showModal}
				setShowModal={setShowModal}
				editingMenu={editingMenu}
				handleSubmit={handleSubmit}
			/>

			{/* Details Modal */}
			{showDetailsModal && selectedMenu && (
				<MenuDetailsModal
					selectedMenu={selectedMenu}
					setShowDetailsModal={setShowDetailsModal}
				/>
			)}
		</div>
	);
};

export default AllMenuPage;
