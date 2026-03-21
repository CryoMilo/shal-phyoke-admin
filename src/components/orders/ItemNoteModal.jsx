import React, { useState, useEffect, useMemo } from "react";
import { Package, X } from "lucide-react";
import useQuickNoteStore from "../../stores/quickNoteStore";

const ItemNoteModal = ({ show, onClose, onSave, item }) => {
	const { getSettingsByItem } = useQuickNoteStore();

	const [customNote, setCustomNote] = useState("");
	const [selectedCommonNotes, setSelectedCommonNotes] = useState([]);
	const [isTakeaway, setIsTakeaway] = useState(false);
	const [selectedToppings, setSelectedToppings] = useState([]);
	const [tasteProfiles, setTasteProfiles] = useState({});

	const applicableSettings = useMemo(() => {
		if (!item) return [];
		return getSettingsByItem({
			category: item.category,
			is_regular: item.is_regular ?? false,
		});
	}, [item?.id, item?.category, item?.is_regular, getSettingsByItem]);

	const tasteCategories = useMemo(
		() => applicableSettings.filter((s) => s.type === "taste_profile"),
		[applicableSettings]
	);

	const frequentNotes = useMemo(
		() => applicableSettings.filter((s) => s.type === "frequent_request"),
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

			// Initialize tastes from settings
			tasteCategories.forEach((cat) => {
				tastes[cat.group_name] = "Med";
			});

			const custom = [];

			parts.forEach((part) => {
				if (part === "Takeaway") return;

				// 1. Parse Taste Profiles
				let matchedTaste = false;
				tasteCategories.forEach((cat) => {
					const levels = cat.options || ["No", "Low", "Med", "High"];
					levels.forEach((level) => {
						if (part === `${level} ${cat.label}`) {
							tastes[cat.group_name] = level;
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
				const freqNote = frequentNotes.find((n) => n.label === part);
				if (freqNote) {
					common.push(freqNote.label);
				} else {
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

	const toggleCommonNote = (noteLabel) => {
		setSelectedCommonNotes((prev) =>
			prev.includes(noteLabel)
				? prev.filter((n) => n !== noteLabel)
				: [...prev, noteLabel]
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
			Object.fromEntries(tasteCategories.map((cat) => [cat.group_name, "Med"]))
		);
	};

	const handleSave = () => {
		const combinedNotes = [];
		let totalExtraPrice = 0;

		if (isTakeaway) combinedNotes.push("Takeaway");

		tasteCategories.forEach((cat) => {
			const currentLevel = tasteProfiles[cat.group_name];
			if (currentLevel && currentLevel !== "Med") {
				combinedNotes.push(`${currentLevel} ${cat.label}`);
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
		Object.values(tasteProfiles).some((v) => v !== "Med");

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
							isTakeaway ? "btn-primary" : "btn-outline border-gray-200"
						}`}
						onClick={() => setIsTakeaway(!isTakeaway)}>
						<Package className="w-4 h-4" />
						Takeaway
					</button>
				</div>

				<button
					type="button"
					onClick={onClose}
					className="absolute top-5 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
					<X className="w-5 h-5 text-gray-500" />
				</button>

				<div className="p-6 pb-2">
					<h3 className="font-bold text-2xl pr-32">
						{item?.name_burmese || "Notes"}
					</h3>
					{item?.name_english && (
						<p className="text-sm text-gray-500 mt-1">{item.name_english}</p>
					)}
				</div>

				<div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto pb-24">
					{isCombo && hasNoQuickNotes && hasNoExtras ? (
						<div className="px-6 py-4 text-center text-sm text-gray-500">
							Add any special instructions below
						</div>
					) : (
						<>
							{availableExtras.length > 0 && (
								<div>
									<div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
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
															? "bg-primary text-white border-primary"
															: "border-gray-200 text-gray-600 hover:border-primary"
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
									<div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
										Taste Profile
									</div>
									<div className="space-y-4">
										{tasteCategories.map((cat) => (
											<div key={cat.id} className="flex items-center gap-4">
												<div className="w-20 text-sm font-semibold text-gray-700">
													{cat.label}
												</div>
												<div className="flex flex-1 bg-gray-100 rounded-lg p-1">
													{(cat.options || ["No", "Low", "Med", "High"]).map(
														(level) => (
															<button
																type="button"
																key={level}
																onClick={() =>
																	setTasteProfiles((prev) => ({
																		...prev,
																		[cat.group_name]: level,
																	}))
																}
																className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
																	tasteProfiles[cat.group_name] === level
																		? "bg-white shadow-sm text-primary"
																		: "text-gray-500 hover:text-gray-700"
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
								<div>
									<div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
										Frequent Request
									</div>
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
										{frequentNotes.map((note) => {
											const isSelected = selectedCommonNotes.includes(note.label);
											return (
												<button
													type="button"
													key={note.id}
													className={`flex items-center justify-center p-3 rounded-xl border transition-all ${
														isSelected
															? "bg-primary/10 text-primary border-primary"
															: "border-gray-100 hover:border-gray-200 text-gray-600"
													}`}
													onClick={() => toggleCommonNote(note.label)}>
													<span className="text-xs font-bold text-center">
														{note.label}
													</span>
												</button>
											);
										})}
									</div>
								</div>
							)}
						</>
					)}
				</div>

				<div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
					<div className="flex items-center gap-2">
						<div className="flex-1 relative">
							<input
								type="text"
								placeholder="Custom Field..."
								className="w-full input input-bordered bg-gray-50 border-none focus:ring-0 text-base h-12 pr-8"
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
