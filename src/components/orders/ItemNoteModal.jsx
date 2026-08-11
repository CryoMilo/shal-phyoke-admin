import React, { useState, useEffect, useMemo } from "react";
import { Package, X } from "lucide-react";
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
		// Burmese: Object (Label) + Modifier (Level) -> "ကြက်သွန်နီ မထည့်"
		// English: Modifier (Level) + Object (Label) -> "No Onion"
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

			// Initialize tastes from settings - default to null
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
						// Check both orders to be safe and handle legacy notes
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

				// 3. Parse Frequent Notes (Multi-select options)
				let matchedFreq = false;
				frequentNotes.forEach((note) => {
					if (note.options?.includes(part)) {
						common.push(part);
						matchedFreq = true;
					}
				});
				
				if (!matchedFreq) {
					// 4. Otherwise → add to custom array
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
			// Only add if it's explicitly selected (not null)
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
		<div className="modal modal-open">
			<div className="modal-box max-w-2xl w-11/12 p-0 overflow-hidden relative">
				<div className="absolute top-6 right-14">
					<button
						type="button"
						className={`btn btn-sm gap-2 normal-case ${
							isTakeaway ? "btn-primary" : "btn-outline border-base-300"
						}`}
						onClick={() => setIsTakeaway(!isTakeaway)}>
						<Package className="w-4 h-4" />
						Takeaway
					</button>
				</div>

				<button
					type="button"
					onClick={onClose}
					className="absolute top-5 right-4 p-2 hover:bg-base-200 rounded-full transition-colors">
					<X className="w-5 h-5 text-base-content/60" />
				</button>

				<div className="p-6 pb-2">
					<h3 className="font-bold text-2xl pr-32">
						{item?.name_burmese || "Notes"}
					</h3>
					{item?.name_english && (
						<p className="text-sm text-base-content/60 mt-1">{item.name_english}</p>
					)}
				</div>

				<div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto pb-24">
					{isCombo && hasNoQuickNotes && hasNoExtras ? (
						<div className="px-6 py-4 text-center text-sm text-base-content/60">
							Add any special instructions below
						</div>
					) : (
						<>
							{availableExtras.length > 0 && (
								<div>
									<div className="text-xs font-bold text-base-content/40 uppercase tracking-wider mb-3">
										Toppings / Sides
									</div>
									<div className="flex flex-wrap gap-2">
										{availableExtras.map((extra) => {
											const toppingName = extra.name_burmese || extra.name_english;
											if (!toppingName) return null;
											return (
												<button
													type="button"
													key={extra.id}
													onClick={() => toggleTopping(toppingName)}
													className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
														selectedToppings.includes(toppingName)
															? "bg-primary text-primary-content border-primary"
															: "border-base-300 text-base-content/70 hover:border-primary"
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
									<div className="text-xs font-bold text-base-content/40 uppercase tracking-wider mb-3">
										Taste Profile
									</div>
									<div className="space-y-4">
										{tasteCategories.map((cat) => (
											<div key={cat.id} className="flex items-center gap-4">
												<div className="w-20 text-sm font-semibold text-base-content/80">
													{cat.label}
												</div>
												<div className="flex flex-1 bg-base-200 rounded-lg p-1">
													{(cat.options || []).map(
														(level) => (
															<button
																type="button"
																key={level}
																onClick={() =>
																	setTasteProfiles((prev) => ({
																		...prev,
																		[cat.id]: prev[cat.id] === level ? null : level,
																	}))
																}
																className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
																	tasteProfiles[cat.id] === level
																		? "bg-base-100 shadow-sm text-primary"
																		: "text-base-content/50 hover:text-base-content"
																}`}>
																{level}
															</button>
														)
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{frequentNotes.length > 0 && (
								<div className="space-y-6">
									{frequentNotes.map((note) => (
										<div key={note.id}>
											<div className="text-xs font-bold text-base-content/40 uppercase tracking-wider mb-3">
												{note.label}
											</div>
											<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
												{note.options?.map((option) => {
													const isSelected = selectedCommonNotes.includes(option);
													return (
														<button
															type="button"
															key={option}
															className={`flex items-center justify-center p-3 rounded-xl border transition-all ${
																isSelected
																	? "bg-primary/10 text-primary border-primary"
																	: "border-base-200 hover:border-base-300 text-base-content/70"
															}`}
															onClick={() => toggleCommonNote(option)}>
															<span className="text-xs font-bold text-center">
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
				</div>

				<div className="absolute bottom-0 left-0 right-0 p-4 bg-base-100 border-t border-base-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
					<div className="flex items-center gap-2">
						<div className="flex-1 relative">
							<input
								type="text"
								placeholder="Custom Field..."
								className="w-full input input-bordered bg-base-200 border-none focus:ring-0 text-base h-12 pr-8"
								value={customNote}
								onChange={(e) => setCustomNote(e.target.value)}
							/>
							{customNote && (
								<span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
							)}
						</div>
						{hasChanges && (
							<button
								type="button"
								onClick={handleClearAll}
								className="btn btn-ghost px-6 h-12 min-h-12">
								Clear
							</button>
						)}
						<button
							type="button"
							className="btn btn-primary px-8 h-12 min-h-12 shadow-lg shadow-primary/20 font-bold"
							onClick={handleSave}>
							Save
						</button>
					</div>
				</div>
				<div
					className="modal-backdrop bg-black/40 backdrop-blur-[2px]"
					onClick={onClose}
				/>
			</div>
		</div>
	);
};

export default ItemNoteModal;
