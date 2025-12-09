import React from "react";
import { X } from "lucide-react";
import MenuForm from "../common/MenuForm";

const MenuFormModal = ({
	showModal,
	setShowModal,
	editingMenu,
	handleSubmit,
	loading = false,
	isRegularOnly = false,
}) => {
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
				<div className="modal-box relative max-w-2xl w-full mx-2 md:mx-auto max-h-[90vh] overflow-y-auto">
					<div className="bg-base-100 pb-4 border-b border-base-300 -mx-6 px-6 z-30">
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
					</div>

					{/* Form Content */}
					<div className="mt-4">
						<MenuForm
							editingMenu={editingMenu}
							onSubmit={handleSubmit}
							onCancel={() => setShowModal(false)}
							loading={loading}
							isRegularOnly={isRegularOnly}
						/>
					</div>
				</div>
			</div>
		</>
	);
};

export default MenuFormModal;
