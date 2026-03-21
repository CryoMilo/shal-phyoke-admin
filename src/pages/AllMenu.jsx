import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import useMenuStore from "../stores/menuStore";
import useComboStore from "../stores/comboStore";
import { Loading } from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";
import MenuFilters from "../components/menu/MenuFilters";
import MenuTable from "../components/menu/MenuTable";
import MenuFormModal from "../components/menu/MenuFormModal";
import ComboTemplateModal from "../components/menu/ComboTemplateModal";
import { showToast } from "../utils/toastUtils";
import DeleteConfirmationModal from "../components/common/DeleteConfirmationModal";

const AllMenuPage = () => {
	const [activeTab, setActiveTab] = useState("menu"); // "menu" or "combos"
	const {
		allMenuItems: menus,
		loading: menuLoading,
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

	const {
		templates,
		loading: comboLoading,
		fetchTemplates,
		deleteTemplate,
		toggleTemplate,
	} = useComboStore();

	const [showModal, setShowModal] = useState(false);
	const [editingMenu, setEditingMenu] = useState(null);
	const [formLoading, setFormLoading] = useState(false);
	const [selectedMenu, setSelectedMenu] = useState(null);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState(null);
	const [deleteType, setDeleteType] = useState("menu"); // "menu" or "combo"

	const [showComboModal, setShowComboModal] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState(null);

	useEffect(() => {
		if (activeTab === "menu") {
			fetchAllMenuItems();
		} else {
			fetchTemplates();
		}
	}, [activeTab, fetchAllMenuItems, fetchTemplates]);

	const categories = getAllCategories();

	const openCreateModal = () => {
		if (activeTab === "menu") {
			setEditingMenu(null);
			setShowModal(true);
		} else {
			setEditingTemplate(null);
			setShowComboModal(true);
		}
	};

	const openEditModal = (menu) => {
		setEditingMenu(menu);
		setShowModal(true);
	};

	const openEditComboModal = (template) => {
		setEditingTemplate(template);
		setShowComboModal(true);
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
			showToast.error("Error saving menu item: " + error.message);
		} finally {
			setFormLoading(false);
		}
	};

	const handleDelete = (id, type = "menu") => {
		setDeleteTargetId(id);
		setDeleteType(type);
		setShowDeleteConfirm(true);
	};

	const confirmDelete = async () => {
		try {
			if (deleteType === "menu") {
				const result = await deleteMenuItemById(deleteTargetId);
				if (result.error) throw result.error;
				showToast.success("Menu item deleted successfully");
			} else {
				const result = await deleteTemplate(deleteTargetId);
				if (result.error) throw result.error;
			}
		} catch (error) {
			console.error(`Error deleting ${deleteType}:`, error);
			showToast.error(`Error deleting ${deleteType}`);
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
	};

	const handleToggleComboStatus = async (id) => {
		await toggleTemplate(id);
	};

	const handleClearFilters = () => {
		resetFilters();
	};

	if ((menuLoading && menus.length === 0) || (comboLoading && templates.length === 0)) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6">
			{/* Tabs UI */}
			<div className="tabs tabs-boxed mb-6 bg-base-200 p-1 inline-flex">
				<button
					className={`tab tab-lg ${activeTab === "menu" ? "tab-active !bg-primary !text-primary-content" : ""}`}
					onClick={() => setActiveTab("menu")}>
					All Menu Items
				</button>
				<button
					className={`tab tab-lg ${activeTab === "combos" ? "tab-active !bg-primary !text-primary-content" : ""}`}
					onClick={() => setActiveTab("combos")}>
					Combo Templates
				</button>
			</div>

			{activeTab === "menu" ? (
				<>
					{/* Header */}
					<PageHeader
						title="All Menu Items"
						description="Manage both regular and rotating menu items"
						buttons={[
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
				</>
			) : (
				<>
					{/* Combo Templates Section */}
					<PageHeader
						title="Combo Templates"
						description="Create and manage category-based combo templates"
						buttons={[
							{
								type: "button",
								label: "New Combo Template",
								shortlabel: "New",
								icon: Plus,
								onClick: openCreateModal,
								variant: "primary",
							},
						]}
					/>

					{templates.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{templates.map((template) => (
								<div key={template.id} className="card bg-base-100 shadow-sm border border-base-200">
									<div className="card-body p-5">
										<div className="flex justify-between items-start mb-2">
											<div>
												<h3 className="font-bold text-lg text-primary">{template.name_burmese}</h3>
												<p className="text-sm text-gray-500">{template.name_english || "No English Name"}</p>
											</div>
											<div className="badge badge-lg badge-secondary font-bold">฿{template.price}</div>
										</div>

										<div className="flex flex-wrap gap-2 my-4">
											{template.slots?.map((slot, idx) => (
												<div 
													key={idx} 
													className={`badge badge-sm py-3 px-3 gap-1.5 ${
														slot.type === "specific" 
															? "badge-primary" 
															: "badge-outline opacity-70"
													} ${slot.optional ? "italic" : ""}`}
												>
													<Package className="w-3 h-3" />
													<span className="font-medium">
														{slot.type === "specific" ? slot.menu_item_name : (slot.label || slot.category)}
													</span>
													{slot.optional && <span className="text-[10px] opacity-70">(opt)</span>}
												</div>
											))}
										</div>

										<div className="flex items-center justify-between mt-4 pt-4 border-t border-base-100">
											<div className="flex items-center gap-2">
												<input
													type="checkbox"
													className="toggle toggle-primary toggle-sm"
													checked={template.is_active}
													onChange={() => handleToggleComboStatus(template.id)}
												/>
												<span className="text-sm font-medium">
													{template.is_active ? "Active" : "Inactive"}
												</span>
											</div>
											<div className="flex gap-1">
												<button
													className="btn btn-ghost btn-sm text-primary"
													onClick={() => openEditComboModal(template)}>
													<Edit className="w-4 h-4" />
												</button>
												<button
													className="btn btn-ghost btn-sm text-error"
													onClick={() => handleDelete(template.id, "combo")}>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12 bg-base-100 rounded-lg border border-base-200 border-dashed">
							<p className="text-gray-500 mb-4">No combo templates found</p>
							<button className="btn btn-primary" onClick={openCreateModal}>
								<Plus className="w-4 h-4 mr-2" />
								Create First Template
							</button>
						</div>
					)}
				</>
			)}

			{/* Create/Edit Menu Modal */}
			<MenuFormModal
				showModal={showModal}
				setShowModal={setShowModal}
				editingMenu={editingMenu}
				handleSubmit={handleFormSubmit}
				loading={formLoading}
				isRegularOnly={false}
			/>

			{/* Combo Template Modal */}
			<ComboTemplateModal
				showModal={showComboModal}
				setShowModal={setShowComboModal}
				editingTemplate={editingTemplate}
				onSuccess={() => fetchTemplates()}
			/>

			<DeleteConfirmationModal
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={confirmDelete}
				title={deleteType === "menu" ? "Delete Menu Item" : "Delete Combo Template"}
				message={`Are you sure you want to delete this ${deleteType === "menu" ? "menu item" : "combo template"}? This action cannot be undone.`}
			/>

			{/* Details Modal */}
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
					aria-label="Add item">
					<Plus className="w-6 h-6" />
				</button>
			</div>
		</div>
	);
};

export default AllMenuPage;
