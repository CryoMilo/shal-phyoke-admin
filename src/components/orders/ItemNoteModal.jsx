import React, { useState, useEffect, useMemo } from "react";
import { Package } from "lucide-react";
import useQuickNoteStore from "../../stores/quickNoteStore";

const ItemNoteModal = ({ show, onClose, onSave, item }) => {
	const { getNotesByIds, fetchActiveNotes } = useQuickNoteStore();

	const [customNote, setCustomNote] = useState("");
	const [selectedCommonNotes, setSelectedCommonNotes] = useState([]);
	const [isTakeaway, setIsTakeaway] = useState(false);
	const [selectedToppings, setSelectedToppings] = useState([]);
	const [tasteProfiles, setTasteProfiles] = useState({});

	const isBurmese = (text) => /[\u1000-\u109F]/.test(text || "");

	const formatTasteNote = (label, level) => {
		if (!label || !level) return "";
		return isBurmese(label) || isBurmese(level)
			? `${label} ${level}`
			: `${level} ${label}`;
	};

	useEffect(() => {
		fetchActiveNotes();
	}, [fetchActiveNotes]);

	const applicableSettings = useMemo(() => {
		if (!item || !item.quick_note_ids) return [];
		return getNotesByIds(item.quick_note_ids);
	}, [item?.quick_note_ids, getNotesByIds]);

	const tasteCategories = useMemo(
		() => applicableSettings.filter((s) => s.type === "radio"),
		[applicableSettings]
	);

	const frequentNotes = useMemo(
		() => applicableSettings.filter((s) => s.type === "multiple"),
		[applicableSettings]
	);

	const availableExtras = useMemo(() => item?.available_extras || [], [item]);

	// Parse existing notes when modal opens
	useEffect(() => {
		if (show && item) {
			const currentNote = item.note || "";
			const parts = currentNote
				.split(", ")
				.map((p) => p.trim())
				.filter((p) => p !== "");

			setIsTakeaway(parts.includes("Takeaway"));

			const common = [];
			const toppings = [];
			const tastes = {};

			tasteCategories.forEach((cat) => {
				tastes[cat.id] = null;
			});

			const custom = [];

			parts.forEach((part) => {
				if (part === "Takeaway") return;

				// 1. Parse Taste Profiles
				let matchedTaste = false;
				tasteCategories.forEach((cat) => {
					const levels = cat.options || [];
					levels.forEach((level) => {
						if (part === `${level} ${cat.label}` || part === `${cat.label} ${level}`) {
							tastes[cat.id] = level;
							matchedTaste = true;
						}
					});
				});
				if (matchedTaste) return;

				// 2. Parse Toppings
				const matchingExtra = availableExtras.find(
					(extra) => extra.name_burmese === part || extra.name_english === part
				);
				if (matchingExtra) {
					toppings.push(part);
					return;
				}

				// 3. Parse Frequent Notes
				let matchedFreq = false;
				frequentNotes.forEach((note) => {
					if (note.options?.includes(part)) {
						common.push(part);
						matchedFreq = true;
					}
				});

				if (!matchedFreq) {
					custom.push(part);
				}
			});

			setSelectedCommonNotes(common);
			setSelectedToppings(toppings);
			setTasteProfiles(tastes);
			setCustomNote(custom.join(", "));
		}
	}, [show, item, frequentNotes, tasteCategories, availableExtras]);

	const toggleCommonNote = (noteOption) => {
		setSelectedCommonNotes((prev) =>
			prev.includes(noteOption)
				? prev.filter((n) => n !== noteOption)
				: [...prev, noteOption]
		);
	};

	const toggleTopping = (toppingName) => {
		setSelectedToppings((prev) =>
			prev.includes(toppingName)
				? prev.filter((t) => t !== toppingName)
				: [...prev, toppingName]
		);
	};

	const handleClearAll = () => {
		setSelectedToppings([]);
		setSelectedCommonNotes([]);
		setCustomNote("");
		setIsTakeaway(false);
		setTasteProfiles(
			Object.fromEntries(tasteCategories.map((cat) => [cat.id, null]))
		);
	};

	const handleSave = () => {
		const combinedNotes = [];
		let totalExtraPrice = 0;

		if (isTakeaway) combinedNotes.push("Takeaway");

		tasteCategories.forEach((cat) => {
			const currentLevel = tasteProfiles[cat.id];
			if (currentLevel) {
				combinedNotes.push(formatTasteNote(cat.label, currentLevel));
			}
		});

		selectedToppings.forEach((t) => {
			combinedNotes.push(t);
			const extra = availableExtras.find(
				(e) => e.name_burmese === t || e.name_english === t
			);
			if (extra) {
				totalExtraPrice += Number(extra.additional_price || 0);
			}
		});

		selectedCommonNotes.forEach((n) => {
			combinedNotes.push(n);
		});

		if (customNote.trim()) {
			combinedNotes.push(customNote.trim());
		}

		onSave(combinedNotes.join(", "), totalExtraPrice);
	};

	const hasChanges =
		selectedToppings.length > 0 ||
		selectedCommonNotes.length > 0 ||
		customNote.trim() !== "" ||
		isTakeaway ||
		Object.values(tasteProfiles).some((val) => val !== null);

	if (!show) return null;

	const isCombo = item?.category === "Combo";
	const hasNoQuickNotes = applicableSettings.length === 0;
	const hasNoExtras = availableExtras.length === 0;

	return (
		<div className="modal modal-open z-50">
			<div className="modal-box max-w-2xl relative">
				<button
					type="button"
					className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
					onClick={onClose}>
					✕
				</button>

				<div className="flex justify-between items-start mb-4 pr-8">
					<div>
						<h3 className="font-bold text-xl">
							{item?.name_burmese || "Notes"}
						</h3>
						{item?.name_english && (
							<p className="text-sm text-base-content/60 mt-0.5">
								{item.name_english}
							</p>
						)}
					</div>
					<button
						type="button"
						className={`btn btn-sm gap-2 ${
							isTakeaway ? "btn-primary" : "btn-outline border-base-300"
						}`}
						onClick={() => setIsTakeaway(!isTakeaway)}>
						<Package className="w-4 h-4" />
						Takeaway
					</button>
				</div>

				<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
					{isCombo && hasNoQuickNotes && hasNoExtras ? (
						<div className="text-center text-sm text-base-content/60 py-4">
							Add any special instructions below
						</div>
					) : (
						<>
							{availableExtras.length > 0 && (
								<div>
									<label className="label py-1">
										<span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/60">
											Toppings / Sides
										</span>
									</label>
									<div className="flex flex-wrap gap-2">
										{availableExtras.map((extra) => {
											const toppingName =
												extra.name_burmese || extra.name_english;
											if (!toppingName) return null;
											const isSelected =
												selectedToppings.includes(toppingName);
											return (
												<button
													type="button"
													key={extra.id}
													onClick={() => toggleTopping(toppingName)}
													className={`btn btn-sm ${
														isSelected
															? "btn-primary"
															: "btn-outline border-base-300"
													}`}>
													{toppingName}
													{extra.additional_price > 0 && (
														<span className="ml-1 text-xs opacity-75">
															+{extra.additional_price}฿
														</span>
													)}
												</button>
											);
										})}
									</div>
								</div>
							)}

							{tasteCategories.length > 0 && (
								<div>
									<label className="label py-1">
										<span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/60">
											Taste Profile
										</span>
									</label>
									<div className="space-y-3">
										{tasteCategories.map((cat) => (
											<div
												key={cat.id}
												className="flex items-center gap-3">
												<span className="w-24 text-sm font-semibold text-base-content/80">
													{cat.label}
												</span>
												<div className="join flex-1">
													{(cat.options || []).map((level) => (
														<button
															type="button"
															key={level}
															onClick={() =>
																setTasteProfiles((prev) => ({
																	...prev,
																	[cat.id]:
																		prev[cat.id] === level ? null : level,
																}))
															}
															className={`join-item btn btn-sm flex-1 ${
																tasteProfiles[cat.id] === level
																	? "btn-primary"
																	: "btn-outline border-base-300"
															}`}>
															{level}
														</button>
													))}
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{frequentNotes.length > 0 && (
								<div className="space-y-3">
									{frequentNotes.map((note) => (
										<div key={note.id}>
											<label className="label py-1">
												<span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/60">
													{note.label}
												</span>
											</label>
											<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
												{note.options?.map((option) => {
													const isSelected =
														selectedCommonNotes.includes(option);
													return (
														<button
															type="button"
															key={option}
															className={`btn btn-sm h-auto py-2.5 ${
																isSelected
																	? "btn-primary"
																	: "btn-outline border-base-300"
															}`}
															onClick={() => toggleCommonNote(option)}>
															<span className="text-xs font-semibold text-center">
																{option}
															</span>
														</button>
													);
												})}
											</div>
										</div>
									))}
								</div>
							)}
						</>
					)}

					{/* Custom Request Input */}
					<div className="form-control pt-2">
						<label className="label py-1">
							<span className="label-text font-bold text-xs uppercase tracking-widest text-base-content/60">
								Custom Request (Optional)
							</span>
						</label>
						<input
							type="text"
							placeholder="Type specific instructions here..."
							className="input input-bordered w-full"
							value={customNote}
							onChange={(e) => setCustomNote(e.target.value)}
						/>
					</div>
				</div>

				{/* Modal Action Footer */}
				<div className="modal-action border-t border-base-300 pt-4 mt-4 flex justify-between items-center">
					<div>
						{hasChanges && (
							<button
								type="button"
								onClick={handleClearAll}
								className="btn btn-ghost btn-sm">
								Clear All
							</button>
						)}
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							className="btn btn-ghost btn-sm"
							onClick={onClose}>
							Cancel
						</button>
						<button
							type="button"
							className="btn btn-primary btn-sm px-6 font-bold"
							onClick={handleSave}>
							Save Note
						</button>
					</div>
				</div>
			</div>
			<div
				className="modal-backdrop bg-black/50 backdrop-blur-xs"
				onClick={onClose}
			/>
		</div>
	);
};

export default ItemNoteModal;
