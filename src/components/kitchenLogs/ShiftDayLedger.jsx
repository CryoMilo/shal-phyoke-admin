// src/components/kitchenLogs/ShiftDayLedger.jsx
import React, { useState } from "react";
import {
	Plus,
	Utensils,
	AlertTriangle,
	Trash2,
	Clock,
	Layers,
	Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { getSafeImageUrl } from "../../utils/imageUtils";

const ShiftDayLedger = ({
	selectedDate,
	preps,
	spoilages,
	onOpenLogBatch,
	onOpenLogSpoilage,
	onDeleteLog,
}) => {
	const [activeTab, setActiveTab] = useState("all"); // 'all' | 'preps' | 'spoilages'
	const formattedDate = format(new Date(selectedDate), "EEEE, MMMM d, yyyy");

	const totalPreppedBatches = preps.reduce(
		(sum, p) => sum + (Number(p.batches_produced) || 1),
		0
	);

	const handleDelete = (id, label) => {
		if (window.confirm(`Delete log entry for "${label}"?`)) {
			onDeleteLog(id);
		}
	};

	return (
		<div className="bg-base-100 rounded-2xl border border-base-200 overflow-hidden shadow-sm p-4 sm:p-5 space-y-4">
			{/* Day Header & Actions */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-base-200">
				<div>
					<span className="text-[11px] font-bold uppercase tracking-wider text-primary">
						Shift Day Ledger
					</span>
					<h3 className="font-bold text-lg sm:text-xl text-base-content">
						{formattedDate}
					</h3>
				</div>

				<div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
					<button
						type="button"
						onClick={onOpenLogBatch}
						className="btn btn-sm btn-primary gap-1 shadow-sm">
						<Plus className="w-4 h-4" /> Log Batch
					</button>

					<button
						type="button"
						onClick={onOpenLogSpoilage}
						className="btn btn-sm btn-outline btn-error gap-1 shadow-sm">
						<AlertTriangle className="w-4 h-4" /> Log Waste
					</button>
				</div>
			</div>

			{/* View Tabs */}
			<div className="flex items-center gap-2">
				<div className="tabs tabs-boxed bg-base-200 p-1 rounded-xl text-xs">
					<button
						type="button"
						onClick={() => setActiveTab("all")}
						className={`tab tab-xs font-semibold ${
							activeTab === "all" ? "tab-active !bg-primary !text-primary-content" : ""
						}`}>
						All Entries ({preps.length + spoilages.length})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("preps")}
						className={`tab tab-xs font-semibold ${
							activeTab === "preps" ? "tab-active !bg-emerald-600 text-white" : ""
						}`}>
						🟢 Preps ({preps.length})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("spoilages")}
						className={`tab tab-xs font-semibold ${
							activeTab === "spoilages" ? "tab-active !bg-rose-600 text-white" : ""
						}`}>
						🔴 Waste ({spoilages.length})
					</button>
				</div>

				<span className="text-xs text-base-content/60 ml-auto font-medium hidden sm:inline">
					Total Batches Prepped: <strong>{totalPreppedBatches}</strong>
				</span>
			</div>

			{/* Split Columns or Stacked Lists */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
				{/* Column 1: Prepped Batches */}
				{(activeTab === "all" || activeTab === "preps") && (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="font-bold text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
								<Utensils className="w-4 h-4" /> 🟢 Batches Prepped Today ({preps.length})
							</span>
						</div>

						{preps.length > 0 ? (
							<div className="space-y-2">
								{preps.map((prep) => {
									const titleMm = prep.recipe?.name_burmese || prep.recipe?.name_english || "Prep Batch";
									const titleEn = prep.recipe?.name_english || "";

									return (
										<div
											key={prep.id}
											className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between gap-3 hover:bg-emerald-500/10 transition-colors">
											<div className="flex items-center gap-3 min-w-0">
												<div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 overflow-hidden flex items-center justify-center flex-shrink-0">
													{getSafeImageUrl(prep.recipe?.image_url) ? (
														<img
															src={getSafeImageUrl(prep.recipe.image_url)}
															alt={titleEn}
															className="w-full h-full object-cover"
														/>
													) : (
														<Layers className="w-5 h-5 text-emerald-600" />
													)}
												</div>

												<div className="min-w-0">
													<p className="font-bold text-xs leading-relaxed text-emerald-950 dark:text-emerald-200 truncate">
														{titleMm}
													</p>
													<p className="text-[10px] text-base-content/60 truncate">
														{titleEn}
													</p>
													<div className="flex items-center gap-2 text-[10px] text-base-content/50 mt-0.5">
														<span className="flex items-center gap-1">
															<Clock className="w-3 h-3" />
															{format(new Date(prep.created_at), "h:mm a")}
														</span>
														{prep.waste_quantity > 0 && (
															<span className="text-amber-500 font-semibold">
																Trim Waste: {prep.waste_quantity} {prep.unit}
															</span>
														)}
													</div>
												</div>
											</div>

											<div className="flex items-center gap-2 flex-shrink-0">
												<div className="text-right">
													<span className="font-bold text-xs text-base-content block">
														{prep.quantity_produced} {prep.unit}
													</span>
													<span className="badge badge-xs badge-ghost">
														{prep.batches_produced} batch(es)
													</span>
												</div>

												<button
													type="button"
													onClick={() => handleDelete(prep.id, titleEn || titleMm)}
													className="btn btn-ghost btn-xs btn-square text-error"
													title="Delete log">
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<div className="p-8 text-center text-base-content/40 border border-dashed border-base-300 rounded-xl space-y-1">
								<Utensils className="w-6 h-6 mx-auto opacity-30" />
								<p className="text-xs">No batches logged yet for this shift.</p>
							</div>
						)}
					</div>
				)}

				{/* Column 2: Spoilage & Waste */}
				{(activeTab === "all" || activeTab === "spoilages") && (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="font-bold text-xs uppercase tracking-wide text-rose-500 flex items-center gap-1.5">
								<AlertTriangle className="w-4 h-4" /> 🔴 Spoilage & Waste Today ({spoilages.length})
							</span>
						</div>

						{spoilages.length > 0 ? (
							<div className="space-y-2">
								{spoilages.map((item) => {
									const isRecipe = !!item.recipe;
									const target = isRecipe ? item.recipe : item.inventory_item;
									const titleMm = target?.name_burmese || target?.name_english || "Waste Item";
									const titleEn = target?.name_english || "";

									return (
										<div
											key={item.id}
											className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-between gap-3 hover:bg-rose-500/10 transition-colors">
											<div className="flex items-center gap-3 min-w-0">
												<div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 overflow-hidden flex items-center justify-center flex-shrink-0">
													{getSafeImageUrl(item.image_url || target?.image_url) ? (
														<img
															src={getSafeImageUrl(item.image_url || target?.image_url)}
															alt={titleEn}
															className="w-full h-full object-cover"
														/>
													) : (
														<AlertTriangle className="w-5 h-5 text-rose-500" />
													)}
												</div>

												<div className="min-w-0">
													<p className="font-bold text-xs leading-relaxed text-rose-950 dark:text-rose-200 truncate">
														{titleMm}
													</p>
													<p className="text-[10px] text-base-content/60 truncate">
														{titleEn}
													</p>
													<div className="flex items-center gap-2 text-[10px] text-base-content/50 mt-0.5">
														<span className="flex items-center gap-1">
															<Clock className="w-3 h-3" />
															{format(new Date(item.created_at), "h:mm a")}
														</span>
														{item.waste_reason && (
															<span className="badge badge-error badge-xs font-semibold">
																{item.waste_reason}
															</span>
														)}
													</div>
												</div>
											</div>

											<div className="flex items-center gap-2 flex-shrink-0">
												<div className="text-right">
													<span className="font-bold text-xs text-rose-600 dark:text-rose-400 block">
														-{item.waste_quantity} {item.unit}
													</span>
													{item.image_url && (
														<span className="text-[9px] text-base-content/50 flex items-center justify-end gap-0.5">
															<ImageIcon className="w-3 h-3" /> Photo
														</span>
													)}
												</div>

												<button
													type="button"
													onClick={() => handleDelete(item.id, titleEn || titleMm)}
													className="btn btn-ghost btn-xs btn-square text-error"
													title="Delete log">
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<div className="p-8 text-center text-base-content/40 border border-dashed border-base-300 rounded-xl space-y-1">
								<AlertTriangle className="w-6 h-6 mx-auto opacity-30" />
								<p className="text-xs">Zero food waste or spoilage logged today!</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default ShiftDayLedger;
