import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, Search } from "lucide-react";
import { ALL_CATEGORIES } from "../../constants";
import useComboStore from "../../stores/comboStore";
import useMenuStore from "../../stores/menuStore";

const ComboTemplateModal = ({
	showModal,
	setShowModal,
	editingTemplate = null,
	onSuccess = () => {},
}) => {
	const { saveTemplate, loading } = useComboStore();
	const { allMenuItems } = useMenuStore();
	
	const regularItems = useMemo(() => 
		allMenuItems.filter(item => item.is_regular && item.is_active),
	[allMenuItems]);

	const [formData, setFormData] = useState({
		name_burmese: "",
		name_english: "",
		price: "",
		is_active: true,
		slots: [],
	});

	const [itemSearch, setItemSearch] = useState({}); // { slotIndex: query }

	useEffect(() => {
		if (editingTemplate) {
			setFormData({
				name_burmese: editingTemplate.name_burmese || "",
				name_english: editingTemplate.name_english || "",
				price: editingTemplate.price || "",
				is_active: editingTemplate.is_active ?? true,
				slots: editingTemplate.slots || [],
			});
		} else {
			setFormData({
				name_burmese: "",
				name_english: "",
				price: "",
				is_active: true,
				slots: [],
			});
		}
	}, [editingTemplate, showModal]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const addSlot = () => {
		setFormData((prev) => ({
			...prev,
			slots: [...prev.slots, { type: "category", category: ALL_CATEGORIES[0], label: "", optional: false }],
		}));
	};

	const updateSlot = (index, field, value) => {
		setFormData((prev) => {
			const newSlots = [...prev.slots];
			let updatedSlot = { ...newSlots[index], [field]: value };
			
			// Auto-fill label if item is selected and label is empty
			if (field === "menu_item_id" && value) {
				const selectedItem = regularItems.find(item => item.id === value);
				if (selectedItem) {
					updatedSlot.menu_item_name = selectedItem.name_burmese;
					if (!updatedSlot.label) {
						updatedSlot.label = selectedItem.category;
					}
				}
			}

			// Reset fields when type changes
			if (field === "type") {
				if (value === "category") {
					updatedSlot = { type: "category", category: ALL_CATEGORIES[0], label: updatedSlot.label, optional: updatedSlot.optional };
				} else {
					updatedSlot = { type: "specific", menu_item_id: "", menu_item_name: "", label: updatedSlot.label, optional: updatedSlot.optional };
				}
			}

			newSlots[index] = updatedSlot;
			return { ...prev, slots: newSlots };
		});
	};

	const removeSlot = (index) => {
		setFormData((prev) => ({
			...prev,
			slots: prev.slots.filter((_, i) => i !== index),
		}));
	};

	const specificItemsTotal = useMemo(() => {
		return formData.slots
			.filter(s => s.type === "specific" && s.menu_item_id)
			.reduce((sum, slot) => {
				const item = regularItems.find(i => i.id === slot.menu_item_id);
				return sum + (item ? Number(item.price) : 0);
			}, 0);
	}, [formData.slots, regularItems]);

	const categorySlotsCount = useMemo(() => {
		return formData.slots.filter(s => s.type === "category").length;
	}, [formData.slots]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.name_burmese || !formData.price) return;

		const result = await saveTemplate(
			{
				...formData,
				price: parseFloat(formData.price),
			},
			editingTemplate?.id
		);

		if (result.success) {
			onSuccess();
			setShowModal(false);
		}
	};

	if (!showModal) return null;

	return (
		<>
			<div
				className="modal-backdrop fixed inset-0 bg-black/50 z-[60]"
				onClick={() => !loading && setShowModal(false)}
			/>
			<div className="modal modal-open z-[70]">
				<div className="modal-box relative max-w-2xl w-full mx-2 md:mx-auto max-h-[90vh] overflow-y-auto">
					<div className="flex justify-between items-center mb-6 border-b pb-4">
						<h3 className="font-bold text-lg md:text-xl">
							{editingTemplate ? "Edit Combo Template" : "New Combo Template"}
						</h3>
						<button
							className="btn btn-circle btn-ghost btn-sm"
							onClick={() => setShowModal(false)}
							disabled={loading}>
							<X className="w-5 h-5" />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="form-control">
								<label className="label">
									<span className="label-text font-medium">Name (Burmese) *</span>
								</label>
								<input
									type="text"
									name="name_burmese"
									className="input input-bordered w-full"
									value={formData.name_burmese}
									onChange={handleChange}
									required
								/>
							</div>
							<div className="form-control">
								<label className="label">
									<span className="label-text font-medium">Name (English)</span>
								</label>
								<input
									type="text"
									name="name_english"
									className="input input-bordered w-full"
									value={formData.name_english}
									onChange={handleChange}
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
									name="price"
									className="input input-bordered w-full"
									value={formData.price}
									onChange={handleChange}
									required
								/>
							</div>
							<div className="form-control flex flex-row items-center gap-2 mt-8">
								<input
									type="checkbox"
									name="is_active"
									className="checkbox checkbox-primary"
									checked={formData.is_active}
									onChange={handleChange}
								/>
								<span className="label-text font-medium cursor-pointer" onClick={() => handleChange({ target: { name: 'is_active', type: 'checkbox', checked: !formData.is_active }})}>
									Active
								</span>
							</div>
						</div>

						<div className="pt-4 border-t">
							<div className="flex justify-between items-center mb-4">
								<h4 className="font-bold text-md">Selection Slots</h4>
								<button
									type="button"
									className="btn btn-sm btn-outline btn-primary"
									onClick={addSlot}>
									<Plus className="w-4 h-4 mr-1" />
									Add Slot
								</button>
							</div>

							<div className="space-y-4">
								{formData.slots.map((slot, index) => (
									<div key={index} className="p-3 bg-base-200 rounded-lg space-y-3">
										<div className="flex justify-between items-center">
											<div className="join join-horizontal bg-base-100 p-0.5 rounded-lg border">
												<button
													type="button"
													className={`join-item btn btn-xs ${slot.type === "category" ? "btn-primary" : "btn-ghost"}`}
													onClick={() => updateSlot(index, "type", "category")}>
													By Category
												</button>
												<button
													type="button"
													className={`join-item btn btn-xs ${slot.type === "specific" ? "btn-primary" : "btn-ghost"}`}
													onClick={() => updateSlot(index, "type", "specific")}>
													Specific Item
												</button>
											</div>
											<button
												type="button"
												className="btn btn-square btn-ghost btn-sm text-error"
												onClick={() => removeSlot(index)}>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>

										<div className="flex flex-wrap items-end gap-3">
											{slot.type === "category" ? (
												<div className="form-control flex-1 min-w-[150px]">
													<label className="label py-1">
														<span className="label-text text-xs">Category</span>
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
											) : (
												<div className="form-control flex-1 min-w-[200px]">
													<label className="label py-1">
														<span className="label-text text-xs">Specific Item</span>
													</label>
													<div className="relative">
														<select
															className="select select-bordered select-sm w-full pl-8"
															value={slot.menu_item_id}
															onChange={(e) => updateSlot(index, "menu_item_id", e.target.value)}>
															<option value="">Select an item...</option>
															{regularItems.map((item) => (
																<option key={item.id} value={item.id}>
																	{item.name_burmese} — {item.category}
																</option>
															))}
														</select>
														<Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
													</div>
												</div>
											)}
											
											<div className="form-control flex-[0.8] min-w-[120px]">
												<label className="label py-1">
													<span className="label-text text-xs">Slot Label</span>
												</label>
												<input
													type="text"
													className="input input-bordered input-sm w-full"
													value={slot.label}
													onChange={(e) => updateSlot(index, "label", e.target.value)}
													placeholder="e.g. Rice, Main"
												/>
											</div>

											<div className="form-control mb-1">
												<label className="label cursor-pointer flex gap-2">
													<input
														type="checkbox"
														className="checkbox checkbox-xs"
														checked={slot.optional}
														onChange={(e) => updateSlot(index, "optional", e.target.checked)}
													/>
													<span className="label-text text-xs">Optional</span>
												</label>
											</div>
										</div>
									</div>
								))}
								
								{formData.slots.length > 0 && (
									<div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 space-y-1">
										<p className="text-sm font-medium">Reference pricing:</p>
										<div className="flex justify-between text-xs">
											<span className="text-base-content/70">Specific items total:</span>
											<span className="font-bold">฿{specificItemsTotal}</span>
										</div>
										<div className="flex justify-between text-xs">
											<span className="text-base-content/70">Category slots:</span>
											<span className="font-bold">{categorySlotsCount} open slots</span>
										</div>
									</div>
								)}

								{formData.slots.length === 0 && (
									<p className="text-center py-4 text-gray-500 text-sm border-2 border-dashed rounded-lg">
										No slots added yet. Add at least one slot for this combo.
									</p>
								)}
							</div>
						</div>

						<div className="modal-action">
							<button
								type="button"
								className="btn"
								onClick={() => setShowModal(false)}
								disabled={loading}>
								Cancel
							</button>
							<button
								type="submit"
								className="btn btn-primary"
								disabled={loading || !formData.name_burmese || !formData.price || formData.slots.length === 0}>
								{loading ? <span className="loading loading-spinner"></span> : null}
								{editingTemplate ? "Update Template" : "Save Template"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	);
};

export default ComboTemplateModal;
