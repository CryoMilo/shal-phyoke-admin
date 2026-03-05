// src/pages/InventoryItems.jsx
import React, { useState, useEffect } from "react";
import { Search, Package, Plus } from "lucide-react";
import useInventoryStore from "../stores/inventoryStore";
import useProcurementStore from "../stores/procurementStore";
import { supabase } from "../services/supabase";
import { Loading } from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";
import VendorChip from "../components/inventory/VendorChip";
import InventoryCard from "../components/inventory/InventoryCard";
import InventoryItemModal from "../components/inventory/InventoryItemModal";

const InventoryItems = () => {
	const {
		inventoryItems: items,
		vendors,
		loading,
		searchQuery,
		selectedVendors,
		showRegularOnly,
		fetchInventoryItems,
		fetchVendors,
		subscribeToInventory,
		updateQuantity,
		updateInventoryItem,
		getFilteredItems,
		getVendorsWithCounts,
		setSearchQuery,
		toggleVendorFilter,
		setShowRegularOnly,
		resetFilters,
	} = useInventoryStore();

	const { addToCart } = useProcurementStore();
	const [user, setUser] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [quantities, setQuantities] = useState({});

	useEffect(() => {
		fetchInventoryItems();
		fetchVendors();

		// Set up real-time subscription
		const subscription = subscribeToInventory();

		// Get current user
		const getUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			setUser(user);
		};
		getUser();

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	const filteredItems = getFilteredItems();
	const vendorsWithCounts = getVendorsWithCounts();

	const handleAddToCart = async (item) => {
		if (!user) return;

		const quantity = quantities[item.id] || 1;
		await addToCart(
			{
				inventoryItemId: item.id,
				vendorId: item.default_vendor_id,
				quantity,
				unit: item.unit,
				notes: "",
			},
			user.id
		);
	};

	const handleQuantityChange = (itemId, newValue) => {
		setQuantities((prev) => ({ ...prev, [itemId]: newValue }));
	};

	const handleUpdateStock = async (itemId, newQuantity) => {
		await updateQuantity(itemId, newQuantity);
	};

	const handleCardClick = (item) => {
		setEditingItem(item);
		setShowModal(true);
	};

	const handleModalSubmit = async (data) => {
		if (!editingItem) return;

		await updateInventoryItem(editingItem.id, data);
		setShowModal(false);
		setEditingItem(null);
	};

	if (loading && items.length === 0) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6">
			{/* Header */}
			<PageHeader
				title="Inventory Stock"
				description="Update stock levels and reorder items"
				icon={Package}
				buttons={[
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
				<div className="card-body p-4">
					{/* Search */}
					<div className="mb-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
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

					{/* Results count */}
					<div className="text-sm text-gray-500">
						Showing <span className="font-medium">{filteredItems.length}</span>{" "}
						items
					</div>
				</div>
			</div>

			{/* Compact List View */}
			<div className="space-y-2">
				{filteredItems.map((item) => (
					<InventoryCard
						key={item.id}
						item={item}
						user={user}
						cartQuantity={quantities[item.id] || 1}
						onQuantityChange={handleQuantityChange}
						onAddToCart={handleAddToCart}
						onUpdateStock={handleUpdateStock}
						onClick={() => handleCardClick(item)}
					/>
				))}

				{filteredItems.length === 0 && (
					<div className="text-center py-12 bg-base-100 rounded-lg border border-base-200">
						<Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
						<p className="text-gray-500">No items match your filters</p>
						<button
							className="btn btn-outline btn-sm mt-4"
							onClick={resetFilters}>
							Clear Filters
						</button>
					</div>
				)}
			</div>

			{/* Edit Modal */}
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
