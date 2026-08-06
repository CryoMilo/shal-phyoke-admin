import React, { useState, useEffect } from "react";
import { X, Check, Utensils, AlertTriangle } from "lucide-react";
import { isAddonAvailable } from "../../utils/stockUtils";

const AddonSelectionModal = ({ isOpen, onClose, onConfirm, item }) => {
	const [selectedExtra, setSelectedExtra] = useState(null);

	const availableExtras = item?.available_extras || [];
	// if requires_addon is true, selecting an add-on is mandatory (no "Plain" option allowed)
	const allowNoAddon = !item?.requires_addon;

	useEffect(() => {
		if (isOpen) {
			// Pre-select first available in-stock extra if available
			const firstInStock = availableExtras.find((e) => isAddonAvailable(e));
			if (firstInStock) {
				setSelectedExtra(firstInStock);
			} else if (allowNoAddon) {
				setSelectedExtra("none");
			} else {
				setSelectedExtra(null);
			}
		}
	}, [isOpen, item]);

	if (!isOpen || !item) return null;

	const handleAdd = () => {
		if (!selectedExtra && !allowNoAddon) return;

		let note = "";
		let extraPrice = 0;

		if (selectedExtra && selectedExtra !== "none") {
			const toppingName =
				selectedExtra.name_burmese ||
				selectedExtra.name_english ||
				selectedExtra.extra_item?.name_burmese ||
				selectedExtra.extra_item?.name_english;
			note = toppingName;
			extraPrice = Number(selectedExtra.additional_price || 0);
		}

		onConfirm(note, extraPrice);
	};

	const canSubmit =
		selectedExtra === "none" ||
		(selectedExtra && isAddonAvailable(selectedExtra));

	return (
		<>
			{/* Backdrop */}
			<div
				className="modal-backdrop fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="modal modal-open z-50">
				<div className="modal-box p-0 relative max-w-lg w-full mx-2 bg-base-100 rounded-2xl shadow-2xl overflow-hidden border border-base-300">
					{/* Header */}
					<div className="p-5 bg-base-200/70 border-b border-base-300 flex justify-between items-center">
						<div className="flex items-center gap-3">
							<div className="p-2.5 rounded-xl bg-primary/10 text-primary">
								<Utensils className="w-5 h-5" />
							</div>
							<div>
								<h3 className="font-bold text-base md:text-lg leading-tight">
									Select Option
								</h3>
								<p className="text-xs text-base-content/70">
									{item.name_burmese}{" "}
									{item.name_english ? `(${item.name_english})` : ""}
								</p>
							</div>
						</div>
						<button
							className="btn btn-circle btn-ghost btn-sm"
							onClick={onClose}>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Options Body */}
					<div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
						<p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
							{allowNoAddon
								? "Choose an add-on or plain dish:"
								: "Select a mandatory add-on choice:"}
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{/* Optional "No Add-on" choice */}
							{allowNoAddon && (
								<div
									onClick={() => setSelectedExtra("none")}
									className={`relative flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
										selectedExtra === "none"
											? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
											: "border-base-300 bg-base-100 hover:border-base-400"
									}`}>
									<div className="w-12 h-12 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
										<Utensils className="w-5 h-5 opacity-40" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-sm">No Add-on (Plain)</p>
										<p className="text-xs text-base-content/60">
											Base Price Only
										</p>
									</div>
									{selectedExtra === "none" && (
										<div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
											<Check className="w-3.5 h-3.5" />
										</div>
									)}
								</div>
							)}

							{/* Linked Add-on Options */}
							{availableExtras.map((extra) => {
								const inStock = isAddonAvailable(extra);
								const isSelected = selectedExtra?.id === extra.id;
								const toppingName =
									extra.name_burmese ||
									extra.name_english ||
									extra.extra_item?.name_burmese ||
									extra.extra_item?.name_english;
								const imgUrl = extra.extra_item?.image_url;
								const stockQty = extra.extra_item?.stock_quantity;

								return (
									<div
										key={extra.id}
										onClick={() => inStock && setSelectedExtra(extra)}
										className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
											!inStock
												? "border-base-200 bg-base-200/40 opacity-50 cursor-not-allowed"
												: isSelected
												? "border-primary bg-primary/5 ring-1 ring-primary/20 cursor-pointer shadow-xs"
												: "border-base-300 bg-base-100 hover:border-base-400 cursor-pointer"
										}`}>
										{/* Add-on Card Image */}
										<div className="w-12 h-12 rounded-lg bg-base-200 flex items-center justify-center overflow-hidden shrink-0 border border-base-300">
											{imgUrl ? (
												<img
													src={imgUrl}
													alt={toppingName}
													className="w-full h-full object-cover"
												/>
											) : (
												<Utensils className="w-5 h-5 text-base-content/40" />
											)}
										</div>

										<div className="flex-1 min-w-0">
											<p className="font-semibold text-sm truncate">
												{toppingName}
											</p>
											<div className="flex items-center gap-1.5 mt-0.5">
												<span className="text-xs font-bold text-primary">
													+{extra.additional_price || 0}฿
												</span>
												{!inStock ? (
													<span className="badge badge-error badge-xs font-bold text-[9px]">
														Out of Stock
													</span>
												) : stockQty !== undefined && stockQty !== -1 ? (
													<span className="text-[10px] text-base-content/60">
														({stockQty} left)
													</span>
												) : null}
											</div>
										</div>

										{isSelected && (
											<div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
												<Check className="w-3.5 h-3.5" />
											</div>
										)}
									</div>
								);
							})}
						</div>

						{!allowNoAddon &&
							availableExtras.every((e) => !isAddonAvailable(e)) && (
								<div className="alert alert-error text-xs p-3 rounded-xl">
									<AlertTriangle className="w-4 h-4 shrink-0" />
									<span>All add-on choices are currently out of stock.</span>
								</div>
							)}
					</div>

					{/* Footer Actions */}
					<div className="p-4 bg-base-200/50 border-t border-base-300 flex justify-end gap-2">
						<button
							type="button"
							className="btn btn-ghost btn-sm"
							onClick={onClose}>
							Cancel
						</button>
						<button
							type="button"
							className="btn btn-primary btn-sm px-6"
							disabled={!canSubmit}
							onClick={handleAdd}>
							Add to Order
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default AddonSelectionModal;
