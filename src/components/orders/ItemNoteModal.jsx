import React, { useState, useEffect, useMemo } from "react";
import { Package, X } from "lucide-react";
import {
	DEFAULT_ORDER_NOTES,
	CATEGORY_SPECIFIC_NOTES,
} from "../common/orderConstants";

const TASTE_LEVELS = ["No", "Low", "Med", "High"];
const FOOD_TASTE_CATEGORIES = ["Spicy", "Sour", "Salty"];
const DRINK_TASTE_CATEGORIES = ["Sweet", "Sour"];
const TOPPINGS = ["Egg", "Pork", "Chicken", "Veggie"];

const ItemNoteModal = ({ show, onClose, onSave, item }) => {
	const [customNote, setCustomNote] = useState("");
	const [selectedCommonNotes, setSelectedCommonNotes] = useState([]);
	const [isTakeaway, setIsTakeaway] = useState(false);
	const [selectedToppings, setSelectedToppings] = useState([]);
	
	const tasteCategories = useMemo(() => {
		return item?.category === "Drink" ? DRINK_TASTE_CATEGORIES : FOOD_TASTE_CATEGORIES;
	}, [item?.category]);

	const [tasteProfiles, setTasteProfiles] = useState({});

	const relevantNotes = useMemo(() => {
		return item && CATEGORY_SPECIFIC_NOTES[item.category]
			? CATEGORY_SPECIFIC_NOTES[item.category]
			: DEFAULT_ORDER_NOTES;
	}, [item?.category]);

	const filteredFrequentNotes = useMemo(() => {
		return relevantNotes.filter(
			(note) =>
				![
					"takeaway",
					"takeaway_drink",
					"less_spicy",
					"extra_spicy",
					"no_chili",
					"no_sweet",
					"less_sweet",
					"extra_sweet",
					"normal_sweet",
				].includes(note.id)
		);
	}, [relevantNotes]);

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
			// Initialize tastes based on current categories
			tasteCategories.forEach(cat => {
				tastes[cat] = "Med";
			});

			let custom = [];

			parts.forEach((part) => {
				if (part === "Takeaway") return;

				// Parse Taste Profiles (e.g., "Low Spicy", "High Sour")
				let matchedTaste = false;
				tasteCategories.forEach((cat) => {
					TASTE_LEVELS.forEach((level) => {
						if (part === `${level} ${cat}`) {
							tastes[cat] = level;
							matchedTaste = true;
						}
					});
				});
				if (matchedTaste) return;

				// Parse Toppings
				if (TOPPINGS.includes(part)) {
					toppings.push(part);
					return;
				}

				// Parse Frequent Notes
				const isFrequent = filteredFrequentNotes.some(
					(fn) => fn.label === part
				);
				if (isFrequent) {
					common.push(part);
				} else {
					custom.push(part);
				}
			});

			setSelectedCommonNotes(common);
			setSelectedToppings(toppings);
			setTasteProfiles(tastes);
			setCustomNote(custom.join(", "));
		}
	}, [show, item, filteredFrequentNotes, tasteCategories]);

	const toggleCommonNote = (noteLabel) => {
		setSelectedCommonNotes((prev) =>
			prev.includes(noteLabel)
				? prev.filter((n) => n !== noteLabel)
				: [...prev, noteLabel]
		);
	};

	const toggleTopping = (topping) => {
		setSelectedToppings((prev) =>
			prev.includes(topping)
				? prev.filter((t) => t !== topping)
				: [...prev, topping]
		);
	};

	const handleSave = () => {
		const combinedNotes = [];
		if (isTakeaway) combinedNotes.push("Takeaway");

		tasteCategories.forEach((cat) => {
			if (tasteProfiles[cat] && tasteProfiles[cat] !== "Med") {
				combinedNotes.push(`${tasteProfiles[cat]} ${cat}`);
			}
		});

		selectedToppings.forEach((t) => combinedNotes.push(t));
		selectedCommonNotes.forEach((n) => combinedNotes.push(n));

		if (customNote.trim()) {
			combinedNotes.push(customNote.trim());
		}
		onSave(combinedNotes.join(", "));
	};

	if (!show) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-2xl w-11/12 p-0 overflow-hidden relative">
				{/* Takeaway Button in Top Right */}
				<div className="absolute top-6 right-14">
					<button
						className={`btn btn-sm gap-2 normal-case ${
							isTakeaway ? "btn-primary" : "btn-outline border-gray-200"
						}`}
						onClick={() => setIsTakeaway(!isTakeaway)}>
						<Package className="w-4 h-4" />
						Takeaway
					</button>
				</div>

				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-5 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
					<X className="w-5 h-5 text-gray-500" />
				</button>

				<div className="p-6 pb-2">
					<h3 className="font-bold text-2xl pr-32">
						{item?.name_burmese || "Notes"}
					</h3>
				</div>

				<div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto pb-24">
					{/* Toppings Section */}
					<div>
						<div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
							Toppings
						</div>
						<div className="flex flex-wrap gap-2">
							{TOPPINGS.map((topping) => (
								<button
									key={topping}
									onClick={() => toggleTopping(topping)}
									className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
										selectedToppings.includes(topping)
											? "bg-primary text-white border-primary"
											: "border-gray-200 text-gray-600 hover:border-primary"
									}`}>
									{topping}
								</button>
							))}
						</div>
					</div>

					{/* Taste Profile Section */}
					<div>
						<div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
							Taste Profile
						</div>
						<div className="space-y-4">
							{tasteCategories.map((cat) => (
								<div key={cat} className="flex items-center gap-4">
									<div className="w-16 text-sm font-semibold text-gray-700">
										{cat}
									</div>
									<div className="flex flex-1 bg-gray-100 rounded-lg p-1">
										{TASTE_LEVELS.map((level) => (
											<button
												key={level}
												onClick={() =>
													setTasteProfiles((prev) => ({
														...prev,
														[cat]: level,
													}))
												}
												className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
													tasteProfiles[cat] === level
														? "bg-white shadow-sm text-primary"
														: "text-gray-500 hover:text-gray-700"
												}`}>
												{level}
											</button>
										))}
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Frequent Request Section */}
					<div>
						<div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
							Frequent Request
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
							{filteredFrequentNotes.map((note) => {
								const Icon = note.icon;
								const isSelected = selectedCommonNotes.includes(note.label);
								return (
									<button
										key={note.id}
										className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
											isSelected
												? "bg-primary/10 text-primary border-primary"
												: "border-gray-100 hover:border-gray-200 text-gray-600"
										}`}
										onClick={() => toggleCommonNote(note.label)}>
										<Icon
											className={`w-4 h-4 ${
												isSelected ? "text-primary" : "text-gray-400"
											}`}
										/>
										<span className="text-xs font-bold">{note.label}</span>
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* Custom Field and Save */}
				<div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
					<div className="flex items-center gap-2">
						<input
							type="text"
							placeholder="Custom Field..."
							className="flex-1 input input-bordered bg-gray-50 border-none focus:ring-0 text-base h-12"
							value={customNote}
							onChange={(e) => setCustomNote(e.target.value)}
						/>
						<button
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
