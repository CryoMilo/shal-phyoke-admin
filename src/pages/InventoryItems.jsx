// src/pages/InventoryItems.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Package, Plus, ClipboardCheck } from "lucide-react";
import useInventoryStore from "../stores/inventoryStore";
import useProcurementStore from "../stores/procurementStore";
import { Loading } from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";
import VendorChip from "../components/inventory/VendorChip";
import InventoryCard from "../components/inventory/InventoryCard";
import InventoryItemModal from "../components/inventory/InventoryItemModal";
import { showToast } from "../utils/toastUtils";

const InventoryItems = () => {
	const navigate = useNavigate();
	const {
		inventoryItems: items,
		vendors,
		loading,
		searchQuery,
		selectedVendors,
		selectedItemType,
		showRegularOnly,
		fetchInventoryItems,
		fetchVendors,
		subscribeToInventory,
		createInventoryItem,
		updateInventoryItem,
		getFilteredItems,
		getVendorsWithCounts,
		setSearchQuery,
		setSelectedItemType,
		toggleVendorFilter,
		setShowRegularOnly,
		resetFilters,
	} = useInventoryStore();

	const { addToMarketList } = useProcurementStore();

	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [quantities, setQuantities] = useState({});

	useEffect(() => {
		fetchInventoryItems();
		fetchVendors();

		// Set up real-time subscription
		const subscription = subscribeToInventory();

		return () => {
			subscription.unsubscribe();
		};
	}, [fetchInventoryItems, fetchVendors, subscribeToInventory]);

	const filteredItems = getFilteredItems();
	const vendorsWithCounts = getVendorsWithCounts();

	const handleAddToMarketList = async (item) => {
		const quantity = quantities[item.id] || 1;
		const itemName = item.name_english || item.name_burmese || item.name;
		const result = await addToMarketList({
			id: item.id,
			name: itemName,
			default_vendor_id: item.default_vendor_id,
			quantity,
			unit: item.unit,
			notes: "",
		});

		if (result?.success) {
			showToast.itemAdded(itemName, quantity, item.unit);
			setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
		} else {
			showToast.error(`Failed to add ${itemName} to market list`);
		}
	};

	const handleCardClick = (item) => {
		setEditingItem(item);
		setShowModal(true);
	};

	const handleModalSubmit = async (data) => {
		try {
			let res;
			if (editingItem) {
				res = await updateInventoryItem(editingItem.id, data);
			} else {
				res = await createInventoryItem(data);
			}
			setShowModal(false);
			setEditingItem(null);
			return res;
		} catch (error) {
			console.error("Error saving item:", error);
		}
	};

	if (loading && items.length === 0) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6">
			<PageHeader
				title="Inventory Catalog"
				description="Manage inventory items, packaging ratios, vendor assignments, and reorder levels."
				icon={Package}
				buttons={[
					{
						type: "button",
						label: "Stock Checklist",
						shortlabel: "Checklist",
						icon: ClipboardCheck,
						onClick: () => navigate({ to: "/stock-checklist" }),
						variant: "outline",
					},
					{
						type: "button",
						label: "Add Item",
						shortlabel: "Add",
						icon: Plus,
						onClick: () => {
							setEditingItem(null);
							setShowModal(true);
						},
						variant: "primary",
					},
				]}
			/>

			{/* Filters */}
			<div className="card bg-base-100 shadow-sm border border-base-200 mb-6">
				<div className="card-body p-4 space-y-3">
					{/* Item Type Classification Tabs */}
					<div className="tabs tabs-boxed bg-base-200 p-1 rounded-xl text-xs flex-wrap self-start">
						<button
							type="button"
							onClick={() => setSelectedItemType("all")}
							className={`tab tab-sm font-semibold ${
								selectedItemType === "all" ? "tab-active !bg-primary !text-primary-content" : ""
							}`}>
							All Items
						</button>
						<button
							type="button"
							onClick={() => setSelectedItemType("ingredient")}
							className={`tab tab-sm font-semibold ${
								selectedItemType === "ingredient" ? "tab-active !bg-primary !text-primary-content" : ""
							}`}>
							Ingredients
						</button>
						<button
							type="button"
							onClick={() => setSelectedItemType("packaging")}
							className={`tab tab-sm font-semibold ${
								selectedItemType === "packaging" ? "tab-active !bg-primary !text-primary-content" : ""
							}`}>
							Packaging
						</button>
						<button
							type="button"
							onClick={() => setSelectedItemType("operational_supply")}
							className={`tab tab-sm font-semibold ${
								selectedItemType === "operational_supply" ? "tab-active !bg-primary !text-primary-content" : ""
							}`}>
							Operational Supplies
						</button>
					</div>

					{/* Search */}
					<div className="mb-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
							<input
								type="text"
								placeholder="Search items by name or category..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="input input-bordered w-full pl-9"
							/>
						</div>
					</div>

					{/* Vendor Chips */}
					<div className="mb-3">
						<div className="flex items-center gap-2 mb-2">
							<span className="text-sm font-medium">Filter by Vendor:</span>
							<button
								type="button"
								onClick={() => setShowRegularOnly(!showRegularOnly)}
								className={`badge badge-sm gap-1 cursor-pointer ${
									showRegularOnly ? "badge-primary" : "badge-ghost"
								}`}>
								Regular Only
							</button>
						</div>
						<div className="flex flex-wrap gap-2">
							<VendorChip
								vendor={{ id: "all", name: "All Vendors" }}
								selected={selectedVendors.length === 0}
								onClick={() => resetFilters()}
								count={items.length}
							/>
							{vendorsWithCounts.map((vendor) => (
								<VendorChip
									key={vendor.id}
									vendor={vendor}
									selected={selectedVendors.includes(vendor.id)}
									onClick={() => toggleVendorFilter(vendor.id)}
									count={vendor.count}
								/>
							))}
						</div>
					</div>

					<div className="text-sm text-base-content/60">
						Showing <span className="font-semibold text-base-content">{filteredItems.length}</span> items
					</div>
				</div>
			</div>

			{/* Compact List View */}
			<div className="space-y-2">
				{filteredItems.map((item) => (
					<InventoryCard
						key={item.id}
						item={item}
						onAddToMarketList={() => handleAddToMarketList(item)}
						onClick={() => handleCardClick(item)}
					/>
				))}

				{filteredItems.length === 0 && (
					<div className="text-center py-12 bg-base-100 rounded-lg border border-base-200">
						<Package className="w-12 h-12 text-base-content/40 mx-auto mb-3" />
						<p className="text-base-content/60">No items match your filters</p>
						<button
							type="button"
							className="btn btn-outline btn-sm mt-4"
							onClick={resetFilters}>
							Clear Filters
						</button>
					</div>
				)}
			</div>

			<InventoryItemModal
				showModal={showModal}
				setShowModal={setShowModal}
				editingItem={editingItem}
				handleSubmit={handleModalSubmit}
				loading={false}
				vendors={vendors}
			/>
		</div>
	);
};

export default InventoryItems;
