import React, { useState, useEffect, useMemo } from "react";
import useComboStore from "../stores/comboStore";
import useMenuStore from "../stores/menuStore";
import { PageHeader } from "../components/common/PageHeader";
import { Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { ALL_CATEGORIES } from "../constants";
import { showToast } from "../utils/toastUtils";

const ComboManager = () => {
	const {
		regularCombos,
		rotatingTemplates,
		loading,
		fetchAllCombos,
		saveRegularCombo,
		deleteRegularCombo,
		toggleRegularCombo,
		saveRotatingTemplate,
		deleteRotatingTemplate,
		toggleRotatingTemplate,
	} = useComboStore();

	const { allMenuItems, fetchAllMenuItems } = useMenuStore();

	const [activeTab, setActiveTab] = useState("regular");
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [modalType, setModalType] = useState(null);

	// Form states
	const [nameBurmese, setNameBurmese] = useState("");
	const [nameEnglish, setNameEnglish] = useState("");
	const [price, setPrice] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [members, setMembers] = useState([]); // for regular
	const [slots, setSlots] = useState([]); // for rotating
	const [memberSearch, setMemberSearch] = useState("");

	useEffect(() => {
		fetchAllCombos();
		if (allMenuItems.length === 0) {
			fetchAllMenuItems();
		}
	}, []);

	// Pre-fill form when editingItem changes
	useEffect(() => {
		if (editingItem) {
			setNameBurmese(editingItem.name_burmese || "");
			setNameEnglish(editingItem.name_english || "");
			setPrice(editingItem.price || "");
			setIsActive(editingItem.is_active ?? true);
			if (modalType === "regular") {
				setMembers(editingItem.members || []);
			} else if (modalType === "rotating") {
				setSlots(editingItem.slots || []);
			}
		} else {
			setNameBurmese("");
			setNameEnglish("");
			setPrice("");
			setIsActive(true);
			setMembers([]);
			setSlots([]);
		}
		setMemberSearch("");
	}, [editingItem, modalType, showModal]);

	const regularItems = useMemo(() => {
		return allMenuItems.filter((item) => item.is_regular && item.is_active);
	}, [allMenuItems]);

	const filteredItemsForMemberSearch = useMemo(() => {
		if (!memberSearch.trim()) return [];
		return regularItems.filter((item) =>
			item.name_burmese.toLowerCase().includes(memberSearch.toLowerCase())
		);
	}, [regularItems, memberSearch]);

	const memberTotalRefPrice = useMemo(() => {
		return members.reduce((sum, member) => {
			const item = regularItems.find((i) => i.id === member.menu_item_id);
			return sum + (item ? Number(item.price) : 0);
		}, 0);
	}, [members, regularItems]);

	const openModal = (type, item = null) => {
		setModalType(type);
		setEditingItem(item);
		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
		setEditingItem(null);
		setModalType(null);
	};

	const handleToggleStatus = async (id, type) => {
		let result;
		if (type === "regular") {
			result = await toggleRegularCombo(id);
		} else {
			result = await toggleRotatingTemplate(id);
		}
		if (result && result.error) {
			showToast.error(result.error);
		}
	};

	const handleDelete = async (id, type) => {
		if (!window.confirm("Are you sure you want to delete this?")) return;
		let result;
		if (type === "regular") {
			result = await deleteRegularCombo(id);
		} else {
			result = await deleteRotatingTemplate(id);
		}
		if (result && result.success) {
			showToast.success("Deleted successfully");
		} else if (result && result.error) {
			showToast.error(result.error);
		}
	};

	const addMember = (item) => {
		if (members.find((m) => m.menu_item_id === item.id)) {
			showToast.error("Item already added");
			return;
		}
		setMembers([...members, { menu_item_id: item.id, name_burmese: item.name_burmese }]);
		setMemberSearch("");
	};

	const removeMember = (id) => {
		setMembers(members.filter((m) => m.menu_item_id !== id));
	};

	const addSlot = () => {
		setSlots([...slots, { category: ALL_CATEGORIES[0], label: ALL_CATEGORIES[0], optional: false }]);
	};

	const updateSlot = (index, field, value) => {
		const newSlots = [...slots];
		const oldCategory = newSlots[index].category;
		newSlots[index][field] = value;
		
		// Auto-fill label if it's empty or matches the old category
		if (field === "category" && (!newSlots[index].label || newSlots[index].label === oldCategory)) {
			newSlots[index].label = value;
		}
		
		setSlots(newSlots);
	};

	const removeSlot = (index) => {
		setSlots(slots.filter((_, i) => i !== index));
	};

	const handleSave = async (e) => {
		e.preventDefault();
		if (!nameBurmese || !price || price <= 0) {
			showToast.error("Please fill in name and valid price");
			return;
		}

		let result;
		if (modalType === "regular") {
			if (members.length === 0) {
				showToast.error("Please add at least one member item");
				return;
			}
			const note_summary = members.map((m) => m.name_burmese).join(" + ");
			result = await saveRegularCombo(
				{
					name_burmese: nameBurmese,
					name_english: nameEnglish,
					price: parseFloat(price),
					is_active: isActive,
					members,
					note_summary,
				},
				editingItem?.id
			);
		} else {
			if (slots.length === 0) {
				showToast.error("Please add at least one slot");
				return;
			}
			if (slots.some((s) => !s.category || !s.label)) {
				showToast.error("Please fill in all slot categories and labels");
				return;
			}
			result = await saveRotatingTemplate(
				{
					name_burmese: nameBurmese,
					name_english: nameEnglish,
					price: parseFloat(price),
					is_active: isActive,
					slots,
				},
				editingItem?.id
			);
		}

		if (result && result.success) {
			showToast.success("Saved successfully");
			closeModal();
		} else if (result && result.error) {
			showToast.error(result.error);
		}
	};

	if (loading && regularCombos.length === 0 && rotatingTemplates.length === 0) {
		return (
			<div className="flex justify-center items-center h-screen">
				<span className="loading loading-spinner loading-lg"></span>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4 max-w-7xl">
			<PageHeader
				title="Combo Manager"
				description="Manage regular and rotating combo meals"
				buttons={[
					{
						label: "New Regular Combo",
						icon: Plus,
						onClick: () => openModal("regular"),
						variant: "primary",
					},
					{
						label: "New Rotating Combo",
						icon: Plus,
						onClick: () => openModal("rotating"),
						variant: "secondary",
					},
				]}
			/>

			<div className="tabs tabs-boxed w-fit mb-6 mt-4">
				<a
					className={`tab ${activeTab === "regular" ? "tab-active" : ""}`}
					onClick={() => setActiveTab("regular")}>
					Regular Combos
				</a>
				<a
					className={`tab ${activeTab === "rotating" ? "tab-active" : ""}`}
					onClick={() => setActiveTab("rotating")}>
					Rotating Combos
				</a>
			</div>

			{activeTab === "regular" && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{regularCombos.map((combo) => (
						<div key={combo.id} className="card bg-base-100 shadow-md border border-base-200">
							<div className="card-body p-5">
								<div className="flex justify-between items-start">
									<div>
										<h2 className="card-title text-lg">{combo.name_burmese}</h2>
										{combo.name_english && (
											<p className="text-sm text-gray-500">{combo.name_english}</p>
										)}
									</div>
									<div className="badge badge-primary font-bold">฿{combo.price}</div>
								</div>
								<div className="mt-2">
									<p className="text-xs text-gray-500 mb-1">Includes:</p>
									<p className="text-xs bg-base-200 p-2 rounded">{combo.note_summary}</p>
								</div>
								<div className="card-actions justify-between items-center mt-4">
									<button
										className="btn btn-ghost btn-circle btn-sm"
										onClick={() => handleToggleStatus(combo.id, "regular")}>
										{combo.is_active ? (
											<ToggleRight className="text-success w-6 h-6" />
										) : (
											<ToggleLeft className="text-gray-400 w-6 h-6" />
										)}
									</button>
									<div className="flex gap-1">
										<button
											className="btn btn-ghost btn-xs"
											onClick={() => openModal("regular", combo)}>
											<Edit2 className="w-4 h-4" />
										</button>
										<button
											className="btn btn-ghost btn-xs text-error"
											onClick={() => handleDelete(combo.id, "regular")}>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						</div>
					))}
					{regularCombos.length === 0 && (
						<div className="col-span-full text-center py-12">
							<p className="text-lg font-medium">No regular combos yet</p>
							<p className="text-gray-500">Create combos with fixed regular menu items</p>
						</div>
					)}
				</div>
			)}

			{activeTab === "rotating" && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{rotatingTemplates.map((template) => (
						<div key={template.id} className="card bg-base-100 shadow-md border border-base-200">
							<div className="card-body p-5">
								<div className="flex justify-between items-start">
									<div>
										<h2 className="card-title text-lg">{template.name_burmese}</h2>
										{template.name_english && (
											<p className="text-sm text-gray-500">{template.name_english}</p>
										)}
									</div>
									<div className="badge badge-secondary font-bold">฿{template.price}</div>
								</div>
								<div className="flex flex-wrap gap-1 mt-3">
									{template.slots.map((slot, i) => (
										<span key={i} className="badge badge-outline text-[10px] py-2">
											{slot.label}: {slot.category}
										</span>
									))}
								</div>
								<div className="card-actions justify-between items-center mt-4 pt-2 border-t border-base-100">
									<button
										className="btn btn-ghost btn-circle btn-sm"
										onClick={() => handleToggleStatus(template.id, "rotating")}>
										{template.is_active ? (
											<ToggleRight className="text-success w-6 h-6" />
										) : (
											<ToggleLeft className="text-gray-400 w-6 h-6" />
										)}
									</button>
									<div className="flex gap-1">
										<button
											className="btn btn-ghost btn-xs"
											onClick={() => openModal("rotating", template)}>
											<Edit2 className="w-4 h-4" />
										</button>
										<button
											className="btn btn-ghost btn-xs text-error"
											onClick={() => handleDelete(template.id, "rotating")}>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						</div>
					))}
					{rotatingTemplates.length === 0 && (
						<div className="col-span-full text-center py-12">
							<p className="text-lg font-medium">No rotating combo templates yet</p>
							<p className="text-gray-500">Create category-based templates for daily special combos</p>
						</div>
					)}
				</div>
			)}

			{/* Shared Modal */}
			{showModal && (
				<div className="modal modal-open">
					<div className={`modal-box relative ${modalType === "regular" ? "max-w-2xl" : "max-w-lg"}`}>
						<button
							className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
							onClick={closeModal}>
							<X className="w-5 h-5" />
						</button>
						<h3 className="font-bold text-lg mb-4">
							{editingItem ? "Edit " : "New "}
							{modalType === "regular" ? "Regular Combo" : "Rotating Combo"}
						</h3>

						<form onSubmit={handleSave} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-medium text-xs">Combo Name (Burmese) *</span>
									</label>
									<input
										type="text"
										className="input input-bordered input-sm w-full"
										value={nameBurmese}
										onChange={(e) => setNameBurmese(e.target.value)}
										required
									/>
								</div>
								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-medium text-xs">Combo Name (English)</span>
									</label>
									<input
										type="text"
										className="input input-bordered input-sm w-full"
										value={nameEnglish}
										onChange={(e) => setNameEnglish(e.target.value)}
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-medium text-xs">Combo Price (฿) *</span>
									</label>
									<input
										type="number"
										step="0.01"
										className="input input-bordered input-sm w-full"
										value={price}
										onChange={(e) => setPrice(e.target.value)}
										required
									/>
								</div>
								<div className="form-control">
									<label className="label cursor-pointer justify-start gap-4 mt-6">
										<input
											type="checkbox"
											className="checkbox checkbox-primary checkbox-sm"
											checked={isActive}
											onChange={(e) => setIsActive(e.target.checked)}
										/>
										<span className="label-text">Active</span>
									</label>
								</div>
							</div>

							{modalType === "regular" && (
								<div className="border-t pt-4 mt-4">
									<label className="label py-1">
										<span className="label-text font-bold text-sm">Items in this combo</span>
									</label>
									
									<div className="relative mb-2">
										<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
										<input
											type="text"
											placeholder="Search regular items..."
											className="input input-bordered input-sm w-full pl-9"
											value={memberSearch}
											onChange={(e) => setMemberSearch(e.target.value)}
										/>
									</div>

									{memberSearch && (
										<div className="bg-base-200 rounded-lg max-h-48 overflow-y-auto mb-4 border border-base-300">
											{filteredItemsForMemberSearch.length > 0 ? (
												filteredItemsForMemberSearch.map((item) => (
													<div key={item.id} className="flex justify-between items-center p-2 hover:bg-base-300 border-b border-base-100 last:border-0">
														<div>
															<span className="text-sm font-medium">{item.name_burmese}</span>
															<span className="badge badge-ghost badge-xs ml-2">{item.category}</span>
														</div>
														<button
															type="button"
															className="btn btn-primary btn-xs"
															onClick={() => addMember(item)}>
															Add
														</button>
													</div>
												))
											) : (
												<p className="p-4 text-center text-xs text-gray-500">No items found</p>
											)}
										</div>
									)}

									<div className="flex flex-wrap gap-2 mb-4">
										{members.map((member) => (
											<div key={member.menu_item_id} className="badge badge-primary gap-1 py-3">
												<span className="text-xs">{member.name_burmese}</span>
												<button
													type="button"
													onClick={() => removeMember(member.menu_item_id)}>
													<X className="w-3 h-3" />
												</button>
											</div>
										))}
									</div>

									{members.length > 0 && (
										<div className="p-2 bg-base-200 rounded text-[10px] space-y-1">
											<p className="text-gray-500">
												Includes: {members.map((m) => m.name_burmese).join(" + ")}
											</p>
											<p className="text-gray-400">
												Item total: ฿{memberTotalRefPrice.toFixed(2)}
											</p>
										</div>
									)}
								</div>
							)}

							{modalType === "rotating" && (
								<div className="border-t pt-4 mt-4">
									<div className="flex justify-between items-center mb-2">
										<label className="label py-1">
											<span className="label-text font-bold text-sm">Category Slots</span>
										</label>
										<button
											type="button"
											className="btn btn-outline btn-sm btn-primary"
											onClick={addSlot}>
											<Plus className="w-4 h-4 mr-1" />
											Add Slot
										</button>
									</div>

									<div className="space-y-4 max-h-64 overflow-y-auto pr-2">
										{slots.map((slot, index) => (
											<div key={index} className="bg-base-200 p-3 rounded-lg relative space-y-2">
												<button
													type="button"
													className="btn btn-ghost btn-xs text-error absolute top-1 right-1"
													onClick={() => removeSlot(index)}>
													<X className="w-4 h-4" />
												</button>
												<div className="grid grid-cols-2 gap-2">
													<div className="form-control">
														<label className="label py-0">
															<span className="label-text text-[10px]">Category</span>
														</label>
														<select
															className="select select-bordered select-sm w-full"
															value={slot.category}
															onChange={(e) => updateSlot(index, "category", e.target.value)}>
															{ALL_CATEGORIES.map((cat) => (
																<option key={cat} value={cat}>
																	{cat}
																</option>
															))}
														</select>
													</div>
													<div className="form-control">
														<label className="label py-0">
															<span className="label-text text-[10px]">Label</span>
														</label>
														<input
															type="text"
															className="input input-bordered input-sm w-full"
															placeholder="e.g. Main, Rice, Side"
															value={slot.label}
															onChange={(e) => updateSlot(index, "label", e.target.value)}
														/>
													</div>
												</div>
												<div className="form-control flex flex-row items-center gap-2 mt-1 px-1">
													<input
														type="checkbox"
														className="checkbox checkbox-xs"
														checked={slot.optional}
														onChange={(e) => updateSlot(index, "optional", e.target.checked)}
													/>
													<span className="label-text text-[10px]">Optional</span>
												</div>
											</div>
										))}
										{slots.length === 0 && (
											<p className="text-center py-4 text-xs text-gray-500 bg-base-200 rounded-lg">
												No slots added. Minimum 1 required.
											</p>
										)}
									</div>
								</div>
							)}

							<div className="modal-action">
								<button type="button" className="btn btn-ghost" onClick={closeModal}>
									Cancel
								</button>
								<button type="submit" className="btn btn-primary" disabled={loading}>
									{loading && <span className="loading loading-spinner"></span>}
									Save Combo
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default ComboManager;
