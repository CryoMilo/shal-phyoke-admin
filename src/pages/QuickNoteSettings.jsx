import React, { useState, useEffect } from "react";
import { showToast } from "../utils/toastUtils";
import {
	Plus,
	Trash2,
	Edit2,
	Settings2,
	X,
	AlertCircle,
	Copy,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import useQuickNoteStore from "../stores/quickNoteStore";
import DeleteConfirmationModal from "../components/common/DeleteConfirmationModal";

const QuickNoteSettings = () => {
	const {
		notes,
		loading,
		fetchAllNotes,
		addNote,
		updateNote,
		deleteNote,
		duplicateNote,
	} = useQuickNoteStore();
	const [showModal, setShowModal] = useState(false);
	const [editingNote, setEditingNote] = useState(null);

	// Delete confirmation state
	const [deleteId, setDeleteId] = useState(null);

	// Form state
	const [label, setLabel] = useState("");
	const [type, setType] = useState("radio"); // radio (taste profile) or multiple (frequent request)
	const [options, setOptions] = useState(["No", "Low", "Med", "High"]);
	const [isActive, setIsActive] = useState(true);
	const [newOptionInput, setNewOptionInput] = useState("");

	useEffect(() => {
		fetchAllNotes();
	}, [fetchAllNotes]);

	useEffect(() => {
		if (editingNote) {
			setLabel(editingNote.label || "");
			setType(editingNote.type || "radio");
			setOptions(editingNote.options || ["No", "Low", "Med", "High"]);
			setIsActive(editingNote.is_active ?? true);
		} else {
			setLabel("");
			setType("radio");
			setOptions(["No", "Low", "Med", "High"]);
			setIsActive(true);
		}
		setNewOptionInput("");
	}, [editingNote, showModal]);

	const handleSave = async (e) => {
		e.preventDefault();
		if (!label.trim()) {
			showToast.error("Label is required");
			return;
		}

		const payload = {
			label: label.trim(),
			type,
			options,
			is_active: isActive,
		};

		let result;
		if (editingNote) {
			result = await updateNote(editingNote.id, payload);
		} else {
			result = await addNote(payload);
		}

		if (result.success) {
			setShowModal(false);
			setEditingNote(null);
		}
	};

	const handleDuplicate = async (id) => {
		await duplicateNote(id);
	};

	const handleDelete = async () => {
		if (!deleteId) return;
		await deleteNote(deleteId);
		setDeleteId(null);
	};

	const addOption = () => {
		const val = newOptionInput.trim();
		if (!val) return;
		if (options.includes(val)) {
			showToast.error("Option already exists");
			return;
		}
		setOptions([...options, val]);
		setNewOptionInput("");
	};

	const removeOption = (opt) => {
		if (options.length <= 1) return;
		setOptions(options.filter((o) => o !== opt));
	};

	return (
		<div className="container mx-auto p-3 md:p-6">
			<PageHeader
				title="Quick Note Library"
				description="Manage templates for taste profiles and frequent requests. Assign these to specific menu items in the All Menu page."
				buttons={[
					{
						label: "Create",
						icon: Plus,
						onClick: () => {
							setEditingNote(null);
							setShowModal(true);
						},
						variant: "primary",
					},
				]}
			/>

			{/* Settings Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{loading ? (
					<div className="col-span-full py-20 text-center">
						<span className="loading loading-spinner loading-lg text-primary"></span>
					</div>
				) : notes.length > 0 ? (
					notes.map((note) => (
						<div
							key={note.id}
							className={`card bg-base-100 border ${
								note.is_active
									? "border-base-300"
									: "border-error/20 bg-error/5"
							} shadow-sm transition-all hover:shadow-md`}>
							<div className="card-body p-4">
								<div className="flex justify-between items-start">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<h3
												className="font-bold text-lg truncate"
												title={note.label}>
												{note.label}
											</h3>
											{!note.is_active && (
												<span className="badge badge-error badge-xs text-[8px] font-bold">
													INACTIVE
												</span>
											)}
										</div>
										<p className="text-[10px] uppercase tracking-wider opacity-50 font-bold">
											{note.type === "radio"
												? "Single Choice (Radio)"
												: "Multiple Selection"}
										</p>
									</div>
									<div className="flex gap-1 ml-2">
										<button
											className="btn btn-ghost btn-xs btn-square text-primary"
											title="Duplicate Template"
											onClick={() => handleDuplicate(note.id)}>
											<Copy className="w-3.5 h-3.5" />
										</button>
										<button
											className="btn btn-ghost btn-xs btn-square"
											title="Edit Template"
											onClick={() => {
												setEditingNote(note);
												setShowModal(true);
											}}>
											<Edit2 className="w-3.5 h-3.5" />
										</button>
										<button
											className="btn btn-ghost btn-xs btn-square text-error"
											title="Delete Template"
											onClick={() => setDeleteId(note.id)}>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</div>
								</div>

								<div className="mt-3 flex gap-1 flex-wrap">
									{note.options?.map((opt) => (
										<span
											key={opt}
											className="badge badge-outline badge-sm text-[10px] bg-base-200/50">
											{opt}
										</span>
									))}
								</div>
							</div>
						</div>
					))
				) : (
					<div className="col-span-full py-16 text-center bg-base-200 rounded-xl border-2 border-dashed border-base-300">
						<Settings2 className="w-12 h-12 mx-auto opacity-20 mb-2" />
						<p className="text-base-content/50">
							Your library is empty. Create your first note template!
						</p>
					</div>
				)}
			</div>

			{/* Modal */}
			{showModal && (
				<div className="modal modal-open">
					<div className="modal-box max-w-md p-0 overflow-hidden">
						<div className="p-6 pb-4 border-b border-base-200 flex justify-between items-center sticky top-0 bg-base-100 z-10">
							<h3 className="font-bold text-xl">
								{editingNote ? "Edit Template" : "New Template"}
							</h3>
							<button
								className="btn btn-sm btn-circle btn-ghost"
								onClick={() => {
									setShowModal(false);
									setEditingNote(null);
								}}>
								<X className="w-5 h-5" />
							</button>
						</div>

						<form
							onSubmit={handleSave}
							className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
							{/* Label */}
							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">
										Note Label *
									</span>
								</label>
								<input
									type="text"
									className="input input-bordered w-full"
									value={label}
									onChange={(e) => setLabel(e.target.value)}
									placeholder="e.g. Spice Level, Sweetness, or No Veggies"
									required
								/>
								<label className="label">
									<span className="label-text-alt opacity-60 italic">
										This is the title shown during ordering.
									</span>
								</label>
							</div>

							{/* Type Selection */}
							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">
										Selection Mode
									</span>
								</label>
								<div className="flex gap-2">
									<button
										type="button"
										className={`btn btn-sm flex-1 ${
											type === "radio" ? "btn-primary" : "btn-outline"
										}`}
										onClick={() => setType("radio")}>
										Single (Radio)
									</button>
									<button
										type="button"
										className={`btn btn-sm flex-1 ${
											type === "multiple" ? "btn-primary" : "btn-outline"
										}`}
										onClick={() => setType("multiple")}>
										Multi-select
									</button>
								</div>
								<label className="label">
									<span className="label-text-alt opacity-60 italic">
										{type === "radio"
											? "Customer picks one (e.g. Low/Med/High)"
											: "Customer picks multiple (e.g. No Onion, No Chili)"}
									</span>
								</label>
							</div>

							{/* Options */}
							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">
										Options / Levels
									</span>
								</label>
								<div className="flex flex-wrap gap-1 mb-3">
									{options.map((opt) => (
										<div
											key={opt}
											className="badge badge-outline badge-lg py-4 gap-1 border-base-300 bg-base-100">
											<span className="text-xs font-medium">{opt}</span>
											{options.length > 1 && (
												<button
													type="button"
													className="hover:text-error transition-colors"
													onClick={() => removeOption(opt)}>
													<X className="w-3 h-3" />
												</button>
											)}
										</div>
									))}
								</div>
								<div className="flex gap-2">
									<input
										type="text"
										className="input input-bordered input-sm flex-1"
										placeholder="Add option..."
										value={newOptionInput}
										onChange={(e) => setNewOptionInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addOption();
											}
										}}
									/>
									<button
										type="button"
										className="btn btn-sm btn-outline"
										onClick={addOption}>
										Add
									</button>
								</div>
							</div>

							{/* Active Toggle */}
							<div className="form-control">
								<label className="label cursor-pointer justify-start gap-3 bg-base-200/50 p-3 rounded-lg border border-base-200">
									<input
										type="checkbox"
										className="checkbox checkbox-primary"
										checked={isActive}
										onChange={(e) => setIsActive(e.target.checked)}
									/>
									<div>
										<span className="label-text font-bold block">
											Library Status
										</span>
										<span className="text-[10px] opacity-60">
											Inactive notes are hidden from the item assignment picker.
										</span>
									</div>
								</label>
							</div>
						</form>

						<div className="p-6 border-t border-base-200 bg-base-50 flex justify-end gap-2 sticky bottom-0 bg-base-100 z-10">
							<button
								type="button"
								className="btn btn-ghost"
								onClick={() => {
									setShowModal(false);
									setEditingNote(null);
								}}>
								Cancel
							</button>
							<button
								type="submit"
								className="btn btn-primary px-8"
								onClick={handleSave}>
								{editingNote ? "Update Template" : "Save to Library"}
							</button>
						</div>
					</div>
					<div
						className="modal-backdrop bg-black/50"
						onClick={() => {
							setShowModal(false);
							setEditingNote(null);
						}}></div>
				</div>
			)}

			<DeleteConfirmationModal
				isOpen={!!deleteId}
				onClose={() => setDeleteId(null)}
				onConfirm={handleDelete}
				title="Delete Template?"
				message="Are you sure you want to delete this note from the library? This won't automatically remove it from menu items but it will stop appearing in the picker."
			/>
		</div>
	);
};

export default QuickNoteSettings;
