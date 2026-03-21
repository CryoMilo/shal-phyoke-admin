import React, { useState, useMemo } from "react";
import { X, CheckCircle2, AlertTriangle, Package } from "lucide-react";

const ComboPickerModal = ({ combo, allMenuItems, todayItems = [], onConfirm, onClose }) => {
	// Step 1: Separate slots by type
	const specificSlots = useMemo(() => combo.slots.filter(s => s.type === "specific"), [combo.slots]);
	const categorySlots = useMemo(() => combo.slots.filter(s => s.type === "category"), [combo.slots]);

	// Step 4: Selections only track category slots
	// keyed by slot index within the original combo.slots array to keep logic simple
	const [selections, setSelections] = useState({});

	const handleSelectItem = (slotIndex, item) => {
		setSelections((prev) => ({
			...prev,
			[slotIndex]: item,
		}));
	};

	const handleSkipSlot = (slotIndex) => {
		setSelections((prev) => {
			const newSelections = { ...prev };
			delete newSelections[slotIndex];
			return newSelections;
		});
	};

	// Step 5: Check if all non-optional category slots are selected
	const isReady = useMemo(() => {
		return categorySlots.every((slot) => {
			const originalIndex = combo.slots.indexOf(slot);
			if (slot.optional) return true;
			return selections[originalIndex] !== undefined;
		});
	}, [categorySlots, selections, combo.slots]);

	// Step 6: Build name and confirm
	const handleConfirm = () => {
		const specificNames = specificSlots.map(s => s.menu_item_name);
		
		// Get selected items in order of original slots
		const selectedNames = combo.slots
			.map((slot, index) => {
				if (slot.type === "specific") return null;
				return selections[index]?.name_burmese;
			})
			.filter(Boolean);

		const allNames = [...specificNames, ...selectedNames];
		const builtName = `${combo.name_burmese} (${allNames.join(" + ")})`;

		onConfirm({
			id: combo.id,
			name_burmese: builtName,
			name_english: combo.name_english,
			price: combo.price,
			category: "Combo",
			available_extras: [],
			quantity: 1,
			is_combo: true,
			selections: [
				...specificSlots.map(s => ({ name_burmese: s.menu_item_name, id: s.menu_item_id })),
				...Object.values(selections)
			]
		});
	};

	return (
		<>
			<div className="modal-backdrop fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
			<div className="modal modal-open z-[70]">
				<div className="modal-box relative max-w-3xl w-full mx-2 md:mx-auto max-h-[90vh] overflow-y-auto p-0">
					{/* Header */}
					<div className="sticky top-0 bg-base-100 z-10 px-6 py-4 border-b border-base-200 flex justify-between items-center">
						<div>
							<h3 className="font-bold text-xl">{combo.name_burmese}</h3>
							<p className="text-sm text-gray-500">
								{categorySlots.length > 0 ? "Complete your selections" : "Confirm your combo"}
							</p>
						</div>
						<button className="btn btn-circle btn-ghost btn-sm" onClick={onClose}>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Content */}
					<div className="p-6 space-y-8">
						{/* Pre-resolved Specific Slots (Display Only) */}
						{specificSlots.length > 0 && (
							<div className="bg-base-200/50 p-4 rounded-xl border border-base-300">
								<h4 className="text-xs font-bold text-base-content/50 uppercase tracking-widest mb-3">Included Items</h4>
								<div className="flex flex-wrap gap-2">
									{specificSlots.map((slot, idx) => (
										<div key={idx} className="badge badge-primary py-3 px-3 gap-1.5">
											<Package className="w-3 h-3" />
											<span className="font-medium">{slot.menu_item_name}</span>
											<span className="text-[10px] opacity-70">({slot.label})</span>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Category Slots (Pickers) */}
						{categorySlots.map((slot, index) => {
							const originalIndex = combo.slots.indexOf(slot);
							
							// Step 3: Filter todayItems first, fallback to allMenuItems
							let slotOptions = todayItems.filter(
								(item) => item.category === slot.category && item.is_active !== false
							);
							
							const usingFallback = slotOptions.length === 0;
							if (usingFallback) {
								slotOptions = allMenuItems.filter(
									(item) => item.category === slot.category && item.is_active
								);
							}

							return (
								<div key={originalIndex} className="space-y-3">
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<h4 className="font-bold text-md flex items-center gap-2">
												<span className="bg-primary text-primary-content w-6 h-6 rounded-full flex items-center justify-center text-xs">
													{specificSlots.length + index + 1}
												</span>
												{slot.label || slot.category}
												{!slot.optional && <span className="text-error text-xs">*</span>}
											</h4>
											{usingFallback && slotOptions.length > 0 && (
												<div className="badge badge-warning badge-sm gap-1 animate-pulse">
													<AlertTriangle className="w-3 h-3" />
													<span className="text-[10px]">Not on today's menu</span>
												</div>
											)}
										</div>
										{slot.optional && (
											<button
												className={`btn btn-xs ${!selections[originalIndex] ? "btn-primary" : "btn-outline"}`}
												onClick={() => handleSkipSlot(originalIndex)}>
												Skip
											</button>
										)}
									</div>

									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
										{slotOptions.map((item) => {
											const isSelected = selections[originalIndex]?.id === item.id;
											return (
												<div
													key={item.id}
													className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
														isSelected
															? "border-primary bg-primary/5 shadow-sm"
															: "border-base-200 bg-base-100 hover:border-primary/50"
													}`}
													onClick={() => handleSelectItem(originalIndex, item)}>
													{isSelected && (
														<CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />
													)}
													<div className="text-sm font-semibold mb-1 line-clamp-2">
														{item.name_burmese}
													</div>
													<div className="text-[10px] text-gray-500 truncate">
														{item.name_english}
													</div>
												</div>
											);
										})}
										{slotOptions.length === 0 && (
											<div className="col-span-full py-6 text-center border-2 border-dashed border-base-300 rounded-xl bg-base-200/30">
												<AlertTriangle className="w-6 h-6 text-warning mx-auto mb-2 opacity-50" />
												<p className="text-sm text-base-content/50 italic">
													No items available in {slot.category}
												</p>
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>

					{/* Footer */}
					<div className="sticky bottom-0 bg-base-100 px-6 py-4 border-t border-base-200 flex justify-between items-center">
						<div className="text-lg font-bold">
							Total: <span className="text-primary">฿{combo.price}</span>
						</div>
						<div className="flex gap-2">
							<button className="btn btn-ghost" onClick={onClose}>
								Cancel
							</button>
							<button
								className="btn btn-primary px-8 shadow-lg shadow-primary/20"
								disabled={!isReady}
								onClick={handleConfirm}>
								Add to Order
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default ComboPickerModal;
