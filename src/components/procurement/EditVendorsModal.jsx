// src/components/procurement/EditVendorsModal.jsx
import React, { useState, useEffect } from "react";
import { X, Edit2, Trash2, Plus } from "lucide-react";
import { supabase } from "../../services/supabase";
import { showToast } from "../../utils/toastUtils";
import DeleteConfirmationModal from "../common/DeleteConfirmationModal";

const EditVendorsModal = ({ isOpen, onClose }) => {
	const [vendors, setVendors] = useState([]);
	const [loading, setLoading] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [editForm, setEditForm] = useState({ name: "", line_id: "" });
	const [newVendor, setNewVendor] = useState({ name: "", line_id: "" });
	const [showAddForm, setShowAddForm] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState(null);

	useEffect(() => {
		if (isOpen) {
			fetchVendors();
		}
	}, [isOpen]);

	const fetchVendors = async () => {
		setLoading(true);
		try {
			const { data, error } = await supabase
				.from("vendors")
				.select("*")
				.order("name");

			if (error) throw error;
			setVendors(data || []);
		} catch (error) {
			console.error("Error fetching vendors:", error);
			showToast.error("Failed to load vendors");
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async (id) => {
		try {
			const { error } = await supabase
				.from("vendors")
				.update({ name: editForm.name, line_id: editForm.line_id || null })
				.eq("id", id);

			if (error) throw error;

			showToast.success("Vendor updated");
			setEditingId(null);
			fetchVendors();
		} catch (error) {
			console.error("Error updating vendor:", error);
			showToast.error("Failed to update vendor");
		}
	};

	const handleDelete = (id) => {
		setDeleteTargetId(id);
		setShowDeleteConfirm(true);
	};

	const confirmDelete = async () => {
		try {
			const { error } = await supabase
				.from("vendors")
				.delete()
				.eq("id", deleteTargetId);

			if (error) throw error;

			showToast.success("Vendor deleted");
			fetchVendors();
		} catch (error) {
			console.error("Error deleting vendor:", error);
			showToast.error("Failed to delete vendor");
		} finally {
			setShowDeleteConfirm(false);
			setDeleteTargetId(null);
		}
	};

	const handleAdd = async () => {
		if (!newVendor.name.trim()) {
			showToast.error("Vendor name is required");
			return;
		}

		try {
			const { error } = await supabase.from("vendors").insert([
				{
					name: newVendor.name.trim(),
					line_id: newVendor.line_id.trim() || null,
				},
			]);

			if (error) throw error;

			showToast.success("Vendor added");
			setNewVendor({ name: "", line_id: "" });
			setShowAddForm(false);
			fetchVendors();
		} catch (error) {
			console.error("Error adding vendor:", error);
			showToast.error("Failed to add vendor");
		}
	};

	if (!isOpen) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-2xl relative">
				<button
					onClick={onClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
					<X className="w-4 h-4" />
				</button>

				<h3 className="font-bold text-xl mb-6">Manage Vendors</h3>

				{/* Add New Vendor Button */}
				{!showAddForm ? (
					<button
						onClick={() => setShowAddForm(true)}
						className="btn btn-primary btn-sm gap-2 mb-4">
						<Plus className="w-4 h-4" />
						Add New Vendor
					</button>
				) : (
					<div className="bg-base-200 p-4 rounded-lg mb-4">
						<h4 className="font-medium mb-3">Add New Vendor</h4>
						<div className="space-y-3">
							<input
								type="text"
								placeholder="Vendor Name *"
								value={newVendor.name}
								onChange={(e) =>
									setNewVendor({ ...newVendor, name: e.target.value })
								}
								className="input input-bordered w-full"
								autoFocus
							/>
							<input
								type="text"
								placeholder="LINE ID (optional)"
								value={newVendor.line_id}
								onChange={(e) =>
									setNewVendor({ ...newVendor, line_id: e.target.value })
								}
								className="input input-bordered w-full"
							/>
							<div className="flex gap-2">
								<button onClick={handleAdd} className="btn btn-primary btn-sm">
									Save
								</button>
								<button
									onClick={() => {
										setShowAddForm(false);
										setNewVendor({ name: "", line_id: "" });
									}}
									className="btn btn-ghost btn-sm">
									Cancel
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Vendors List */}
				<div className="space-y-2 max-h-96 overflow-y-auto">
					{loading ? (
						<div className="text-center py-4">Loading...</div>
					) : vendors.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							No vendors found. Add your first vendor above.
						</div>
					) : (
						vendors.map((vendor) => (
							<div
								key={vendor.id}
								className="flex items-center gap-3 p-3 bg-base-100 rounded-lg border border-base-200">
								{editingId === vendor.id ? (
									// Edit mode
									<div className="flex-1 flex gap-2">
										<input
											type="text"
											value={editForm.name}
											onChange={(e) =>
												setEditForm({ ...editForm, name: e.target.value })
											}
											className="input input-bordered input-sm flex-1"
											placeholder="Name"
										/>
										<input
											type="text"
											value={editForm.line_id}
											onChange={(e) =>
												setEditForm({ ...editForm, line_id: e.target.value })
											}
											className="input input-bordered input-sm w-32"
											placeholder="LINE ID"
										/>
										<button
											onClick={() => handleUpdate(vendor.id)}
											className="btn btn-primary btn-sm">
											Save
										</button>
										<button
											onClick={() => setEditingId(null)}
											className="btn btn-ghost btn-sm">
											Cancel
										</button>
									</div>
								) : (
									// View mode
									<>
										<div className="flex-1">
											<p className="font-medium">{vendor.name}</p>
											{vendor.line_id && (
												<p className="text-xs text-gray-500">
													LINE: {vendor.line_id}
												</p>
											)}
										</div>
										<div className="flex gap-1">
											<button
												onClick={() => {
													setEditingId(vendor.id);
													setEditForm({
														name: vendor.name,
														line_id: vendor.line_id || "",
													});
												}}
												className="btn btn-ghost btn-xs btn-square"
												title="Edit vendor">
												<Edit2 className="w-4 h-4" />
											</button>
											<button
												onClick={() => handleDelete(vendor.id)}
												className="btn btn-ghost btn-xs btn-square text-error"
												title="Delete vendor">
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</>
								)}
							</div>
						))
					)}
				</div>

				<div className="modal-action">
					<button onClick={onClose} className="btn">
						Close
					</button>
				</div>
			</div>
			<div className="modal-backdrop" onClick={onClose} />

			<DeleteConfirmationModal
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={confirmDelete}
				title="Delete Vendor"
				message="Are you sure you want to delete this vendor? This will not remove items already associated with this vendor but will remove the vendor from the system."
			/>
		</div>
	);
};

export default EditVendorsModal;
