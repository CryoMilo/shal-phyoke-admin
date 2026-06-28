import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Calendar, Percent, ShieldAlert, Award, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import useBonusStore from "../../stores/bonusStore";
import { useAuth } from "../../contexts/AuthContext";
import DeleteConfirmationModal from "../common/DeleteConfirmationModal";
import { showToast } from "../../utils/toastUtils";
import ShalPhyokeDatePicker from "../common/ShalPhyokeDatePicker";

const BonusConfigTab = () => {
	const {
		bonusConfigs,
		loading,
		fetchBonusConfigs,
		addBonusConfig,
		updateBonusConfig,
		deleteBonusConfig,
	} = useBonusStore();

	const { user } = useAuth();

	const [showModal, setShowModal] = useState(false);
	const [editingConfig, setEditingConfig] = useState(null);
	const [deleteId, setDeleteId] = useState(null);

	// Form fields
	const [poolPercentage, setPoolPercentage] = useState("10.0");
	const [allowedAbsences, setAllowedAbsences] = useState("4.0");
	const [effectiveFrom, setEffectiveFrom] = useState(format(new Date(), "yyyy-MM-dd"));
	const [effectiveTo, setEffectiveTo] = useState("");
	
	// State for dynamic penalty tiers editor: [{ points: 2, penalty: 50 }, ...]
	const [penaltyTiers, setPenaltyTiers] = useState([
		{ points: "2", penalty: "50" },
		{ points: "3", penalty: "75" },
		{ points: "4", penalty: "100" },
	]);

	useEffect(() => {
		fetchBonusConfigs();
	}, [fetchBonusConfigs]);

	useEffect(() => {
		if (editingConfig) {
			setPoolPercentage(editingConfig.pool_percentage?.toString() || "10.0");
			setAllowedAbsences(editingConfig.allowed_absences?.toString() || "4.0");
			setEffectiveFrom(editingConfig.effective_from || format(new Date(), "yyyy-MM-dd"));
			setEffectiveTo(editingConfig.effective_to || "");
			
			// Parse jsonb tiers {"2": 50, "3": 75} -> [{ points: "2", penalty: "50" }]
			if (editingConfig.penalty_tiers) {
				const tiers = Object.entries(editingConfig.penalty_tiers)
					.map(([pts, pct]) => ({ points: pts, penalty: pct.toString() }))
					.sort((a, b) => parseFloat(a.points) - parseFloat(b.points));
				setPenaltyTiers(tiers);
			} else {
				setPenaltyTiers([]);
			}
		} else {
			setPoolPercentage("10.0");
			setAllowedAbsences("4.0");
			setEffectiveFrom(format(new Date(), "yyyy-MM-dd"));
			setEffectiveTo("");
			setPenaltyTiers([
				{ points: "2", penalty: "50" },
				{ points: "3", penalty: "75" },
				{ points: "4", penalty: "100" },
			]);
		}
	}, [editingConfig, showModal]);

	const resetModal = () => {
		setShowModal(false);
		setEditingConfig(null);
	};

	const handleAddTier = () => {
		setPenaltyTiers([...penaltyTiers, { points: "", penalty: "" }]);
	};

	const handleRemoveTier = (index) => {
		setPenaltyTiers(penaltyTiers.filter((_, i) => i !== index));
	};

	const handleTierChange = (index, field, value) => {
		const updated = [...penaltyTiers];
		updated[index][field] = value;
		setPenaltyTiers(updated);
	};

	const handleSave = async (e) => {
		e.preventDefault();
		
		const poolPct = parseFloat(poolPercentage);
		if (isNaN(poolPct) || poolPct < 0 || poolPct > 100) {
			showToast.error("Pool percentage must be between 0 and 100");
			return;
		}

		const allowedAbs = parseFloat(allowedAbsences);
		if (isNaN(allowedAbs) || allowedAbs < 0) {
			showToast.error("Allowed absences must be a positive number");
			return;
		}

		if (!effectiveFrom) {
			showToast.error("Effective starting date is required");
			return;
		}

		if (effectiveTo && new Date(effectiveTo) < new Date(effectiveFrom)) {
			showToast.error("End date cannot be earlier than start date");
			return;
		}

		// Convert tiers array back to JSON object: { "2": 50, "3": 75 }
		const tiersObj = {};
		for (const tier of penaltyTiers) {
			const pts = parseFloat(tier.points);
			const pct = parseFloat(tier.penalty);
			if (isNaN(pts) || pts <= 0 || isNaN(pct) || pct < 0 || pct > 100) {
				showToast.error("Invalid penalty tiers. Points and percentages must be valid numbers");
				return;
			}
			tiersObj[tier.points] = pct;
		}

		const payload = {
			pool_percentage: poolPct,
			allowed_absences: allowedAbs,
			penalty_tiers: tiersObj,
			effective_from: effectiveFrom,
			effective_to: effectiveTo || null,
			created_by: user?.id || null,
		};

		const result = editingConfig
			? await updateBonusConfig(editingConfig.id, payload)
			: await addBonusConfig(payload);

		if (result.success) resetModal();
	};

	const handleDelete = async () => {
		if (!deleteId) return;
		await deleteBonusConfig(deleteId);
		setDeleteId(null);
	};

	const getStatusBadge = (config) => {
		const today = format(new Date(), "yyyy-MM-dd");
		if (config.effective_from > today) {
			return <span className="badge badge-warning gap-1">Upcoming</span>;
		}
		if (config.effective_to && config.effective_to < today) {
			return <span className="badge badge-ghost gap-1 opacity-60">Expired</span>;
		}
		return <span className="badge badge-success gap-1 text-white">Active</span>;
	};

	return (
		<>
			<div className="flex flex-wrap justify-between items-center gap-3 mb-6">
				<div>
					<h3 className="font-semibold text-lg text-base-content/80">Bonus Configurations</h3>
					<p className="text-xs text-base-content/50">Define percentage allocation and absence penalty rules</p>
				</div>
				<button
					className="btn btn-primary btn-sm gap-2"
					onClick={() => {
						setEditingConfig(null);
						setShowModal(true);
					}}>
					<Plus className="w-4 h-4" />
					Add Configuration
				</button>
			</div>

			{loading && bonusConfigs.length === 0 ? (
				<div className="py-16 text-center">
					<span className="loading loading-spinner loading-lg text-primary"></span>
				</div>
			) : bonusConfigs.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{bonusConfigs.map((config) => (
						<div key={config.id} className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow">
							<div className="card-body p-5">
								<div className="flex justify-between items-start mb-3">
									<div className="flex items-center gap-2">
										<div className="p-2 rounded-lg bg-primary/10 text-primary">
											<Award className="w-5 h-5" />
										</div>
										<div>
											<div className="flex items-center gap-2">
												<span className="font-bold text-lg">{config.pool_percentage}%</span>
												<span className="text-xs text-base-content/50">Pool Share</span>
											</div>
											<div className="flex items-center gap-1 text-xs text-base-content/60 mt-0.5">
												<Calendar className="w-3.5 h-3.5" />
												<span>{format(new Date(config.effective_from + "T12:00:00"), "MMM d, yyyy")}</span>
												{config.effective_to ? (
													<>
														<ArrowRight className="w-3 h-3 mx-0.5" />
														<span>{format(new Date(config.effective_to + "T12:00:00"), "MMM d, yyyy")}</span>
													</>
												) : (
													<span className="ml-1 text-xs text-success font-medium">(Ongoing)</span>
												)}
											</div>
										</div>
									</div>
									<div className="flex flex-col items-end gap-2">
										{getStatusBadge(config)}
										<div className="flex gap-1">
											<button
												className="btn btn-ghost btn-xs btn-square hover:bg-base-200"
												onClick={() => {
													setEditingConfig(config);
													setShowModal(true);
												}}>
												<Edit2 className="w-3.5 h-3.5" />
											</button>
											<button
												className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
												onClick={() => setDeleteId(config.id)}>
												<Trash2 className="w-3.5 h-3.5" />
											</button>
										</div>
									</div>
								</div>

								<div className="divider my-2"></div>

								<div className="space-y-3">
									<div className="flex justify-between text-sm">
										<span className="text-base-content/60">Free Absence Points limit:</span>
										<span className="font-semibold text-base-content">{config.allowed_absences} points</span>
									</div>
									<div>
										<span className="text-xs font-semibold text-base-content/60 block mb-1.5">Absence Penalty Scale:</span>
										<div className="grid grid-cols-3 gap-2">
											{Object.entries(config.penalty_tiers || {})
												.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
												.map(([pts, pct]) => (
													<div key={pts} className="bg-base-200/50 rounded-lg p-2 text-center border border-base-200">
														<div className="text-xs text-base-content/50 font-medium">{pts} pts</div>
														<div className="text-sm font-bold text-error">{pct}% penalty</div>
													</div>
												))}
										</div>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="py-16 text-center bg-base-200 rounded-xl border-2 border-dashed border-base-300">
					<p className="text-base-content/50">No bonus configurations found. Add one to set up the bonus pool rules.</p>
				</div>
			)}

			{showModal && (
				<div className="modal modal-open">
					<div className="modal-box max-w-lg p-0 overflow-hidden bg-base-100 shadow-2xl rounded-2xl border border-base-200">
						{/* Header */}
						<div className="p-6 pb-4 border-b border-base-200 flex justify-between items-center bg-gradient-to-r from-primary/5 to-secondary/5">
							<div>
								<h3 className="font-bold text-xl text-base-content">
									{editingConfig ? "Edit Bonus Config" : "New Bonus Config"}
								</h3>
								<p className="text-xs text-base-content/50 mt-0.5">Configure profit pool sharing & penalties</p>
							</div>
							<button className="btn btn-sm btn-circle btn-ghost" onClick={resetModal}>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSave} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{/* Pool Percentage */}
								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-bold text-sm text-base-content/80">Pool Share % *</span>
									</label>
									<div className="relative">
										<input
											type="number"
											min="0"
											max="100"
											step="0.1"
											className="input input-bordered w-full pr-10 focus:input-primary transition-all font-medium"
											value={poolPercentage}
											onChange={(e) => setPoolPercentage(e.target.value)}
											required
										/>
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 font-bold">%</span>
									</div>
								</div>

								{/* Allowed Absences */}
								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-bold text-sm text-base-content/80">Allowed Absences *</span>
									</label>
									<input
										type="number"
										min="0"
										step="0.5"
										className="input input-bordered w-full focus:input-primary transition-all font-medium"
										value={allowedAbsences}
										onChange={(e) => setAllowedAbsences(e.target.value)}
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{/* Effective From */}
								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-bold text-sm text-base-content/80">Effective From *</span>
									</label>
									<ShalPhyokeDatePicker
										mode="date"
										value={new Date(effectiveFrom + "T12:00:00")}
										onChange={(date) => setEffectiveFrom(format(date, "yyyy-MM-dd"))}
										className="w-full"
									/>
								</div>

								{/* Effective To */}
								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-bold text-sm text-base-content/80">Effective To</span>
									</label>
									<ShalPhyokeDatePicker
										mode="date"
										value={effectiveTo ? new Date(effectiveTo + "T12:00:00") : null}
										onChange={(date) => setEffectiveTo(date ? format(date, "yyyy-MM-dd") : "")}
										placeholder="Ongoing"
										className="w-full"
									/>
								</div>
							</div>

							{/* Penalty Tiers Dynamic Grid */}
							<div className="border border-base-200 rounded-xl p-4 bg-base-50/50">
								<div className="flex justify-between items-center mb-3">
									<div>
										<span className="text-sm font-bold text-base-content/80 block">Absence Penalty Scale</span>
										<span className="text-xs text-base-content/50">Set penalty percentages for absence point counts</span>
									</div>
									<button
										type="button"
										className="btn btn-outline btn-xs gap-1"
										onClick={handleAddTier}>
										<Plus className="w-3.5 h-3.5" /> Add Tier
									</button>
								</div>

								{penaltyTiers.length === 0 ? (
									<div className="text-center py-4 bg-base-100 rounded-lg border border-dashed border-base-200 text-xs text-base-content/40">
										No penalties configured. (All absences are free of penalty)
									</div>
								) : (
									<div className="space-y-2">
										{penaltyTiers.map((tier, idx) => (
											<div key={idx} className="flex gap-2 items-center">
												<div className="flex-1 grid grid-cols-2 gap-2">
													<div className="relative flex items-center">
														<input
															type="number"
															placeholder="Absence points"
															min="0.5"
															step="0.5"
															className="input input-bordered input-sm w-full font-medium"
															value={tier.points}
															onChange={(e) => handleTierChange(idx, "points", e.target.value)}
															required
														/>
														<span className="absolute right-2 text-[10px] text-base-content/40 font-semibold uppercase">pts</span>
													</div>
													<div className="relative flex items-center">
														<input
															type="number"
															placeholder="Penalty %"
															min="0"
															max="100"
															step="1"
															className="input input-bordered input-sm w-full font-medium text-error"
															value={tier.penalty}
															onChange={(e) => handleTierChange(idx, "penalty", e.target.value)}
															required
														/>
														<span className="absolute right-3 text-xs text-base-content/40 font-bold">%</span>
													</div>
												</div>
												<button
													type="button"
													className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
													onClick={() => handleRemoveTier(idx)}>
													<X className="w-4 h-4" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</form>

						{/* Footer Actions */}
						<div className="p-6 border-t border-base-200 flex justify-end gap-2 bg-base-50/50">
							<button type="button" className="btn btn-ghost" onClick={resetModal}>
								Cancel
							</button>
							<button type="submit" className="btn btn-primary px-6" onClick={handleSave}>
								{editingConfig ? "Update Config" : "Save Config"}
							</button>
						</div>
					</div>
					<div className="modal-backdrop bg-black/60 backdrop-blur-xs" onClick={resetModal} />
				</div>
			)}

			<DeleteConfirmationModal
				isOpen={!!deleteId}
				onClose={() => setDeleteId(null)}
				onConfirm={handleDelete}
				title="Delete Bonus Config?"
				message="Are you sure you want to delete this configuration? This action is permanent."
			/>
		</>
	);
};

export default BonusConfigTab;
