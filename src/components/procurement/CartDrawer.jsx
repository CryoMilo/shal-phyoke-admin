// src/components/procurement/CartDrawer.jsx
import React, { useState } from "react";
import {
	X,
	ShoppingBag,
	Trash2,
	Edit2,
	Check,
	AlertCircle,
} from "lucide-react";
import useProcurementStore from "../../stores/procurementStore";
import ConfirmOrderModal from "./ConfirmOrderModal";

const CartDrawer = ({ userId }) => {
	const [editingItem, setEditingItem] = useState(null);
	const [editQuantity, setEditQuantity] = useState(1);
	const [editUnit, setEditUnit] = useState("");
	const [confirmVendor, setConfirmVendor] = useState(null);

	const {
		activeCart,
		isCartOpen,
		toggleCart,
		removeFromCart,
		updateCartItem,
		getCartByVendor,
	} = useProcurementStore();

	const cartByVendor = getCartByVendor();

	const startEdit = (item) => {
		setEditingItem(item.id);
		setEditQuantity(item.quantity);
		setEditUnit(item.unit || item.inventory_item?.unit || "piece");
	};

	const saveEdit = async (itemId) => {
		await updateCartItem(itemId, { quantity: editQuantity, unit: editUnit });
		setEditingItem(null);
	};

	const cancelEdit = () => {
		setEditingItem(null);
	};

	const totalItems = activeCart.length;
	const missedItems = activeCart.filter((item) => item.is_missed).length;

	if (!isCartOpen) return null;

	return (
		<>
			{/* Overlay */}
			<div
				className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
				onClick={toggleCart}
			/>

			{/* Drawer */}
			<div className="fixed right-0 top-0 h-full w-full max-w-md bg-base-100 shadow-xl z-50 overflow-y-auto">
				<div className="sticky top-0 bg-base-100 border-b border-base-200 p-4 flex items-center justify-between">
					<h2 className="font-semibold flex items-center gap-2">
						<ShoppingBag className="w-5 h-5" />
						Market List
						{totalItems > 0 && (
							<span className="badge badge-primary badge-sm">{totalItems}</span>
						)}
					</h2>
					<button
						onClick={toggleCart}
						className="btn btn-ghost btn-sm btn-circle">
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-4 space-y-4">
					{missedItems > 0 && (
						<div className="alert alert-warning shadow-sm">
							<AlertCircle className="w-4 h-4" />
							<span className="text-sm">
								{missedItems} missed item(s) from previous orders
							</span>
						</div>
					)}

					{Object.values(cartByVendor).map(({ vendor, items }) => (
						<div
							key={vendor.id}
							className="card bg-base-200 border border-base-300">
							<div className="card-body p-3">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-medium">{vendor.name}</h3>
										<p className="text-xs text-gray-500">
											{items.length} items
										</p>
									</div>
									<button
										onClick={() => setConfirmVendor(vendor)}
										className="btn btn-primary btn-sm">
										Confirm
									</button>
								</div>

								<div className="space-y-2 mt-2">
									{items.map((item) => (
										<div
											key={item.id}
											className={`flex items-center gap-2 p-2 rounded-lg ${
												item.is_missed
													? "bg-orange-100 border border-orange-200"
													: "bg-base-100"
											}`}>
											{item.is_missed && (
												<AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
											)}

											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">
													{item.inventory_item?.name || item.custom_item_name}
												</p>

												{editingItem === item.id ? (
													<div className="flex items-center gap-1 mt-1">
														<input
															type="number"
															min="0.5"
															step="0.5"
															value={editQuantity}
															onChange={(e) =>
																setEditQuantity(parseFloat(e.target.value) || 1)
															}
															className="input input-bordered input-xs w-16"
														/>
														<input
															type="text"
															value={editUnit}
															onChange={(e) => setEditUnit(e.target.value)}
															className="input input-bordered input-xs w-20"
														/>
														<button
															onClick={() => saveEdit(item.id)}
															className="btn btn-ghost btn-xs text-success">
															<Check className="w-3 h-3" />
														</button>
														<button
															onClick={cancelEdit}
															className="btn btn-ghost btn-xs text-error">
															<X className="w-3 h-3" />
														</button>
													</div>
												) : (
													<p className="text-xs text-gray-600">
														{item.quantity}{" "}
														{item.unit || item.inventory_item?.unit}
														{item.notes && ` • ${item.notes}`}
													</p>
												)}
											</div>

											{editingItem !== item.id && (
												<div className="flex items-center gap-1">
													<button
														onClick={() => startEdit(item)}
														className="btn btn-ghost btn-xs">
														<Edit2 className="w-3 h-3" />
													</button>
													<button
														onClick={() => removeFromCart(item.id)}
														className="btn btn-ghost btn-xs text-error">
														<Trash2 className="w-3 h-3" />
													</button>
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						</div>
					))}

					{totalItems === 0 && (
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
			{confirmVendor && (
				<ConfirmOrderModal
					isOpen={!!confirmVendor}
					onClose={() => setConfirmVendor(null)}
					vendor={confirmVendor}
					items={cartByVendor[confirmVendor.id]?.items || []}
					userId={userId}
				/>
			)}
		</>
	);
};

export default CartDrawer;
