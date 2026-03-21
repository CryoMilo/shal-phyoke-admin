import React, { useState, useMemo } from "react";
import { X, Check } from "lucide-react";

const RotatingComboPickerModal = ({ combo, todayItems, onConfirm, onClose }) => {
	const [selections, setSelections] = useState({});

	// Filter slots that actually have items available today
	const activeSlots = useMemo(() => {
		return combo.slots
			.map((slot, index) => {
				const availableItems = todayItems.filter(
					(item) => item.category === slot.category
				);
				return { ...slot, index, availableItems };
			})
			.filter((slot) => slot.availableItems.length > 0);
	}, [combo.slots, todayItems]);

	const slotsWithItems = combo.slots.filter((slot) =>
		todayItems.some((item) => item.category === slot.category)
	);

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

	const isReady = useMemo(() => {
		return activeSlots.every((slot) => {
			if (slot.optional) return true;
			return selections[slot.index] !== undefined;
		});
	}, [activeSlots, selections]);

	const handleConfirm = () => {
		const selectedItems = activeSlots
			.map((slot) => selections[slot.index])
			.filter(Boolean);
		const noteString = selectedItems.map((item) => item.name_burmese).join(" + ");

		const cartItem = {
			id: combo.id,
			name_burmese: combo.name_burmese,
			name_english: combo.name_english,
			price: combo.price,
			category: "Combo",
			available_extras: [],
			quantity: 1,
		};

		onConfirm(cartItem, noteString);
	};

	return (
		<div className="modal modal-open z-50">
			<div className="modal-box relative max-w-lg p-0 overflow-hidden flex flex-col max-h-[90vh]">
				{/* Header */}
				<div className="p-4 border-b border-base-200 sticky top-0 bg-base-100 z-10">
					<div className="flex justify-between items-start">
						<div>
							<h3 className="font-bold text-xl flex items-center gap-2">
								{combo.name_burmese}
								<div className="badge badge-secondary">฿{combo.price}</div>
							</h3>
							{combo.name_english && (
								<p className="text-sm text-gray-500 mt-1">{combo.name_english}</p>
							)}
						</div>
						<button
							className="btn btn-sm btn-circle btn-ghost"
							onClick={onClose}>
							<X className="w-5 h-5" />
						</button>
					</div>
				</div>

				{/* Body */}
				<div className="p-4 space-y-8 overflow-y-auto flex-1">
					{slotsWithItems.length > 0 ? (
						activeSlots.map((slot) => (
							<div key={slot.index}>
								<div className="flex justify-between items-center mb-3">
									<h4 className="font-semibold text-base flex items-center gap-2">
										<span className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs">
											{slot.index + 1}
										</span>
										{slot.label}
										{!slot.optional && <span className="text-error text-xs">*</span>}
									</h4>
									{slot.optional && (
										<button
											className={`btn btn-xs ${!selections[slot.index] ? "btn-primary" : "btn-ghost"}`}
											onClick={() => handleSkipSlot(slot.index)}>
											{selections[slot.index] ? "Skip" : "Skipped"}
										</button>
									)}
								</div>
								<div className="grid grid-cols-2 gap-3">
									{slot.availableItems.map((item) => {
										const isSelected = selections[slot.index]?.id === item.id;
										return (
											<div
												key={item.id}
												className={`card card-compact border-2 cursor-pointer transition-all hover:shadow-md ${
													isSelected
														? "border-primary bg-primary/5"
														: "border-base-200 bg-base-100"
												}`}
												onClick={() => handleSelectItem(slot.index, item)}>
												{item.image_url && (
													<figure className="h-20 overflow-hidden">
														<img
															src={item.image_url}
															alt={item.name_burmese}
															className="w-full h-full object-cover"
														/>
													</figure>
												)}
												<div className="card-body p-2 relative">
													{isSelected && (
														<div className="absolute top-1 right-1 bg-primary text-primary-content rounded-full p-0.5">
															<Check className="w-3 h-3" />
														</div>
													)}
													<h5 className="font-medium text-sm line-clamp-2">
														{item.name_burmese}
													</h5>
													{item.name_english && (
														<p className="text-[10px] text-gray-500 truncate">
															{item.name_english}
														</p>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						))
					) : (
						<div className="text-center py-10 space-y-3 px-4">
							<p className="font-semibold text-base-content">
								No daily specials available for this combo
							</p>
							<p className="text-sm text-gray-500 max-w-xs mx-auto">
								This combo needs items from today's rotating menu. Make sure a
								weekly menu is published for today.
							</p>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 border-t border-base-200 bg-base-100 flex justify-end gap-2">
					<button className="btn btn-ghost" onClick={onClose}>
						Cancel
					</button>
					{slotsWithItems.length > 0 && (
						<button
							className="btn btn-primary"
							disabled={!isReady}
							onClick={handleConfirm}>
							Add to Order ฿{combo.price}
						</button>
					)}
				</div>
			</div>
			<div className="modal-backdrop bg-black/50" onClick={onClose} />
		</div>
	);
};

export default RotatingComboPickerModal;
