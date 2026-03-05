// src/pages/InventoryItems.jsx
import { useState, useEffect } from "react";
import {
	Plus,
	Search,
	Filter,
	Edit2,
	Trash2,
	Image as ImageIcon,
	Package,
	Upload,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { PageHeader } from "../components/common/PageHeader";
import { Loading } from "../components/common/Loading";
import InventoryItemModal from "../components/inventory/InventoryItemModal";
import DeleteConfirmationModal from "../components/common/DeleteConfirmationModal";

const InventoryItems = () => {
	const [items, setItems] = useState([]);
	const [vendors, setVendors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [vendorFilter, setVendorFilter] = useState("all");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [deleteItem, setDeleteItem] = useState(null);
	const [categories, setCategories] = useState([]);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		setLoading(true);
		try {
			// Fetch inventory items
			const { data: itemsData, error: itemsError } = await supabase
				.from("inventory_items")
				.select(
					`
          *,
          default_vendor:default_vendor_id (
            id,
            name,
            line_id
          )
        `
				)
				.order("category")
				.order("name");

			if (itemsError) throw itemsError;

			// Fetch vendors for dropdown
			const { data: vendorsData, error: vendorsError } = await supabase
				.from("vendors")
				.select("*")
				.order("name");

			if (vendorsError) throw vendorsError;

			setItems(itemsData || []);
			setVendors(vendorsData || []);

			// Extract unique categories
			const uniqueCategories = [
				...new Set(itemsData.map((item) => item.category)),
			].sort();
			setCategories(uniqueCategories);
		} catch (error) {
			console.error("Error fetching data:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id) => {
		try {
			const { error } = await supabase
				.from("inventory_items")
				.delete()
				.eq("id", id);

			if (error) throw error;

			setItems(items.filter((item) => item.id !== id));
			setDeleteItem(null);
		} catch (error) {
			console.error("Error deleting item:", error);
		}
	};

	const filteredItems = items.filter((item) => {
		const matchesSearch =
			searchQuery === "" ||
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.category.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesCategory =
			categoryFilter === "all" || item.category === categoryFilter;

		const matchesVendor =
			vendorFilter === "all" || item.default_vendor_id === vendorFilter;

		return matchesSearch && matchesCategory && matchesVendor;
	});

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loading size="lg" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Inventory Items"
				icon={Package}
				actions={
					<button
						onClick={() => {
							setEditingItem(null);
							setIsModalOpen(true);
						}}
						className="btn btn-primary btn-sm gap-2">
						<Plus className="w-4 h-4" />
						Add Item
					</button>
				}
			/>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
					<input
						type="text"
						placeholder="Search items..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="input input-bordered w-full pl-9"
					/>
				</div>

				<div className="flex gap-2">
					<select
						value={categoryFilter}
						onChange={(e) => setCategoryFilter(e.target.value)}
						className="select select-bordered min-w-[140px]">
						<option value="all">All Categories</option>
						{categories.map((cat) => (
							<option key={cat} value={cat}>
								{cat}
							</option>
						))}
					</select>

					<select
						value={vendorFilter}
						onChange={(e) => setVendorFilter(e.target.value)}
						className="select select-bordered min-w-[140px]">
						<option value="all">All Vendors</option>
						{vendors.map((vendor) => (
							<option key={vendor.id} value={vendor.id}>
								{vendor.name}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Inventory Items Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredItems.map((item) => (
					<div
						key={item.id}
						className={`card bg-base-100 shadow-sm hover:shadow-md transition-shadow ${
							!item.is_regular ? "border-2 border-dashed border-primary" : ""
						} ${!item.is_active ? "opacity-60" : ""}`}>
						<div className="card-body p-4">
							<div className="flex items-start gap-3">
								{/* Image */}
								<div className="w-16 h-16 rounded-lg bg-base-300 flex items-center justify-center overflow-hidden">
									{item.image_url ? (
										<img
											src={item.image_url}
											alt={item.name}
											className="w-full h-full object-cover"
										/>
									) : (
										<ImageIcon className="w-8 h-8 text-gray-500" />
									)}
								</div>

								{/* Details */}
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between">
										<div>
											<h3 className="font-medium truncate">{item.name}</h3>
											<p className="text-xs text-gray-500 mt-1">
												{item.category}
											</p>
										</div>
										<div className="flex items-center gap-1">
											<button
												onClick={() => {
													setEditingItem(item);
													setIsModalOpen(true);
												}}
												className="btn btn-ghost btn-xs">
												<Edit2 className="w-3 h-3" />
											</button>
											<button
												onClick={() => setDeleteItem(item)}
												className="btn btn-ghost btn-xs text-error">
												<Trash2 className="w-3 h-3" />
											</button>
										</div>
									</div>

									<div className="mt-2 space-y-1">
										<p className="text-sm">
											<span className="text-gray-500">Unit:</span> {item.unit}
										</p>
										<p className="text-sm">
											<span className="text-gray-500">Default Vendor:</span>{" "}
											{item.default_vendor?.name || "Not set"}
										</p>
									</div>

									<div className="flex items-center gap-2 mt-3">
										<div className="badge badge-sm">
											{item.is_regular ? "Regular" : "Occasional"}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				))}

				{filteredItems.length === 0 && (
					<div className="col-span-full text-center py-12 bg-base-200 rounded-lg">
						<Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
						<p className="text-gray-500">No inventory items found</p>
						<button
							onClick={() => {
								setEditingItem(null);
								setIsModalOpen(true);
							}}
							className="btn btn-primary btn-sm mt-4">
							Add Your First Item
						</button>
					</div>
				)}
			</div>

			{/* Inventory Item Modal */}
			<InventoryItemModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setEditingItem(null);
				}}
				item={editingItem}
				vendors={vendors}
				onSuccess={fetchData}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteConfirmationModal
				isOpen={!!deleteItem}
				onClose={() => setDeleteItem(null)}
				onConfirm={() => handleDelete(deleteItem.id)}
				title="Delete Inventory Item"
				message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
			/>
		</div>
	);
};

export default InventoryItems;
