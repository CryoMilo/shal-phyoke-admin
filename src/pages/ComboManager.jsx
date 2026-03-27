// src/pages/ComboManager.jsx
import React, { useState, useEffect, useMemo } from "react";
import useMenuStore from "../stores/menuStore";
import { PageHeader } from "../components/common/PageHeader";
import {
	Plus,
	Edit2,
	Trash2,
	ToggleLeft,
	ToggleRight,
	X,
	Search,
	Check,
} from "lucide-react";
import { ALL_CATEGORIES } from "../constants";
import { showToast } from "../utils/toastUtils";

const ComboManager = () => {
	const {
		allMenuItems,
		fetchAllMenuItems,
		deleteMenuItemById,
		updateMenuItemById,
		createMenuItem,
		toggleMenuStatus,
	} = useMenuStore();

	const [activeTab, setActiveTab] = useState("fixed");
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [modalType, setModalType] = useState(null); // "fixed" | "rotating"

	useEffect(() => {
		if (allMenuItems.length === 0) {
			fetchAllMenuItems();
		}
	}, []);

	// Derived data
	const fixedCombos = useMemo(
		() => allMenuItems.filter((i) => i.is_combo && i.combo_type === "fixed"),
		[allMenuItems]
	);

	const rotatingCombos = useMemo(
		() => allMenuItems.filter((i) => i.is_combo && i.combo_type === "rotating"),
		[allMenuItems]
	);

	const regularMenuItems = useMemo(
		() => allMenuItems.filter((i) => !i.is_combo && i.is_regular && i.is_active),
		[allMenuItems]
	);

	const handleDeleteCombo = async (id) => {
		if (window.confirm("Delete this combo?")) {
			const result = await deleteMenuItemById(id);
			if (!result.error) {
				showToast.success("Combo deleted");
				await fetchAllMenuItems();
			} else {
				showToast.error("Failed to delete combo");
			}
		}
	};

	const handleToggleStatus = async (id) => {
		await toggleMenuStatus(id);
		await fetchAllMenuItems();
	};

	return (
		<div className="container mx-auto p-4 md:p-6">
			<PageHeader
				title="Combo Manager"
				description="Manage fixed and rotating combo meals"
				buttons={[
					{
						label: "New Fixed Combo",
						onClick: () => {
							setModalType("fixed");
							setEditingItem(null);
							setShowModal(true);
						},
						variant: "primary",
						icon: Plus,
					},
					{
						label: "New Rotating Combo",
						onClick: () => {
							setModalType("rotating");
							setEditingItem(null);
							setShowModal(true);
						},
						variant: "secondary",
						icon: Plus,
					},
				]}
			/>

			{/* Tabs */}
			<div className="tabs tabs-boxed w-fit mb-6 bg-base-200">
				<button
					className={`tab ${activeTab === "fixed" ? "tab-active" : ""}`}
					onClick={() => setActiveTab("fixed")}>
					Fixed Combos
				</button>
				<button
					className={`tab ${activeTab === "rotating" ? "tab-active" : ""}`}
					onClick={() => setActiveTab("rotating")}>
					Rotating Combos
				</button>
			</div>

			{/* Fixed Combos Tab */}
			{activeTab === "fixed" && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{fixedCombos.length > 0 ? (
						fixedCombos.map((item) => (
							<div
								key={item.id}
								className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
								<div className="card-body p-4">
									<div className="flex justify-between items-start">
										<div>
											<h3 className="font-bold text-lg">{item.name_burmese}</h3>
											{item.name_english && (
												<p className="text-sm text-gray-500">
													{item.name_english}
												</p>
											)}
										</div>
										<div className="flex gap-1">
											<button
												className="btn btn-ghost btn-xs btn-square"
												onClick={() => {
													setEditingItem(item);
													setModalType("fixed");
													setShowModal(true);
												}}>
												<Edit2 className="w-3.5 h-3.5" />
											</button>
											<button
												className="btn btn-ghost btn-xs btn-square text-error"
												onClick={() => handleDeleteCombo(item.id)}>
												<Trash2 className="w-3.5 h-3.5" />
											</button>
										</div>
									</div>

									<div className="badge badge-primary mt-2">฿{item.price}</div>

									{item.combo_note_summary && (
										<p className="mt-2 text-xs text-gray-500 italic">
											Includes: {item.combo_note_summary}
										</p>
									)}

									<div className="mt-3 flex items-center gap-2">
										<button onClick={() => handleToggleStatus(item.id)}>
											{item.is_active ? (
												<ToggleRight className="w-6 h-6 text-success" />
											) : (
												<ToggleLeft className="w-6 h-6 text-gray-400" />
											)}
										</button>
										<span className="text-xs">
											{item.is_active ? "Active" : "Inactive"}
										</span>
									</div>
								</div>
							</div>
						))
					) : (
						<div className="col-span-full py-12 text-center bg-base-200 rounded-xl border-2 border-dashed border-base-300">
							<p className="text-base-content/50 font-medium">
								No fixed combos yet
							</p>
							<p className="text-xs text-gray-400 mt-1">
								Fixed combos have specific items at a set price
							</p>
						</div>
					)}
				</div>
			)}

			{/* Rotating Combos Tab */}
			{activeTab === "rotating" && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{rotatingCombos.length > 0 ? (
						rotatingCombos.map((item) => (
							<div
								key={item.id}
								className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
								<div className="card-body p-4">
									<div className="flex justify-between items-start">
										<div>
											<h3 className="font-bold text-lg">{item.name_burmese}</h3>
											{item.name_english && (
												<p className="text-sm text-gray-500">
													{item.name_english}
												</p>
											)}
										</div>
										<div className="flex gap-1">
											<button
												className="btn btn-ghost btn-xs btn-square"
												onClick={() => {
													setEditingItem(item);
													setModalType("rotating");
													setShowModal(true);
												}}>
												<Edit2 className="w-3.5 h-3.5" />
											</button>
											<button
												className="btn btn-ghost btn-xs btn-square text-error"
												onClick={() => handleDeleteCombo(item.id)}>
												<Trash2 className="w-3.5 h-3.5" />
											</button>
										</div>
									</div>

									<div className="badge badge-secondary mt-2">
										฿{item.price}
									</div>

									<div className="flex flex-wrap gap-1 mt-2">
										{(item.combo_slots || []).map((slot, i) => (
											<span key={i} className="badge badge-outline badge-sm">
												{slot.label}
												{slot.optional && (
													<span className="text-gray-400 ml-1 text-[10px]">
														opt
													</span>
												)}
											</span>
										))}
									</div>

									<div className="mt-3 flex items-center gap-2">
										<button onClick={() => handleToggleStatus(item.id)}>
											{item.is_active ? (
												<ToggleRight className="w-6 h-6 text-success" />
											) : (
												<ToggleLeft className="w-6 h-6 text-gray-400" />
											)}
										</button>
										<span className="text-xs">
											{item.is_active ? "Active" : "Inactive"}
										</span>
									</div>
								</div>
							</div>
						))
					) : (
						<div className="col-span-full py-12 text-center bg-base-200 rounded-xl border-2 border-dashed border-base-300">
							<p className="text-base-content/50 font-medium">
								No rotating combo templates yet
							</p>
							<p className="text-xs text-gray-400 mt-1">
								Rotating combos allow customers to pick daily specials
							</p>
						</div>
					)}
				</div>
			)}

			{/* Modals */}
			{showModal && modalType === "fixed" && (
				<FixedComboModal
					editingItem={editingItem}
					regularMenuItems={regularMenuItems}
					onClose={() => {
						setShowModal(false);
						setEditingItem(null);
						setModalType(null);
					}}
					onSave={async (payload) => {
						let result;
						if (editingItem) {
							result = await updateMenuItemById(editingItem.id, payload);
						} else {
							result = await createMenuItem(payload);
						}

						if (result.error) {
							showToast.error(result.error.message || "Failed to save");
							return;
						}

						showToast.success(editingItem ? "Combo updated" : "Combo created");
						await fetchAllMenuItems();
						setShowModal(false);
						setEditingItem(null);
						setModalType(null);
					}}
				/>
			)}

			{showModal && modalType === "rotating" && (
				<RotatingComboModal
					editingItem={editingItem}
					onClose={() => {
						setShowModal(false);
						setEditingItem(null);
						setModalType(null);
					}}
					onSave={async (payload) => {
						let result;
						if (editingItem) {
							result = await updateMenuItemById(editingItem.id, payload);
						} else {
							result = await createMenuItem(payload);
						}

						if (result.error) {
							showToast.error(result.error.message || "Failed to save");
							return;
						}

						showToast.success(editingItem ? "Combo updated" : "Combo created");
						await fetchAllMenuItems();
						setShowModal(false);
						setEditingItem(null);
						setModalType(null);
					}}
				/>
			)}
		</div>
	);
};

