// src/components/employees/ResetConfirmationModal.jsx
import React from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";

const ResetConfirmationModal = ({
	isOpen,
	onClose,
	onConfirm,
	loading = false,
}) => {
	if (!isOpen) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box max-w-md">
				<div className="flex items-center gap-3 text-warning mb-4">
					<div className="p-2.5 rounded-full bg-warning/10 text-warning">
						<RotateCcw className="w-6 h-6" />
					</div>
					<div>
						<h3 className="font-bold text-lg text-base-content">Reset Bonus Tracker?</h3>
						<p className="text-xs text-base-content/60">This starts a new bonus tracking cycle</p>
					</div>
				</div>

				<div className="py-2 text-sm text-base-content/80 space-y-3">
					<p>
						Are you sure you want to reset all employee bonuses to <strong className="text-primary font-bold">฿0.00</strong>?
					</p>
					<div className="bg-warning/10 text-warning-content p-3 rounded-xl text-xs flex items-start gap-2 border border-warning/20">
						<AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
						<span>
							Make sure you have paid out or noted the current bonuses before resetting. This action cannot be undone.
						</span>
					</div>
				</div>

				<div className="modal-action mt-6">
					<button
						type="button"
						onClick={onClose}
						className="btn btn-ghost"
						disabled={loading}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="btn btn-error gap-2 min-w-[140px]"
						disabled={loading}
					>
						{loading ? (
							<span className="loading loading-spinner loading-sm" />
						) : (
							<RotateCcw className="w-4 h-4" />
						)}
						Reset Bonuses
					</button>
				</div>
			</div>
			<div
				className="modal-backdrop bg-black/60 backdrop-blur-xs"
				onClick={loading ? undefined : onClose}
			/>
		</div>
	);
};

export default ResetConfirmationModal;
