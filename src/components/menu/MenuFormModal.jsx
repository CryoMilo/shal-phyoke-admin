// src/components/menu/MenuFormModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import MenuForm from "../common/MenuForm";
import MenuItemExtrasManager from "../orders/MenuItemExtrasManager";

const MenuFormModal = ({
	showModal,
	setShowModal,
	editingMenu,
	handleSubmit,
	loading = false,
	isRegularOnly = false,
}) => {
	const [activeTab, setActiveTab] = useState("basic"); // 'basic' or 'extras'

	if (!showModal) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="modal-backdrop fixed inset-0 bg-black/50 z-40"
				onClick={() => !loading && setShowModal(false)}
			/>

			{/* Modal */}
			<div className="modal modal-open z-50">
				<div className="modal-box relative max-w-3xl w-full mx-2 md:mx-auto max-h-[90vh] overflow-y-auto">
					<div className="bg-base-100 pb-4 border-b border-base-300 -mx-6 px-6 z-30 sticky top-0">
						<div className="flex justify-between items-center">
							<h3 className="font-bold text-lg md:text-xl">
								{editingMenu ? "Edit Menu Item" : "Create New Menu Item"}
							</h3>
							<button
								className="btn btn-circle btn-ghost btn-sm"
								onClick={() => setShowModal(false)}
								disabled={loading}>
								<X className="w-5 h-5" />
							</button>
						</div>
						{editingMenu && (
							<p className="text-sm text-gray-500 mt-1">
								Editing: {editingMenu.name_english || editingMenu.name_burmese}
							</p>
						)}

						{/* Tabs */}
						{editingMenu && (
							<div className="flex gap-2 mt-4 border-b border-base-300 pb-2">
								<button
									onClick={() => setActiveTab("basic")}
									className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
										activeTab === "basic"
											? "bg-primary text-white"
											: "hover:bg-base-200"
									}`}>
									Basic Information
								</button>
								<button
									onClick={() => setActiveTab("extras")}
									className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
										activeTab === "extras"
											? "bg-primary text-white"
											: "hover:bg-base-200"
									}`}>
									Extras / Toppings
								</button>
							</div>
						)}
					</div>

					{/* Form Content */}
					<div className="mt-4">
						{activeTab === "basic" || !editingMenu ? (
							<MenuForm
								editingMenu={editingMenu}
								onSubmit={handleSubmit}
								onCancel={() => setShowModal(false)}
								loading={loading}
								isRegularOnly={isRegularOnly}
							/>
						) : (
							<div className="py-4">
								<MenuItemExtrasManager menuItemId={editingMenu.id} />

								{/* Done button */}
								<div className="flex justify-end mt-6 pt-4 border-t border-base-300">
									<button
										onClick={() => setShowModal(false)}
										className="btn btn-primary">
										Done
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default MenuFormModal;
