import React, { useState, useEffect } from "react";
import {
	DEFAULT_ORDER_NOTES,
	CATEGORY_SPECIFIC_NOTES,
} from "../common/orderConstants";

const ItemNoteModal = ({ show, onClose, onSave, item }) => {
	const [customNote, setCustomNote] = useState("");
	const [selectedCommonNotes, setSelectedCommonNotes] = useState([]);

	const relevantNotes =
		item && CATEGORY_SPECIFIC_NOTES[item.category]
			? CATEGORY_SPECIFIC_NOTES[item.category]
			: DEFAULT_ORDER_NOTES;

	useEffect(() => {
		if (show && item) {
			const currentNote = item.note || "";
			const parts = currentNote
				.split(", ")
				.map((p) => p.trim())
				.filter((p) => p !== "");

			const selected = relevantNotes
				.map((cn) => cn.label)
				.filter((label) => parts.includes(label));

			const custom = parts
				.filter((p) => p && !relevantNotes.some((cn) => cn.label === p))
				.join(", ");

			setSelectedCommonNotes(selected);
			setCustomNote(custom);
		}
	}, [show, item, relevantNotes]);

	const toggleCommonNote = (noteLabel) => {
		setSelectedCommonNotes((prev) =>
			prev.includes(noteLabel)
				? prev.filter((n) => n !== noteLabel)
				: [...prev, noteLabel]
		);
	};

	const handleSave = () => {
		const combinedNotes = [...selectedCommonNotes];
		if (customNote.trim()) {
			combinedNotes.push(customNote.trim());
		}
		onSave(combinedNotes.join(", "));
	};

	if (!show) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-4xl w-11/12 md:w-3/4">
				<div className="flex justify-between items-center mb-6">
					<div className="flex flex-col">
						<h3 className="font-bold text-xl">
							Notes for {item?.name_burmese || "this item"}
						</h3>
						<span className="text-xs text-base-content/50">
							Category: {item?.category}
						</span>
					</div>
					<div className="text-xs text-base-content/50 italic">
						Select common requests or type below
					</div>
				</div>

				{/* Common Request Grid */}
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 mb-6">
					{relevantNotes.map((note) => {
						const Icon = note.icon;
						const isSelected = selectedCommonNotes.includes(note.label);
						return (
							<button
								key={note.id}
								className={`btn h-auto py-3 px-2 flex flex-col gap-1.5 transition-all ${
									isSelected
										? "btn-primary shadow-md scale-[1.02]"
										: "btn-outline border-base-300 hover:border-primary"
								}`}
								onClick={() => toggleCommonNote(note.label)}>
								<Icon
									className={`w-4 h-4 ${
										isSelected ? "text-white" : note.color
									}`}
								/>
								<span className="text-[11px] font-bold uppercase tracking-tight">
									{note.label}
								</span>
							</button>
						);
					})}
				</div>

				{/* Custom Request Input */}
				<div className="form-control mb-6">
					<label className="label">
						<span className="label-text font-bold text-xs uppercase tracking-widest text-base-content/60">
							Custom Request (Optional)
						</span>
					</label>
					<input
						type="text"
						placeholder="Type specific instructions here..."
						className="input input-bordered w-full pr-10 focus:input-primary transition-all font-medium"
						value={customNote}
						onChange={(e) => setCustomNote(e.target.value)}
						autoFocus
					/>
				</div>

				<div className="modal-action border-t border-base-300 pt-4 mt-0">
					<button className="btn btn-ghost" onClick={onClose}>
						Cancel
					</button>
					<button className="btn btn-primary px-8" onClick={handleSave}>
						Save Note
					</button>
				</div>
			</div>
			<div
				className="modal-backdrop bg-black/40 backdrop-blur-[1px]"
				onClick={onClose}></div>
		</div>
	);
};

export default ItemNoteModal;
