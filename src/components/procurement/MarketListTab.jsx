// src/components/procurement/MarketListTab.jsx
import { Filter, Search, ShoppingCart } from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import LiveOrders from "./LiveOrders";
import VendorSection from "./VendorSection";
import AddCustomItemModal from "./AddCustomItemModal";
import { useState } from "react";

const MarketListTab = ({ userId }) => {
	const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);
	const [selectedVendorForCustom, setSelectedVendorForCustom] = useState(null);

	const {
		vendors,
		selectedVendor,
		searchQuery,
		setSelectedVendor,
		setSearchQuery,
		resetFilters,
		getItemsByVendor,
	} = useProcurementStore();

	const handleAddCustom = (vendor) => {
		setSelectedVendorForCustom(vendor);
		setIsAddCustomModalOpen(true);
	};

	const handleClearFilters = () => {
		resetFilters();
	};

	// Get cart count
	// const cartCount = activeCart.length;

	// Check if filters are active
	const hasActiveFilters = selectedVendor !== "all" || searchQuery !== "";

	return (
		<div className="space-y-6">
			{/* Live Orders Section */}
			<LiveOrders />

			{/* Filters */}
			<div className="card bg-base-100 shadow-sm border border-base-200">
				<div className="card-body p-4">
					<div className="flex flex-col md:flex-row gap-4">
						{/* Vendor Filter */}
						<div className="w-full md:w-64">
							<div className="flex items-center gap-2 mb-1">
								<Filter className="w-4 h-4 text-gray-500" />
								<span className="text-sm font-medium">Filter by Vendor</span>
							</div>
							<select
								value={selectedVendor}
								onChange={(e) => setSelectedVendor(e.target.value)}
								className="select select-bordered w-full">
								<option value="all">All Vendors</option>
								{vendors.map((vendor) => (
									<option key={vendor.id} value={vendor.id}>
										{vendor.name}
									</option>
								))}
							</select>
						</div>

						{/* Search */}
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-1">
								<Search className="w-4 h-4 text-gray-500" />
								<span className="text-sm font-medium">Search Items</span>
							</div>
							<input
								type="text"
								placeholder="Search by name or category..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="input input-bordered w-full"
							/>
						</div>
					</div>

					{/* Filter Stats and Clear */}
					{hasActiveFilters && (
						<div className="flex justify-end mt-2">
							<button
								onClick={handleClearFilters}
								className="btn btn-ghost btn-xs gap-1 text-gray-500">
								<Filter className="w-3 h-3" />
								Clear Filters
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Vendor Sections */}
			<div className="space-y-6">
				{(selectedVendor === "all"
					? vendors
					: vendors.filter((v) => v.id === selectedVendor)
				).map((vendor) => {
					const items = getItemsByVendor(vendor.id);
					if (items.length === 0) return null;

					return (
						<VendorSection
							key={vendor.id}
							vendor={vendor}
							items={items}
							onAddCustom={() => handleAddCustom(vendor)}
							userId={userId}
						/>
					);
				})}

				{/* Empty State */}
				{vendors
					.filter((v) =>
						selectedVendor === "all" ? true : v.id === selectedVendor
					)
					.every((vendor) => getItemsByVendor(vendor.id).length === 0) && (
					<div className="text-center py-12 bg-base-100 rounded-lg border border-base-200">
						<ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
						<p className="text-gray-500 text-lg mb-2">No items found</p>
						<p className="text-sm text-gray-400 mb-4">
							{hasActiveFilters
								? "Try adjusting your filters"
								: "Add items to your market list"}
						</p>
						{hasActiveFilters && (
							<button
								className="btn btn-outline btn-sm"
								onClick={handleClearFilters}>
								Clear Filters
							</button>
						)}
					</div>
				)}
			</div>

			{/* Add Custom Item Modal */}
			{selectedVendorForCustom && (
				<AddCustomItemModal
					isOpen={isAddCustomModalOpen}
					onClose={() => {
						setIsAddCustomModalOpen(false);
						setSelectedVendorForCustom(null);
					}}
					vendor={selectedVendorForCustom}
					userId={userId}
				/>
			)}
		</div>
	);
};

export default MarketListTab;
