// src/components/common/DeleteConfirmationModal.jsx
import { AlertTriangle } from "lucide-react";

const DeleteConfirmationModal = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
}) => {
	if (!isOpen) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box">
				<div className="flex items-center gap-3 text-error mb-4">
					<AlertTriangle className="w-6 h-6" />
					<h3 className="font-bold text-lg">{title}</h3>
				</div>

				<p className="py-4">{message}</p>

				<div className="modal-action">
					<button onClick={onClose} className="btn btn-ghost">
						Cancel
					</button>
					<button onClick={onConfirm} className="btn btn-error">
						Delete
					</button>
				</div>
			</div>
			<div className="modal-backdrop" onClick={onClose} />
		</div>
	);
};

export default DeleteConfirmationModal;