const FixedComboModal = ({ editingItem, regularMenuItems, onClose, onSave }) => {
	const [nameBurmese, setNameBurmese] = useState(
		editingItem?.name_burmese || ""
	);
	const [nameEnglish, setNameEnglish] = useState(
		editingItem?.name_english || ""
	);
	const [price, setPrice] = useState(editingItem?.price || "");
	const [isActive, setIsActive] = useState(editingItem?.is_active ?? true);
	const [members, setMembers] = useState(editingItem?.combo_members || []);
	const [searchQuery, setSearchQuery] = useState("");
	const [saving, setSaving] = useState(false);

	const filteredRegularItems = useMemo(() => {
		if (!searchQuery.trim()) return [];
		return regularMenuItems.filter((item) =>
			item.name_burmese.toLowerCase().includes(searchQuery.toLowerCase())
		);
	}, [regularMenuItems, searchQuery]);

	const totalItemsPrice = useMemo(() => {
		return members.reduce((sum, m) => {
			const item = regularMenuItems.find((i) => i.id === m.menu_item_id);
			return sum + (item?.price || 0);
		}, 0);
	}, [members, regularMenuItems]);

	const handleAddMember = (item) => {
		if (members.find((m) => m.menu_item_id === item.id)) return;
		setMembers([
			...members,
			{ menu_item_id: item.id, name_burmese: item.name_burmese },
		]);
	};

	const handleRemoveMember = (itemId) => {
		setMembers(members.filter((m) => m.menu_item_id !== itemId));
	};

	const handleSave = async () => {
		setSaving(true);
		const note_summary = members.map((m) => m.name_burmese).join(" + ");

		const payload = {
			name_burmese: nameBurmese.trim(),
			name_english: nameEnglish.trim() || "", // Don't send null to NOT NULL column
			price: parseFloat(price) || 0,
			category: "Combo",
			is_regular: true,
			is_active: isActive,
			is_combo: true,
			combo_type: "fixed",
			combo_members: members,
			combo_slots: null,
			combo_note_summary: note_summary,
			description: "",
			image_url: "",
			sensitive_ingredients: [],
			is_vegan: false,
			name_thai: "",
		};

		await onSave(payload);
		setSaving(false);
	};

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-2xl">
				<div className="flex justify-between items-center mb-6">
					<h3 className="font-bold text-xl">
						{editingItem ? "Edit Fixed Combo" : "New Fixed Combo"}
					</h3>
					<button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Combo Name (Burmese) *</span>
							</label>
							<input
								type="text"
								value={nameBurmese}
								onChange={(e) => setNameBurmese(e.target.value)}
								className="input input-bordered"
								placeholder="e.g. ထမင်းနှင့် ကြက်သားကြော်"
							/>
						</div>
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Combo Name (English)</span>
							</label>
							<input
								type="text"
								value={nameEnglish}
								onChange={(e) => setNameEnglish(e.target.value)}
								className="input input-bordered"
								placeholder="e.g. Rice and Fried Chicken"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Price (฿) *</span>
							</label>
							<input
								type="number"
								step="0.01"
								min="0"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								className="input input-bordered"
								placeholder="0.00"
							/>
						</div>
						<div className="form-control">
							<label className="label cursor-pointer justify-start gap-3 mt-8">
								<input
									type="checkbox"
									checked={isActive}
									onChange={(e) => setIsActive(e.target.checked)}
									className="checkbox checkbox-primary"
								/>
								<span className="label-text font-medium">Active</span>
							</label>
						</div>
					</div>

					<div className="border-t border-base-300 pt-4">
						<h4 className="font-semibold mb-2">Items in this combo</h4>

						<div className="relative mb-4">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="input input-bordered input-sm w-full pl-9"
								placeholder="Search regular items..."
							/>
							{searchQuery && (
								<div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto bg-base-100 border border-base-300 rounded-lg shadow-xl p-1">
									{filteredRegularItems.length > 0 ? (
										filteredRegularItems.map((item) => (
											<button
												key={item.id}
												className="flex items-center justify-between w-full p-2 hover:bg-base-200 rounded text-left transition-colors"
												onClick={() => handleAddMember(item)}>
												<div className="flex flex-col">
													<span className="text-sm font-medium">
														{item.name_burmese}
													</span>
													<span className="text-[10px] text-gray-500 uppercase">
														{item.category}
													</span>
												</div>
												<Plus className="w-4 h-4 text-primary" />
											</button>
										))
									) : (
										<div className="p-3 text-center text-xs text-gray-400">
											No items found
										</div>
									)}
								</div>
							)}
						</div>

						{/* Selected Members */}
						<div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-base-200 rounded-lg">
							{members.length > 0 ? (
								members.map((m) => (
									<div
										key={m.menu_item_id}
										className="badge badge-primary gap-1 py-3 px-3">
										{m.name_burmese}
										<button
											onClick={() => handleRemoveMember(m.menu_item_id)}
											className="hover:text-error transition-colors">
											<X className="w-3 h-3" />
										</button>
									</div>
								))
							) : (
								<span className="text-xs text-gray-400 italic flex items-center px-1">
									No items added yet
								</span>
							)}
						</div>

						{members.length > 0 && (
							<div className="mt-3 space-y-1">
								<p className="text-xs text-gray-400 italic">
									Includes: {members.map((m) => m.name_burmese).join(" + ")}
								</p>
								<p className="text-xs font-medium text-gray-500">
									Item total: ฿{totalItemsPrice.toFixed(2)} (Saving: ฿
									{(totalItemsPrice - parseFloat(price || 0)).toFixed(2)})
								</p>
							</div>
						)}
					</div>
				</div>

				<div className="modal-action">
					<button className="btn btn-ghost" onClick={onClose} disabled={saving}>
						Cancel
					</button>
					<button
						className="btn btn-primary min-w-[100px]"
						disabled={saving || !nameBurmese || !price || members.length === 0}
						onClick={handleSave}>
						{saving ? (
							<span className="loading loading-spinner loading-sm"></span>
						) : editingItem ? (
							"Update Combo"
						) : (
							"Create Combo"
						)}
					</button>
				</div>
			</div>
			<div className="modal-backdrop bg-black/50" onClick={onClose} />
		</div>
	);
};

