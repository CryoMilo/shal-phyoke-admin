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

	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState(null);

	useEffect(() => {
		if (allMenuItems.length === 0) {
			fetchAllMenuItems();
		}
	}, []);

	// Derived data
	const combos = useMemo(
		() => allMenuItems.filter((i) => i.is_combo && i.combo_type === "fixed"),
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
				description="Manage combo meals"
				buttons={[
					{
						label: "New Combo",
						onClick: () => {
							setEditingItem(null);
							setShowModal(true);
						},
						variant: "primary",
						icon: Plus,
					},
				]}
			/>

			{/* Combos Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{combos.length > 0 ? (
					combos.map((item) => (
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
						<p className="text-base-content/50 font-medium">No combos yet</p>
						<p className="text-xs text-gray-400 mt-1">
							Combos have specific items at a set price
						</p>
					</div>
				)}
			</div>

			{/* Modals */}
			{showModal && (
				<FixedComboModal
					editingItem={editingItem}
					regularMenuItems={regularMenuItems}
					onClose={() => {
						setShowModal(false);
						setEditingItem(null);
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
		return regularMenuItems.filter(
			(item) =>
				item.name_burmese.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(item.name_english &&
					item.name_english.toLowerCase().includes(searchQuery.toLowerCase()))
		);
	}, [regularMenuItems, searchQuery]);

	const totalItemsPrice = useMemo(() => {
		return members.reduce((sum, m) => {
			const item = regularMenuItems.find((i) => i.id === m.menu_item_id);
			return sum + (item?.price || 0);
		}, 0);
	}, [members, regularMenuItems]);

	const toggleMember = (item) => {
		if (members.find((m) => m.menu_item_id === item.id)) {
			setMembers(members.filter((m) => m.menu_item_id !== item.id));
		} else {
			setMembers([
				...members,
				{ menu_item_id: item.id, name_burmese: item.name_burmese },
			]);
		}
	};

	const handleSave = async () => {
		setSaving(true);
		const note_summary = members.map((m) => m.name_burmese).join(" + ");

		const payload = {
			name_burmese: nameBurmese.trim(),
			name_english: nameEnglish.trim() || "",
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
			<div className="modal-box max-w-3xl">
				<div className="flex justify-between items-center mb-6">
					<h3 className="font-bold text-xl">
						{editingItem ? "Edit Combo" : "New Combo"}
					</h3>
					<button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="space-y-6">
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
						<div className="flex justify-between items-end mb-4">
							<h4 className="font-semibold">Select Combo Items</h4>
							<div className="relative w-64">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="input input-bordered input-sm w-full pl-9"
									placeholder="Filter items..."
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1 bg-base-200 rounded-lg">
							{filteredRegularItems.map((item) => {
								const isSelected = members.some((m) => m.menu_item_id === item.id);
								return (
									<button
										key={item.id}
										onClick={() => toggleMember(item)}
										className={`p-3 rounded-lg border text-left transition-all ${
											isSelected
												? "bg-primary/10 border-primary ring-1 ring-primary"
												: "bg-base-100 border-base-300 hover:border-primary/50"
										}`}>
										<div className="flex justify-between items-start mb-1">
											<span className="text-xs font-bold truncate flex-1">
												{item.name_burmese}
											</span>
											{isSelected && (
												<Check className="w-3 h-3 text-primary shrink-0 ml-1" />
											)}
										</div>
										<div className="flex justify-between items-center">
											<span className="text-[10px] text-gray-500 uppercase">
												{item.category}
											</span>
											<span className="text-[10px] font-medium">฿{item.price}</span>
										</div>
									</button>
								);
							})}
						</div>

						{members.length > 0 && (
							<div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
								<p className="text-xs font-medium text-primary">
									Selected: {members.map((m) => m.name_burmese).join(", ")}
								</p>
								<p className="text-xs font-medium text-gray-500 mt-1">
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

export default ComboManager;
