import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import useMenuStore from "../stores/menuStore";
import Loading from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";
import MenuFilters from "../components/menu/MenuFilters";
import MenuTable from "../components/menu/MenuTable";
import MenuFormModal from "../components/menu/MenuFormModal";

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
		createMenuItem,
		updateMenuItemById,
		deleteMenuItemById,
		setSearchQuery,
		setActiveCategory,
		setShowActiveOnly,
		setShowRegularOnly,
		showOnlyRegularItems,
		showOnlyRotatingItems,
		resetFilters,
		toggleMenuStatus,
		getAllCategories,
	} = useMenuStore();

	const [showModal, setShowModal] = useState(false);
	const [editingMenu, setEditingMenu] = useState(null);
	const [formLoading, setFormLoading] = useState(false);
	const [selectedMenu, setSelectedMenu] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);

	useEffect(() => {
		fetchAllMenuItems();
	}, [fetchAllMenuItems]);

	const categories = getAllCategories();

	const openCreateModal = () => {
		setEditingMenu(null);
		setShowModal(true);
	};

	const openEditModal = (menu) => {
		setEditingMenu(menu);
		setShowModal(true);
	};

	const openDetailsModal = (menu) => {
		setSelectedMenu(menu);
		setShowDetailsModal(true);
	};

	const handleFormSubmit = async (data) => {
		try {
			setFormLoading(true);

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
			setEditingMenu(null);
			await fetchAllMenuItems();
		} catch (error) {
			console.error("Error saving menu:", error);
			alert("Error saving menu item: " + error.message);
		} finally {
			setFormLoading(false);
		}
	};

	const handleDelete = async (id) => {
		if (confirm("Are you sure you want to delete this menu item?")) {
			try {
				const result = await deleteMenuItemById(id);
				if (result.error) {
					throw result.error;
				}
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
		<div className="container mx-auto p-3 md:p-6">
			{/* Header */}
			<PageHeader
				title="All Menu Items"
				description="Manage both regular and rotating menu items"
				buttons={[
					{
						type: "button",
						label: "Add Item",
						shortLabel: "Add",
						icon: Plus,
						onClick: openCreateModal,
						variant: "primary",
					},
				]}
			/>

			{/* Filters */}
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
				<div className="overflow-x-auto">
					<MenuTable
						menus={filteredMenus}
						openEditModal={openEditModal}
						openDetailsModal={openDetailsModal}
						handleDelete={handleDelete}
						toggleMenuStatus={handleToggleStatus}
					/>
				</div>
			) : (
				<div className="text-center py-8 md:py-12 bg-base-100 rounded-lg shadow-sm border border-base-200">
					<p className="text-gray-500 text-lg mb-4">
						{menus.length === 0
							? "No menu items found"
							: "No items match your filters"}
					</p>
					{menus.length === 0 ? (
						<button className="btn btn-primary" onClick={openCreateModal}>
							<Plus className="w-4 h-4 mr-2" />
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
				handleSubmit={handleFormSubmit}
				loading={formLoading}
				isRegularOnly={false}
			/>

			{/* Details Modal - You'll need to create this component */}
			{showDetailsModal && selectedMenu && (
				<div className="modal modal-open">
					<div className="modal-box">
						<h3 className="font-bold text-lg">{selectedMenu.name_english}</h3>
						<p className="py-4">Details content here</p>
						<div className="modal-action">
							<button
								className="btn"
								onClick={() => setShowDetailsModal(false)}>
								Close
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Floating Action Button for Mobile */}
			<div className="fixed bottom-6 right-6 z-30 sm:hidden">
				<button
					className="btn btn-primary btn-circle shadow-lg"
					onClick={openCreateModal}
					aria-label="Add menu item">
					<Plus className="w-6 h-6" />
				</button>
			</div>
		</div>
	);
};

export default AllMenuPage;
