import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../services/supabase";
import { showToast } from "../utils/toastUtils";
import { Plus, Trash2, Edit2, Settings2, X, ChevronDown } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import useQuickNoteStore from "../stores/quickNoteStore";
import { ALL_CATEGORIES } from "../constants";

const ROTATING_CATEGORIES = [
	"Chicken",
	"Pork",
	"Beef",
	"Vege",
	"Salad",
	"Seafood",
	"Soup",
	"Side",
];
const REGULAR_CATEGORIES = ["Rice", "Noodles", "Drink", "Extra"];

const QuickNoteSettings = () => {
	const { settings, loading, fetchAllSettings, refresh } = useQuickNoteStore();
	const [activeTypeTab, setActiveTypeTab] = useState("taste_profile");
	const [showModal, setShowModal] = useState(false);
	const [editingNote, setEditingNote] = useState(null);

	// Form state
	const [label, setLabel] = useState("");
	const [scope, setScope] = useState("all");
	const [groupName, setGroupName] = useState("");
	const [options, setOptions] = useState(["No", "Low", "Med", "High"]);
	const [isActive, setIsActive] = useState(true);
	const [applicableCategories, setApplicableCategories] = useState([]);
	const [showCategoryPicker, setShowCategoryPicker] = useState(false);
	const [newOptionInput, setNewOptionInput] = useState("");

	useEffect(() => {
		fetchAllSettings();
	}, [fetchAllSettings]);

	useEffect(() => {
		if (editingNote) {
			setLabel(editingNote.label || "");
			setScope(editingNote.scope || "all");
			setGroupName(editingNote.group_name || "");
			setOptions(editingNote.options || ["No", "Low", "Med", "High"]);
			setIsActive(editingNote.is_active ?? true);
			setApplicableCategories(editingNote.applicable_categories || []);
			setShowCategoryPicker(
				(editingNote.applicable_categories || []).length > 0
			);
		} else {
			setLabel("");
			setScope("all");
			setGroupName("");
			setOptions(["No", "Low", "Med", "High"]);
			setIsActive(true);
			setApplicableCategories([]);
			setShowCategoryPicker(false);
		}
		setNewOptionInput("");
	}, [editingNote, showModal]);

	const handleSave = async (e) => {
		e.preventDefault();
		if (!label.trim()) {
			showToast.error("Label is required");
			return;
		}
		if (activeTypeTab === "taste_profile" && options.length < 2) {
			showToast.error("At least 2 options are required for taste profiles");
			return;
		}

		const finalApplicableCategories = showCategoryPicker ? applicableCategories : [];

		const payload = {
			type: activeTypeTab,
			label: label.trim(),
			scope,
			group_name:
				activeTypeTab === "taste_profile" ? groupName.trim() || label.trim() : null,
			options: activeTypeTab === "taste_profile" ? options : null,
			applicable_categories: finalApplicableCategories,
			is_active: isActive,
			updated_at: new Date().toISOString(),
		};

		try {
			if (editingNote) {
				const { error } = await supabase
					.from("quick_note_settings")
					.update(payload)
					.eq("id", editingNote.id);
				if (error) throw error;
				showToast.success("Updated successfully");
			} else {
				const { error } = await supabase
					.from("quick_note_settings")
					.insert([payload]);
				if (error) throw error;
				showToast.success("Created successfully");
			}

			setShowModal(false);
			setEditingNote(null);
			fetchAllSettings();
			refresh();
		} catch (error) {
			console.error("Error saving quick note setting:", error);
			showToast.error(error.message);
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
			fetchAllSettings();
			refresh();
		} catch (error) {
			console.error("Error deleting quick note setting:", error);
			showToast.error(error.message);
		}
	};

	const toggleCategory = (cat) => {
		setApplicableCategories((prev) =>
			prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
		);
	};

	const addOption = () => {
		const val = newOptionInput.trim();
		if (!val) return;
		if (options.includes(val)) {
			showToast.error("Option already exists");
			return;
		}
		setOptions([...options, val]);
		setNewOptionInput("");
	};

	const removeOption = (opt) => {
		if (options.length <= 2) return;
		setOptions(options.filter((o) => o !== opt));
	};

	const filteredSettings = settings.filter((s) => s.type === activeTypeTab);

	const renderScopeBadge = (scope) => {
		switch (scope) {
			case "all":
				return <span className="badge badge-ghost badge-sm">All Items</span>;
			case "rotating":
				return <span className="badge badge-secondary badge-sm">Rotating</span>;
			case "regular":
				return <span className="badge badge-primary badge-sm">Regular</span>;
			case "combo":
				return <span className="badge badge-accent badge-sm">Combos</span>;
			default:
				return null;
		}
	};

	return (
		<div className="container mx-auto pb-10">
			<PageHeader
				title="Quick Note Settings"
				description="Taste profiles and frequent requests for the order modal"
				buttons={[
					{
						label:
							activeTypeTab === "taste_profile"
								? "Add Taste Profile"
								: "Add Frequent Request",
						icon: Plus,
						onClick: () => {
							setEditingNote(null);
							setShowModal(true);
						},
						variant: "primary",
					},
				]}
			/>

			{/* Tabs */}
			<div className="tabs tabs-boxed w-fit mb-6 bg-base-200">
				<button
					className={`tab ${activeTypeTab === "taste_profile" ? "tab-active" : ""}`}
					onClick={() => setActiveTypeTab("taste_profile")}>
					Taste Profiles
				</button>
				<button
					className={`tab ${activeTypeTab === "frequent_request" ? "tab-active" : ""}`}
					onClick={() => setActiveTypeTab("frequent_request")}>
					Frequent Requests
				</button>
			</div>

			{/* Settings Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{loading ? (
					<div className="col-span-full py-20 text-center">
						<span className="loading loading-spinner loading-lg"></span>
					</div>
				) : filteredSettings.length > 0 ? (
					filteredSettings.map((setting) => (
						<div
							key={setting.id}
							className="card bg-base-100 border border-base-300 shadow-sm transition-all hover:shadow-md">
							<div className="card-body p-4">
								<div className="flex justify-between items-start">
									<div className="flex-1 min-w-0">
										<h3 className="font-bold text-lg truncate" title={setting.label}>
											{setting.label}
										</h3>
										{setting.type === "taste_profile" &&
											setting.group_name &&
											setting.group_name !== setting.label && (
												<p className="text-xs text-gray-500 truncate">
													Group: {setting.group_name}
												</p>
											)}
									</div>
									<div className="flex gap-1 ml-2">
										<button
											className="btn btn-ghost btn-xs btn-square"
											onClick={() => {
												setEditingNote(setting);
												setShowModal(true);
											}}>
											<Edit2 className="w-3.5 h-3.5" />
										</button>
										<button
											className="btn btn-ghost btn-xs btn-square text-error"
											onClick={() => handleDelete(setting.id)}>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</div>
								</div>

								<div className="mt-2 flex flex-wrap gap-1 items-center">
									{renderScopeBadge(setting.scope)}
									{setting.applicable_categories?.map((cat) => (
										<span key={cat} className="badge badge-outline badge-xs">
											{cat}
										</span>
									))}
								</div>

								{setting.type === "taste_profile" && setting.options && (
									<div className="mt-3 flex gap-1 flex-wrap">
										{setting.options.map((opt) => (
											<span key={opt} className="badge badge-outline badge-sm text-[10px]">
												{opt}
											</span>
										))}
									</div>
								)}

								{!setting.is_active && (
									<span className="text-[10px] text-error font-bold uppercase mt-2">
										Disabled
									</span>
								)}
							</div>
						</div>
					))
				) : (
					<div className="col-span-full py-16 text-center bg-base-200 rounded-xl border-2 border-dashed border-base-300">
						<Settings2 className="w-12 h-12 mx-auto opacity-20 mb-2" />
						<p className="text-base-content/50">
							No {activeTypeTab === "taste_profile" ? "taste profile" : "frequent request"}{" "}
							settings yet
						</p>
					</div>
				)}
			</div>

			{/* Toppings Info Card */}
			<div className="card bg-base-200 mt-6 border border-base-300">
				<div className="card-body py-3 px-4 flex flex-row items-center gap-3">
					<div className="bg-base-100 p-2 rounded-lg">
						<Plus className="w-4 h-4 text-primary" />
					</div>
					<div>
						<p className="text-sm font-bold">Toppings & Extras</p>
						<p className="text-xs text-gray-500">
							Managed per menu item. Go to All Menu → select any item → Edit → Extras /
							Toppings tab.
						</p>
					</div>
				</div>
			</div>

			{/* Modal */}
			{showModal && (
				<div className="modal modal-open">
					<div className="modal-box max-w-md p-0 overflow-hidden">
						<div className="p-6 pb-4 border-b border-base-200 flex justify-between items-center sticky top-0 bg-base-100 z-10">
							<h3 className="font-bold text-xl">
								{editingNote ? "Edit" : "Add"}{" "}
								{activeTypeTab === "taste_profile" ? "Taste Profile" : "Frequent Request"}
							</h3>
							<button
								className="btn btn-sm btn-circle btn-ghost"
								onClick={() => {
									setShowModal(false);
									setEditingNote(null);
								}}>
								<X className="w-5 h-5" />
							</button>
						</div>

						<form onSubmit={handleSave} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
							{/* Label */}
							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">Label *</span>
								</label>
								<input
									type="text"
									className="input input-bordered w-full"
									value={label}
									onChange={(e) => setLabel(e.target.value)}
									placeholder={
										activeTypeTab === "taste_profile" ? "e.g. Spicy" : "e.g. No MSG"
									}
									required
								/>
							</div>

							{/* Taste Profile Specific: Group Name */}
							{activeTypeTab === "taste_profile" && (
								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-bold text-sm">Group Name</span>
									</label>
									<input
										type="text"
										className="input input-bordered w-full"
										value={groupName}
										onChange={(e) => setGroupName(e.target.value)}
										placeholder="e.g. Spicy, Sweet"
									/>
									<span className="text-[10px] text-gray-400 mt-1">
										If empty, uses label as group name
									</span>
								</div>
							)}

							{/* Scope Selection */}
							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">Applies To</span>
								</label>
								<div className="grid grid-cols-2 gap-2">
									{[
										{ id: "all", label: "All Items" },
										{ id: "rotating", label: "Rotating Items" },
										{ id: "regular", label: "Regular Items" },
										{ id: "combo", label: "Combo Items" },
									].map((s) => (
										<button
											key={s.id}
											type="button"
											className={`btn btn-sm ${
												scope === s.id ? "btn-primary" : "btn-outline"
											}`}
											onClick={() => {
												setScope(s.id);
												setApplicableCategories([]);
												setShowCategoryPicker(false);
											}}>
											{s.label}
										</button>
									))}
								</div>
							</div>

							{/* Category Narrowing */}
							{(scope === "rotating" || scope === "regular") && (
								<div className="bg-base-200 p-4 rounded-xl space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold">
											Narrow to specific categories
										</span>
										<input
											type="checkbox"
											className="toggle toggle-sm toggle-primary"
											checked={showCategoryPicker}
											onChange={(e) => {
												setShowCategoryPicker(e.target.checked);
												if (!e.target.checked) setApplicableCategories([]);
											}}
										/>
									</div>

									{showCategoryPicker && (
										<div className="space-y-2 pt-2 border-t border-base-300">
											<div className="grid grid-cols-2 gap-2">
												{(scope === "rotating"
													? ROTATING_CATEGORIES
													: REGULAR_CATEGORIES
												).map((cat) => (
													<label
														key={cat}
														className="flex items-center gap-2 cursor-pointer hover:bg-base-300 p-1.5 rounded-lg transition-colors">
														<input
															type="checkbox"
															className="checkbox checkbox-sm checkbox-primary"
															checked={applicableCategories.includes(cat)}
															onChange={() => toggleCategory(cat)}
														/>
														<span className="text-xs">{cat}</span>
													</label>
												))}
											</div>
											<p className="text-[10px] text-gray-400 italic">
												Leave all unchecked to apply to all{" "}
												{scope === "rotating" ? "Rotating" : "Regular"} items
											</p>
										</div>
									)}
								</div>
							)}

							{/* Taste Profile Specific: Options */}
							{activeTypeTab === "taste_profile" && (
								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-bold text-sm">Levels</span>
									</label>
									<div className="flex flex-wrap gap-1 mb-3">
										{options.map((opt) => (
											<div
												key={opt}
												className="badge badge-outline badge-lg py-4 gap-1 border-base-300">
												<span className="text-xs font-medium">{opt}</span>
												{options.length > 2 && (
													<button
														type="button"
														className="hover:text-error transition-colors"
														onClick={() => removeOption(opt)}>
														<X className="w-3 h-3" />
													</button>
												)}
											</div>
										))}
									</div>
									<div className="flex gap-2">
										<input
											type="text"
											className="input input-bordered input-sm flex-1"
											placeholder="Add level..."
											value={newOptionInput}
											onChange={(e) => setNewOptionInput(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													addOption();
												}
											}}
										/>
										<button
											type="button"
											className="btn btn-sm btn-outline"
											onClick={addOption}>
											Add
										</button>
									</div>
								</div>
							)}

							{/* Active Toggle */}
							<div className="form-control">
								<label className="label cursor-pointer justify-start gap-3">
									<input
										type="checkbox"
										className="checkbox checkbox-primary"
										checked={isActive}
										onChange={(e) => setIsActive(e.target.checked)}
									/>
									<span className="label-text font-bold">Active</span>
								</label>
							</div>
						</form>

						<div className="p-6 border-t border-base-200 bg-base-50 flex justify-end gap-2 sticky bottom-0 bg-base-100 z-10">
							<button
								type="button"
								className="btn btn-ghost"
								onClick={() => {
									setShowModal(false);
									setEditingNote(null);
								}}>
								Cancel
							</button>
							<button type="submit" className="btn btn-primary px-8" onClick={handleSave}>
								Save Changes
							</button>
						</div>
					</div>
					<div
						className="modal-backdrop bg-black/50"
						onClick={() => {
							setShowModal(false);
							setEditingNote(null);
						}}></div>
				</div>
			)}
		</div>
	);
};

export default QuickNoteSettings;
