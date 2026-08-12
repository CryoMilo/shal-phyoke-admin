import React, { useState, useEffect } from "react";
import { Plus, Box } from "lucide-react";
import useMenuStore from "../stores/menuStore";
import { PageHeader } from "../components/common/PageHeader";
import RegularMenuCard from "../components/menu/RegularMenuCard";
import MenuFormModal from "../components/menu/MenuFormModal";
import { CATEGORY_DISPLAY_NAMES } from "../constants";
import { showToast } from "../utils/toastUtils";
import DeleteConfirmationModal from "../components/common/DeleteConfirmationModal";
import { getSafeImageUrl } from "../utils/imageUtils";

const RegularMenuPage = () => {
	const {
		allMenuItems,
		loading,
		fetchRegularMenuItems,
		createMenuItem,
		updateMenuItemById,
		deleteMenuItemById,
		toggleMenuStatus,
		getRegularCategories,
		getRegularItemsByCategory,
	} = useMenuStore();

	const [showModal, setShowModal] = useState(false);
	const [editingMenu, setEditingMenu] = useState(null);
	const [activeCategory, setActiveCategory] = useState("all");
	const [formLoading, setFormLoading] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState(null);
	const [showUnavailableModal, setShowUnavailableModal] = useState(false);

	useEffect(() => {
		fetchRegularMenuItems();
	}, []);

	// Get regular items only
	const regularItems = allMenuItems.filter((item) => item.is_regular);
	const unavailableItems = regularItems.filter((item) => !item.is_active);

	// Filter menus based on active category
	const filteredMenus =
		activeCategory === "all"
			? regularItems
			: getRegularItemsByCategory(activeCategory);

	// Get all regular categories
	const regularCategories = getRegularCategories();

	const openCreateModal = () => {
		setEditingMenu(null);
		setShowModal(true);
	};

	const openEditModal = (menu) => {
		setEditingMenu(menu);
		setShowModal(true);
	};

	const handleFormSubmit = async (data) => {
		try {
			setFormLoading(true);

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
			setEditingMenu(null);
			await fetchRegularMenuItems();
		} catch (error) {
			console.error("Error saving menu:", error);
			showToast.error("Error saving menu item: " + error.message);
		} finally {
			setFormLoading(false);
		}
	};

	const handleDelete = (id) => {
		setDeleteTargetId(id);
		setShowDeleteConfirm(true);
	};

	const confirmDelete = async () => {
		try {
			const result = await deleteMenuItemById(deleteTargetId);
			if (result.error) {
				throw result.error;
			}
			showToast.success("Menu item deleted successfully");
			await fetchRegularMenuItems();
		} catch (error) {
			console.error("Error deleting menu:", error);
			showToast.error("Error deleting menu item");
		} finally {
			setShowDeleteConfirm(false);
			setDeleteTargetId(null);
		}
	};

	const handleToggleStatus = async (id) => {
		const result = await toggleMenuStatus(id);
		if (!result.success) {
			showToast.error("Error updating menu status");
		}
		await fetchRegularMenuItems();
	};

	if (loading && allMenuItems.length === 0) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<span className="loading loading-spinner loading-lg"></span>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-3 md:p-6">
			{/* Header */}
			<PageHeader
				title="Regular Menu"
				description="Always-available menu items"
				buttons={[
					{
						type: "button",
						label: `Unavailable (${unavailableItems.length})`,
						shortlabel: `Unavailable (${unavailableItems.length})`,
						icon: Box,
						onClick: () => setShowUnavailableModal(true),
						variant: "secondary",
					},
					{
						type: "button",
						label: "Add Item",
						shortlabel: "Add",
						icon: Plus,
						onClick: openCreateModal,
						variant: "primary",
					},
				]}
			/>

			{/* Category Filter Tabs - Mobile optimized */}
			<div className="mb-6">
				<div className="flex flex-wrap gap-2 mb-2">
					<button
						className={`btn btn-sm ${
							activeCategory === "all" ? "btn-primary" : "btn-outline btn-ghost"
						}`}
						onClick={() => setActiveCategory("all")}>
						All ({regularItems.length})
					</button>
					{regularCategories.map((category) => (
						<button
							key={category}
							className={`btn btn-sm ${
								activeCategory === category
									? "btn-primary"
									: "btn-outline btn-ghost"
							}`}
							onClick={() => setActiveCategory(category)}>
							{CATEGORY_DISPLAY_NAMES[category] || category} (
							{getRegularItemsByCategory(category).length})
						</button>
					))}
				</div>
				<p className="text-sm text-gray-500">
					Showing {filteredMenus.length} of {regularItems.length} items
				</p>
			</div>

			{/* Card Grid - Mobile responsive */}
			{filteredMenus.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
					{filteredMenus.map((menu) => (
						<RegularMenuCard
							key={menu.id}
							menu={menu}
							onEdit={openEditModal}
							onDelete={handleDelete}
							onToggleStatus={handleToggleStatus}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-8 md:py-12 bg-base-100 rounded-lg shadow-sm border border-base-200">
					<div className="text-gray-400 mb-4">
						<Plus className="w-12 h-12 mx-auto opacity-50" />
					</div>
					<p className="text-gray-500 text-lg mb-4">
						{activeCategory === "all"
							? "No regular menu items found"
							: `No ${
									CATEGORY_DISPLAY_NAMES[activeCategory] || activeCategory
							  } items found`}
					</p>
					<button className="btn btn-primary" onClick={openCreateModal}>
						<Plus className="w-4 h-4 mr-2" />
						Create Your First Menu Item
					</button>
				</div>
			)}

			{/* Create/Edit Modal */}
			<MenuFormModal
				showModal={showModal}
				setShowModal={setShowModal}
				editingMenu={editingMenu}
				handleSubmit={handleFormSubmit}
				loading={formLoading}
				isRegularOnly={true}
			/>

			{/* Unavailable Items Modal */}
			{showUnavailableModal && (
				<div className="modal modal-open">
					<div className="modal-box max-w-2xl bg-base-100">
						<div className="flex justify-between items-center mb-6">
							<h3 className="font-bold text-xl flex items-center gap-2">
								<Box className="w-6 h-6 text-error" />
								Unavailable Items
							</h3>
							<button 
								className="btn btn-sm btn-circle btn-ghost"
								onClick={() => setShowUnavailableModal(false)}
							>✕</button>
						</div>

						{unavailableItems.length > 0 ? (
							<div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
								{unavailableItems.map((item) => (
									<div 
										key={item.id} 
										className="flex items-center justify-between p-3 bg-base-200 rounded-lg border border-base-300"
									>
										<div className="flex items-center gap-3">
											{getSafeImageUrl(item.image_url) && (
												<img 
													src={getSafeImageUrl(item.image_url)} 
													alt={item.name_burmese} 
													className="w-12 h-12 rounded object-cover"
												/>
											)}
											<div>
												<div className="font-bold text-sm">{item.name_burmese}</div>
												<div className="text-xs opacity-60">
													{CATEGORY_DISPLAY_NAMES[item.category] || item.category}
												</div>
											</div>
										</div>
										<button 
											className="btn btn-sm btn-success text-white"
											onClick={() => handleToggleStatus(item.id)}
										>
											Set Available
										</button>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-12 opacity-50">
								<Box className="w-16 h-16 mx-auto mb-4 opacity-20" />
								<p>No items are currently unavailable</p>
							</div>
						)}

						<div className="modal-action">
							<button 
								className="btn btn-ghost"
								onClick={() => setShowUnavailableModal(false)}
							>Close</button>
						</div>
					</div>
					<div className="modal-backdrop bg-black/50" onClick={() => setShowUnavailableModal(false)}></div>
				</div>
			)}

			<DeleteConfirmationModal
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={confirmDelete}
				title="Delete Menu Item"
				message="Are you sure you want to delete this menu item? This action cannot be undone."
			/>

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

export default RegularMenuPage;
