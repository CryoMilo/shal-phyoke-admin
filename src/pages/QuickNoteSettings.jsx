import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";
import { Plus, Trash2, Edit2, Settings2 } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import useQuickNoteStore from "../stores/quickNoteStore";

const CATEGORIES = ["Food", "Drink", "Noodle", "Rice", "Salad", "Appetizer"];

const QuickNoteSettings = () => {
	const { settings, loading, fetchAllSettings, refresh } = useQuickNoteStore();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingNote, setEditingNote] = useState(null);
	const [activeTypeTab, setActiveTypeTab] = useState("taste_profile");

	const [formData, setFormData] = useState({
		type: "taste_profile",
		group_name: "",
		modal_label: "",
		slip_label: "",
		applicable_categories: [],
		options: ["No", "Low", "Med", "High"],
		is_active: true,
	});

	useEffect(() => {
		fetchAllSettings();
	}, [fetchAllSettings]);

	const handleOpenModal = (note = null) => {
		if (note) {
			setEditingNote(note);
			setFormData({ ...note });
		} else {
			setEditingNote(null);
			setFormData({
				type: activeTypeTab,
				group_name: "",
				modal_label: "",
				slip_label: "",
				applicable_categories: [],
				options: activeTypeTab === "taste_profile" ? ["No", "Low", "Med", "High"] : null,
				is_active: true,
			});
		}
		setIsModalOpen(true);
	};

	const handleSave = async () => {
		try {
			if (!formData.modal_label || !formData.slip_label) {
				showToast.error("Please fill in required labels");
				return;
			}

			if (editingNote) {
				const { error } = await supabase
					.from("quick_note_settings")
					.update(formData)
					.eq("id", editingNote.id);
				if (error) throw error;
				showToast.success("Updated successfully");
			} else {
				const { error } = await supabase
					.from("quick_note_settings")
					.insert([formData]);
				if (error) throw error;
				showToast.success("Created successfully");
			}

			setIsModalOpen(false);
			refresh();
			fetchAllSettings();
		} catch (error) {
			console.error("Error saving quick note setting:", error);
			showToast.error("Failed to save setting");
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Are you sure you want to delete this setting?")) return;
		try {
			const { error } = await supabase
				.from("quick_note_settings")
				.delete()
				.eq("id", id);
			if (error) throw error;
			showToast.success("Deleted successfully");
			refresh();
			fetchAllSettings();
		} catch (error) {
			console.error("Error deleting quick note setting:", error);
			showToast.error("Failed to delete setting");
		}
	};

	const toggleCategory = (cat) => {
		setFormData((prev) => {
			const current = prev.applicable_categories || [];
			const next = current.includes(cat)
				? current.filter((c) => c !== cat)
				: [...current, cat];
			return { ...prev, applicable_categories: next };
		});
	};

	const filteredSettings = settings.filter((s) => s.type === activeTypeTab);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Quick Note Settings"
				description="Manage Taste Profiles and Frequent Requests for the Order Modal"
			/>

			{/* Type Tabs */}
			<div className="tabs tabs-boxed w-fit bg-base-200">
				<button
					className={`tab ${
						activeTypeTab === "taste_profile" ? "tab-active font-bold" : ""
					}`}
					onClick={() => setActiveTypeTab("taste_profile")}>
					Taste Profiles
				</button>
				<button
					className={`tab ${
						activeTypeTab === "frequent_request" ? "tab-active font-bold" : ""
					}`}
					onClick={() => setActiveTypeTab("frequent_request")}>
					Frequent Requests
				</button>
			</div>

			{/* Action Bar */}
			<div className="flex justify-end">
				<button
					className="btn btn-primary gap-2"
					onClick={() => handleOpenModal()}>
					<Plus className="w-4 h-4" />
					Add{" "}
					{activeTypeTab === "taste_profile" ? "Taste Profile" : "Quick Note"}
				</button>
			</div>

			{/* Settings List */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{loading ? (
					<div className="col-span-full py-20 text-center">
						<span className="loading loading-spinner loading-lg"></span>
					</div>
				) : filteredSettings.length > 0 ? (
					filteredSettings.map((item) => (
						<div
							key={item.id}
							className="card bg-base-100 border border-base-300 shadow-sm">
							<div className="card-body p-4">
								<div className="flex justify-between items-start">
									<div>
										<h3 className="font-bold text-lg">{item.modal_label}</h3>
										<p className="text-xs text-gray-500 italic">
											Slip: {item.slip_label}
										</p>
									</div>
									<div className="flex gap-1">
										<button
											className="btn btn-ghost btn-xs btn-square"
											onClick={() => handleOpenModal(item)}>
											<Edit2 className="w-3.5 h-3.5" />
										</button>
										<button
											className="btn btn-ghost btn-xs btn-square text-error"
											onClick={() => handleDelete(item.id)}>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</div>
								</div>

								<div className="mt-4 flex flex-wrap gap-1">
									{(item.applicable_categories || []).length === 0 ? (
										<span className="badge badge-sm badge-ghost">
											All Categories
										</span>
									) : (
										item.applicable_categories.map((cat) => (
											<span key={cat} className="badge badge-sm badge-outline">
												{cat}
											</span>
										))
									)}
								</div>

								{item.type === "taste_profile" && item.options && (
									<div className="mt-3 flex gap-1">
										{item.options.map((opt) => (
											<span
												key={opt}
												className="text-[10px] bg-base-200 px-1.5 py-0.5 rounded">
												{opt}
											</span>
										))}
									</div>
								)}

								{!item.is_active && (
									<div className="mt-2 text-[10px] text-error font-bold uppercase">
										Disabled
									</div>
								)}
							</div>
						</div>
					))
				) : (
					<div className="col-span-full py-20 text-center bg-base-200 rounded-xl border-2 border-dashed border-base-300">
						<Settings2 className="w-12 h-12 mx-auto text-base-content/20 mb-2" />
						<p className="text-base-content/50">
							No settings found for{" "}
							{activeTypeTab === "taste_profile"
								? "Taste Profiles"
								: "Frequent Requests"}
						</p>
					</div>
				)}
			</div>

			{/* Modal */}
			{isModalOpen && (
				<div className="modal modal-open">
					<div className="modal-box max-w-lg">
						<h3 className="font-bold text-xl mb-6">
							{editingNote ? "Edit" : "Add New"}{" "}
							{formData.type === "taste_profile"
								? "Taste Profile"
								: "Quick Note"}
						</h3>

						<div className="space-y-4">
							{/* Form Fields */}
							{formData.type === "taste_profile" && (
								<div className="form-control">
									<label className="label">
										<span className="label-text font-bold">
											Group Name (e.g. Spicy, Sweet)
										</span>
									</label>
									<input
										type="text"
										className="input input-bordered"
										value={formData.group_name}
										onChange={(e) =>
											setFormData({ ...formData, group_name: e.target.value })
										}
										placeholder="Spicy"
									/>
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								<div className="form-control">
									<label className="label">
										<span className="label-text font-bold">Modal Label</span>
									</label>
									<input
										type="text"
										className="input input-bordered"
										value={formData.modal_label}
										onChange={(e) =>
											setFormData({ ...formData, modal_label: e.target.value })
										}
										placeholder="No Chili"
									/>
								</div>
								<div className="form-control">
									<label className="label">
										<span className="label-text font-bold">Slip Label</span>
									</label>
									<input
										type="text"
										className="input input-bordered"
										value={formData.slip_label}
										onChange={(e) =>
											setFormData({ ...formData, slip_label: e.target.value })
										}
										placeholder="NO CHILI"
									/>
								</div>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text font-bold">
										Applicable Categories
									</span>
								</label>
								<div className="flex flex-wrap gap-2">
									{CATEGORIES.map((cat) => (
										<button
											key={cat}
											type="button"
											onClick={() => toggleCategory(cat)}
											className={`btn btn-xs ${
												formData.applicable_categories?.includes(cat)
													? "btn-primary"
													: "btn-outline"
											}`}>
											{cat}
										</button>
									))}
								</div>
								<p className="text-[10px] text-gray-500 mt-1">
									Empty means applicable to all categories
								</p>
							</div>

							<div className="form-control">
								<label className="label cursor-pointer justify-start gap-4">
									<input
										type="checkbox"
										className="checkbox checkbox-primary"
										checked={formData.is_active}
										onChange={(e) =>
											setFormData({ ...formData, is_active: e.target.checked })
										}
									/>
									<span className="label-text font-bold">Active</span>
								</label>
							</div>
						</div>

						<div className="modal-action">
							<button className="btn" onClick={() => setIsModalOpen(false)}>
								Cancel
							</button>
							<button className="btn btn-primary" onClick={handleSave}>
								Save Changes
							</button>
						</div>
					</div>
					<div
						className="modal-backdrop"
						onClick={() => setIsModalOpen(false)}></div>
				</div>
			)}
		</div>
	);
};

export default QuickNoteSettings;
