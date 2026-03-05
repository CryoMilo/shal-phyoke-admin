// src/pages/InventoryItems.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Plus, Package } from "lucide-react";
import useInventoryStore from "../stores/inventoryStore";
import { Loading } from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";
import InventoryFilters from "../components/inventory/InventoryFilters";
import InventoryGrid from "../components/inventory/InventoryGrid";
import InventoryItemModal from "../components/inventory/InventoryItemModal";
import DeleteConfirmationModal from "../components/common/DeleteConfirmationModal";

const InventoryItems = () => {
	const {
		inventoryItems: items,
		vendors,
		loading,
		searchQuery,
		activeCategory,
		showRegularOnly,
		fetchInventoryItems,
		fetchVendors,
		createInventoryItem,
		updateInventoryItem,
		deleteInventoryItem,
		setSearchQuery,
		setActiveCategory,
		setShowRegularOnly,
		showOnlyRegularItems,
		showAllItems,
		resetFilters,
		getAllCategories,
		getFilteredItems, // Use the new method
	} = useInventoryStore();

	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [formLoading, setFormLoading] = useState(false);
	const [deleteItem, setDeleteItem] = useState(null);

	useEffect(() => {
		fetchInventoryItems();
		fetchVendors();
	}, [fetchInventoryItems, fetchVendors]);

	// Get filtered items using the store method
	const filteredItems = useMemo(() => {
		return getFilteredItems();
	}, [items, searchQuery, activeCategory, showRegularOnly, getFilteredItems]);

	const categories = getAllCategories();

	const openCreateModal = () => {
		setEditingItem(null);
		setShowModal(true);
	};

	const openEditModal = (item) => {
		setEditingItem(item);
		setShowModal(true);
	};

	const handleFormSubmit = async (data) => {
		try {
			setFormLoading(true);

			let result;
			if (editingItem) {
				result = await updateInventoryItem(editingItem.id, data);
			} else {
				result = await createInventoryItem(data);
			}

			if (result.error) {
				throw new Error(result.error);
			}

			setShowModal(false);
			setEditingItem(null);
		} catch (error) {
			console.error("Error saving inventory item:", error);
			alert("Error saving inventory item: " + error.message);
		} finally {
			setFormLoading(false);
		}
	};

	const handleDelete = async (id) => {
		try {
			const result = await deleteInventoryItem(id);
			if (result.error) {
				throw new Error(result.error);
			}
			setDeleteItem(null);
		} catch (error) {
			console.error("Error deleting inventory item:", error);
			alert("Error deleting inventory item");
		}
	};

	const handleClearFilters = () => {
		resetFilters();
	};

	if (loading && items.length === 0) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6">
			{/* Header */}
			<PageHeader
				title="Inventory Items"
				description="Manage your inventory items and their default vendors"
				icon={Package}
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
			<InventoryFilters
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				activeCategory={activeCategory}
				setActiveCategory={setActiveCategory}
				showRegularOnly={showRegularOnly}
				setShowRegularOnly={setShowRegularOnly}
				showOnlyRegularItems={showOnlyRegularItems}
				showAllItems={showAllItems}
				categories={categories}
				filteredCount={filteredItems.length}
				totalCount={items.length}
			/>

			{/* Grid */}
			{filteredItems.length > 0 ? (
				<InventoryGrid
					items={filteredItems}
					onEdit={openEditModal}
					onDelete={setDeleteItem}
				/>
			) : (
				<div className="text-center py-8 md:py-12 bg-base-100 rounded-lg shadow-sm border border-base-200">
					<Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p className="text-gray-500 text-lg mb-4">
						{items.length === 0
							? "No inventory items found"
							: "No items match your filters"}
					</p>
					{items.length === 0 ? (
						<button className="btn btn-primary" onClick={openCreateModal}>
							<Plus className="w-4 h-4 mr-2" />
							Add Your First Item
						</button>
					) : (
						<button className="btn btn-outline" onClick={handleClearFilters}>
							Clear All Filters
						</button>
					)}
				</div>
			)}

			{/* Create/Edit Modal */}
			<InventoryItemModal
				showModal={showModal}
				setShowModal={setShowModal}
				editingItem={editingItem}
				handleSubmit={handleFormSubmit}
				loading={formLoading}
				vendors={vendors}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteConfirmationModal
				isOpen={!!deleteItem}
				onClose={() => setDeleteItem(null)}
				onConfirm={() => handleDelete(deleteItem.id)}
				title="Delete Inventory Item"
				message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
			/>

			{/* Floating Action Button for Mobile */}
			<div className="fixed bottom-6 right-6 z-30 sm:hidden">
				<button
					className="btn btn-primary btn-circle shadow-lg"
					onClick={openCreateModal}
					aria-label="Add inventory item">
					<Plus className="w-6 h-6" />
				</button>
			</div>
		</div>
	);
};

export default InventoryItems;
