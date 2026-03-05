import { useState } from "react";
import {
	Filter,
	Search,
	ShoppingCart,
	Plus,
	Truck,
	Clock,
	AlertCircle,
} from "lucide-react";
import useProcurementStore from "../../stores/useProcurementStore";
import VendorSection from "./VendorSection";
import LiveOrders from "./LiveOrders";
import AddCustomItemModal from "./AddCustomItemModal";

const MarketListTab = ({ userId }) => {
	const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);
	const [selectedVendorForCustom, setSelectedVendorForCustom] = useState(null);

	const {
		vendors,
		inventoryItems,
		selectedVendor,
		searchQuery,
		setSelectedVendor,
		setSearchQuery,
	} = useProcurementStore();

	// Group inventory items by vendor
	const itemsByVendor = vendors.reduce((acc, vendor) => {
		acc[vendor.id] = {
			vendor,
			items: inventoryItems.filter(
				(item) =>
					item.default_vendor_id === vendor.id &&
					(selectedVendor === "all" || selectedVendor === vendor.id) &&
					(searchQuery === "" ||
						item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						item.category.toLowerCase().includes(searchQuery.toLowerCase()))
			),
		};
		return acc;
	}, {});

	const handleAddCustom = (vendor) => {
		setSelectedVendorForCustom(vendor);
		setIsAddCustomModalOpen(true);
	};

	return (
		<div className="space-y-6">
			{/* Live Orders Section */}
			<LiveOrders />

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<Filter className="w-5 h-5 text-gray-500" />
					<select
						value={selectedVendor}
						onChange={(e) => setSelectedVendor(e.target.value)}
						className="select select-bordered select-sm w-full sm:w-48">
						<option value="all">All Vendors</option>
						{vendors.map((vendor) => (
							<option key={vendor.id} value={vendor.id}>
								{vendor.name}
							</option>
						))}
					</select>
				</div>

				<div className="relative w-full sm:w-64">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
					<input
						type="text"
						placeholder="Search items..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="input input-bordered input-sm w-full pl-9"
					/>
				</div>
			</div>

			{/* Vendor Sections */}
			<div className="space-y-8">
				{Object.values(itemsByVendor).map(({ vendor, items }) => (
					<VendorSection
						key={vendor.id}
						vendor={vendor}
						items={items}
						onAddCustom={() => handleAddCustom(vendor)}
						userId={userId}
					/>
				))}
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