const RotatingComboModal = ({ editingItem, onClose, onSave }) => {
	const [nameBurmese, setNameBurmese] = useState(
		editingItem?.name_burmese || ""
	);
	const [nameEnglish, setNameEnglish] = useState(
		editingItem?.name_english || ""
	);
	const [price, setPrice] = useState(editingItem?.price || "");
	const [isActive, setIsActive] = useState(editingItem?.is_active ?? true);
	const [slots, setSlots] = useState(editingItem?.combo_slots || []);
	const [saving, setSaving] = useState(false);

	const handleAddSlot = () => {
		setSlots([...slots, { category: "Chicken", label: "Chicken", optional: false }]);
	};

	const handleUpdateSlot = (index, updates) => {
		const newSlots = [...slots];
		// If category changes, update label too if it matches old category
		if (updates.category && newSlots[index].label === newSlots[index].category) {
			updates.label = updates.category;
		}
		newSlots[index] = { ...newSlots[index], ...updates };
		setSlots(newSlots);
	};

	const handleRemoveSlot = (index) => {
		setSlots(slots.filter((_, i) => i !== index));
	};

	const handleSave = async () => {
		setSaving(true);
		const payload = {
			name_burmese: nameBurmese.trim(),
			name_english: nameEnglish.trim() || "", // Don't send null to NOT NULL column
			price: parseFloat(price) || 0,
			category: "Combo",
			is_regular: false,
			is_active: isActive,
			is_combo: true,
			combo_type: "rotating",
			combo_members: null,
			combo_slots: slots,
			combo_note_summary: "",
			description: "",
			image_url: "",
			sensitive_ingredients: [],
			is_vegan: false,
			name_thai: "",
		};

		await onSave(payload);
		setSaving(false);
	};

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-lg">
				<div className="flex justify-between items-center mb-6">
					<h3 className="font-bold text-xl">
						{editingItem ? "Edit Rotating Combo" : "New Rotating Combo"}
					</h3>
					<button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Combo Name (Burmese) *</span>
							</label>
							<input
								type="text"
								value={nameBurmese}
								onChange={(e) => setNameBurmese(e.target.value)}
								className="input input-bordered"
								placeholder="Enter name"
							/>
						</div>
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Combo Name (English)</span>
							</label>
							<input
								type="text"
								value={nameEnglish}
								onChange={(e) => setNameEnglish(e.target.value)}
								className="input input-bordered"
								placeholder="Enter name"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Price (฿) *</span>
							</label>
							<input
								type="number"
								step="0.01"
								min="0"
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								className="input input-bordered"
								placeholder="0.00"
							/>
						</div>
						<div className="form-control">
							<label className="label cursor-pointer justify-start gap-3 mt-8">
								<input
									type="checkbox"
									checked={isActive}
									onChange={(e) => setIsActive(e.target.checked)}
									className="checkbox checkbox-primary"
								/>
								<span className="label-text font-medium">Active</span>
							</label>
						</div>
					</div>

					<div className="border-t border-base-300 pt-4">
						<div className="flex justify-between items-center mb-3">
							<h4 className="font-semibold">Category Slots</h4>
							<button
								className="btn btn-outline btn-xs"
								onClick={handleAddSlot}>
								<Plus className="w-3 h-3 mr-1" /> Add Slot
							</button>
						</div>

						{slots.length === 0 ? (
							<p className="text-sm text-gray-400 text-center py-6 bg-base-200 rounded-lg">
								Add at least one category slot
							</p>
						) : (
							<div className="space-y-2">
								{slots.map((slot, index) => (
									<div
										key={index}
										className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
										<select
											className="select select-bordered select-sm flex-1 text-xs"
											value={slot.category}
											onChange={(e) =>
												handleUpdateSlot(index, { category: e.target.value })
											}>
											{ALL_CATEGORIES.filter((c) => c !== "Combo").map((cat) => (
												<option key={cat} value={cat}>
													{cat}
												</option>
											))}
										</select>

										<input
											type="text"
											className="input input-bordered input-sm w-24 text-xs"
											placeholder="Label"
											value={slot.label}
											onChange={(e) =>
												handleUpdateSlot(index, { label: e.target.value })
											}
										/>

										<div className="flex items-center gap-1">
											<input
												type="checkbox"
												checked={slot.optional}
												onChange={(e) =>
													handleUpdateSlot(index, { optional: e.target.checked })
												}
												className="checkbox checkbox-xs"
											/>
											<span className="text-[10px] text-gray-500 uppercase">
												Opt
											</span>
										</div>

										<button
											className="btn btn-ghost btn-xs btn-square text-error"
											disabled={slots.length === 1}
											onClick={() => handleRemoveSlot(index)}>
											<X className="w-4 h-4" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="modal-action">
					<button className="btn btn-ghost" onClick={onClose} disabled={saving}>
						Cancel
					</button>
					<button
						className="btn btn-primary min-w-[100px]"
						disabled={saving || !nameBurmese || !price || slots.length === 0}
						onClick={handleSave}>
						{saving ? (
							<span className="loading loading-spinner loading-sm"></span>
						) : editingItem ? (
							"Update Combo"
						) : (
							"Create Combo"
						)}
					</button>
				</div>
			</div>
			<div className="modal-backdrop bg-black/50" onClick={onClose} />
		</div>
	);
};

export default ComboManager;
