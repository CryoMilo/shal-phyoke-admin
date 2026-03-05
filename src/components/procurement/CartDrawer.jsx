// src/components/procurement/CartDrawer.jsx
import { useState } from "react";
import {
	X,
	ShoppingBag,
	Trash2,
	Edit2,
	Check,
	AlertCircle,
} from "lucide-react";
import VendorCartSection from "./VendorCartSection";
import ConfirmOrderModal from "./ConfirmOrderModal";
import useProcurementStore from "../../stores/useProcurementStore";

const CartDrawer = ({ userId }) => {
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [selectedVendor, setSelectedVendor] = useState(null);

	const { activeCart, isCartOpen, toggleCart, removeFromCart, updateCartItem } =
		useProcurementStore();

	// Group cart items by vendor
	const cartByVendor = activeCart.reduce((acc, item) => {
		const vendorId = item.vendor?.id;
		if (!acc[vendorId]) {
			acc[vendorId] = {
				vendor: item.vendor,
				items: [],
			};
		}
		acc[vendorId].items.push(item);
		return acc;
	}, {});

	const handleEditItem = async (itemId, updates) => {
		await updateCartItem(itemId, updates);
	};

	const handleRemoveItem = async (itemId) => {
		await removeFromCart(itemId);
	};

	const handleConfirmVendor = (vendor) => {
		setSelectedVendor(vendor);
		setIsConfirmModalOpen(true);
	};

	const totalItems = activeCart.length;

	if (!isCartOpen) return null;

	return (
		<>
			{/* Overlay */}
			<div
				className="fixed inset-0 bg-black bg-opacity-50 z-40"
				onClick={toggleCart}
			/>

			{/* Drawer */}
			<div className="fixed right-0 top-0 h-full w-full max-w-md bg-base-100 shadow-xl z-50 overflow-y-auto">
				<div className="sticky top-0 bg-base-100 border-b border-base-300 p-4 flex items-center justify-between">
					<h2 className="font-semibold flex items-center gap-2">
						<ShoppingBag className="w-5 h-5" />
						Market List ({totalItems})
					</h2>
					<button
						onClick={toggleCart}
						className="btn btn-ghost btn-sm btn-circle">
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-4 space-y-6">
					{Object.values(cartByVendor).map(({ vendor, items }) => (
						<VendorCartSection
							key={vendor.id}
							vendor={vendor}
							items={items}
							onEdit={handleEditItem}
							onRemove={handleRemoveItem}
							onConfirm={() => handleConfirmVendor(vendor)}
						/>
					))}

					{activeCart.length === 0 && (
						<div className="text-center py-12">
							<ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
							<p className="text-gray-500">Your market list is empty</p>
							<p className="text-sm text-gray-400 mt-1">
								Add items from the vendor sections
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Confirm Order Modal */}
			{selectedVendor && (
				<ConfirmOrderModal
					isOpen={isConfirmModalOpen}
					onClose={() => {
						setIsConfirmModalOpen(false);
						setSelectedVendor(null);
					}}
					vendor={selectedVendor}
					items={cartByVendor[selectedVendor.id]?.items || []}
					userId={userId}
				/>
			)}
		</>
	);
};

export default CartDrawer;
