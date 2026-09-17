import React, { useState, useEffect } from "react";
import {
	Volume2,
	Zap,
	ShoppingCart,
	Package,
	PhoneCall,
	X,
	Check,
	Loader2,
	Radio,
} from "lucide-react";
import { AVAILABLE_SOUNDS, triggerSoundAlert } from "../../services/soundAlertService";
import { showToast } from "../../utils/toastUtils";

const ICON_MAP = {
	Zap,
	ShoppingCart,
	Package,
	PhoneCall,
};

const SoundAlertsModal = ({ isOpen, onClose }) => {
	const [activePlayingId, setActivePlayingId] = useState(null);
	const [recentTriggeredId, setRecentTriggeredId] = useState(null);

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const handlePlaySound = async (sound) => {
		if (activePlayingId) return;

		setActivePlayingId(sound.id);
		try {
			const result = await triggerSoundAlert(sound.id, sound.title);
			if (result.success) {
				setRecentTriggeredId(sound.id);
				setTimeout(() => {
					setRecentTriggeredId(null);
				}, 2500);
			} else {
				showToast.error(`Failed to trigger ${sound.title}`);
			}
		} catch (err) {
			console.error("Sound trigger error:", err);
			showToast.error("Failed to broadcast sound");
		} finally {
			setActivePlayingId(null);
		}
	};

	return (
		<div className="modal modal-open z-50">
			<div
				className="modal-backdrop bg-black/60 backdrop-blur-xs"
				onClick={onClose}></div>

			<div className="modal-box max-w-lg w-full bg-base-100 border border-base-300 shadow-2xl p-6 relative rounded-2xl">
				{/* Close Button */}
				<button
					onClick={onClose}
					className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-base-content/60 hover:text-base-content hover:bg-base-200"
					title="Close">
					<X className="w-5 h-5" />
				</button>

				{/* Header */}
				<div className="flex items-start gap-3 mb-5">
					<div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-inner">
						<Volume2 className="w-6 h-6" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h3 className="text-lg font-black tracking-tight text-base-content">
								Sound Announcements
							</h3>
							<span className="badge badge-sm badge-primary gap-1 font-semibold">
								<Radio className="w-3 h-3 animate-pulse text-primary-content" />
								Live Speaker
							</span>
						</div>
						<p className="text-xs text-base-content/60 mt-0.5">
							Broadcast voice announcements to the shop speaker via printer bridge
						</p>
					</div>
				</div>

				{/* Sound Options List */}
				<div className="space-y-2.5">
					{AVAILABLE_SOUNDS.map((sound) => {
						const IconComponent = ICON_MAP[sound.icon] || Volume2;
						const isLoading = activePlayingId === sound.id;
						const isRecent = recentTriggeredId === sound.id;

						return (
							<div
								key={sound.id}
								className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 bg-base-200/50 hover:bg-base-200 ${
									isRecent ? `${sound.borderColor} ${sound.activeBg}` : "border-base-300"
								}`}>
								<div className="flex items-center gap-3 min-w-0">
									<div
										className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sound.iconBg}`}>
										<IconComponent className="w-5 h-5" />
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-bold text-sm text-base-content truncate">
												{sound.title}
											</span>
											<span
												className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${sound.badgeColor}`}>
												{sound.badge}
											</span>
										</div>
										<p className="text-xs text-base-content/60 truncate">
											{sound.subtitle}
										</p>
									</div>
								</div>

								<button
									onClick={() => handlePlaySound(sound)}
									disabled={isLoading}
									className={`btn btn-sm shrink-0 gap-1.5 font-bold transition-transform active:scale-95 ${
										isRecent
											? "btn-success text-success-content"
											: "btn-primary"
									}`}>
									{isLoading ? (
										<>
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
											<span className="text-xs">Playing...</span>
										</>
									) : isRecent ? (
										<>
											<Check className="w-3.5 h-3.5" />
											<span className="text-xs">Played</span>
										</>
									) : (
										<>
											<Volume2 className="w-3.5 h-3.5" />
											<span className="text-xs">Play</span>
										</>
									)}
								</button>
							</div>
						);
					})}
				</div>

				{/* Footer Note */}
				<div className="mt-5 pt-3 border-t border-base-200 flex items-center justify-between text-[11px] text-base-content/50">
					<span>Speaker: Delivery Pager Bridge</span>
					<button
						onClick={onClose}
						className="btn btn-xs btn-ghost hover:bg-base-200">
						Dismiss
					</button>
				</div>
			</div>
		</div>
	);
};

export default SoundAlertsModal;
