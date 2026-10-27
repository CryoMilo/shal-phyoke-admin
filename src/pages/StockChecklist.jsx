// src/pages/StockChecklist.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
	ClipboardCheck,
	Search,
	Check,
	RotateCcw,
	AlertTriangle,
	CheckCircle2,
	Package,
	Plus,
	Minus,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Loading } from "../components/common/Loading";
import useInventoryStore from "../stores/inventoryStore";
import { showToast } from "../utils/toastUtils";

const COMMON_DISCREPANCY_REASONS = [
	"Physical Count Discrepancy",
	"Spoilage / Rotting",
	"Dropped / Spilled",
	"Expired",
	"Over-portioning in service",
	"Storage temperature failure",
	"Unrecorded kitchen test",
	"Other / Unaccounted",
];

const StockChecklist = () => {
	const { inventoryItems, fetchInventoryItems, submitStockChecklist, loading } =
		useInventoryStore();

	const [filterType, setFilterType] = useState("all"); // 'all' | 'ingredient' | 'packaging' | 'operational_supply'
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [onlyDiscrepancies, setOnlyDiscrepancies] = useState(false);
	const [counts, setCounts] = useState({});
	const [reasons, setReasons] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Load inventory items on mount
	useEffect(() => {
		fetchInventoryItems();
	}, [fetchInventoryItems]);

	// Initialize entered counts with current theoretical quantities
	useEffect(() => {
		if (inventoryItems.length > 0) {
			setCounts((prev) => {
				const next = { ...prev };
				inventoryItems.forEach((item) => {
					if (next[item.id] === undefined) {
						next[item.id] = String(item.quantity ?? 0);
					}
				});
				return next;
			});
		}
	}, [inventoryItems]);

	// Extract unique categories for current filter type
	const availableCategories = useMemo(() => {
		const cats = new Set();
		inventoryItems.forEach((item) => {
			if (
				filterType === "all" ||
				(item.item_type || "ingredient") === filterType
			) {
				if (item.category) cats.add(item.category);
			}
		});
		return Array.from(cats).sort();
	}, [inventoryItems, filterType]);

	// Filter items
	const filteredItems = useMemo(() => {
		return inventoryItems.filter((item) => {
			const itemType = item.item_type || "ingredient";
			if (filterType !== "all" && itemType !== filterType) {
				return false;
			}

			if (selectedCategory !== "all" && item.category !== selectedCategory) {
				return false;
			}

			const query = searchQuery.trim().toLowerCase();
			if (query) {
				const matchEn = item.name_english?.toLowerCase().includes(query);
				const matchMy = item.name_burmese?.toLowerCase().includes(query);
				const matchName = item.name?.toLowerCase().includes(query);
				const matchCat = item.category?.toLowerCase().includes(query);
				if (!matchEn && !matchMy && !matchName && !matchCat) {
					return false;
				}
			}

			if (onlyDiscrepancies) {
				const entered = parseFloat(counts[item.id]);
				const sysQty = item.quantity ?? 0;
				if (isNaN(entered) || entered === sysQty) {
					return false;
				}
			}

			return true;
		});
	}, [inventoryItems, filterType, selectedCategory, searchQuery, onlyDiscrepancies, counts]);

	// Statistics
	const stats = useMemo(() => {
		let totalCounted = 0;
		let matchCount = 0;
		let discrepancyCount = 0;
		let netVarianceCost = 0;

		inventoryItems.forEach((item) => {
			const rawVal = counts[item.id];
			if (rawVal !== undefined && rawVal !== "") {
				const num = parseFloat(rawVal);
				if (!isNaN(num)) {
					totalCounted++;
					const sysQty = item.quantity ?? 0;
					const diff = num - sysQty;
					if (Math.abs(diff) < 0.0001) {
						matchCount++;
					} else {
						discrepancyCount++;
						netVarianceCost += diff * (item.cost_per_unit || 0);
					}
				}
			}
		});

		return {
			total: inventoryItems.length,
			counted: totalCounted,
			matches: matchCount,
			discrepancies: discrepancyCount,
			netVarianceCost: Math.round(netVarianceCost * 100) / 100,
		};
	}, [inventoryItems, counts]);

	// Stepper increment / decrement
	const handleStep = (itemId, delta) => {
		setCounts((prev) => {
			const currentVal = parseFloat(prev[itemId]);
			const base = isNaN(currentVal) ? 0 : currentVal;
			const nextVal = Math.max(0, Math.round((base + delta) * 100) / 100);
			return { ...prev, [itemId]: String(nextVal) };
		});
	};

	const handleCountChange = (itemId, val) => {
		setCounts((prev) => ({ ...prev, [itemId]: val }));
	};

	const handleMatchExpected = (itemId, expectedQty) => {
		setCounts((prev) => ({ ...prev, [itemId]: String(expectedQty) }));
	};

	const handleMatchAll = () => {
		const nextCounts = {};
		inventoryItems.forEach((item) => {
			nextCounts[item.id] = String(item.quantity ?? 0);
		});
		setCounts(nextCounts);
		showToast.info("Filled all with system expected counts");
	};

	const handleResetCounts = () => {
		const nextCounts = {};
		inventoryItems.forEach((item) => {
			nextCounts[item.id] = String(item.quantity ?? 0);
		});
		setCounts(nextCounts);
		setReasons({});
		showToast.info("Counts reset to theoretical baseline");
	};

	const handleSubmit = async (e) => {
		if (e) e.preventDefault();
		setIsSubmitting(true);
		try {
			const result = await submitStockChecklist(counts, reasons);
			if (result?.success) {
				setReasons({});
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading && inventoryItems.length === 0) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6 space-y-4 pb-28 md:pb-12">
			{/* Reusable PageHeader */}
			<PageHeader
				title="Daily Stock Checklist"
				description="Record physical closing counts. Discrepancy loss is automatically calculated and recorded in the audit ledger."
				icon={ClipboardCheck}
				buttons={[
					{
						type: "button",
						label: "Match Expected",
						shortlabel: "Match All",
						icon: Check,
						onClick: handleMatchAll,
						variant: "outline",
					},
					{
						type: "button",
						label: "Reset Counts",
						shortlabel: "Reset",
						icon: RotateCcw,
						onClick: handleResetCounts,
						variant: "ghost",
					},
					{
						type: "button",
						label: isSubmitting
							? "Saving..."
							: stats.discrepancies > 0
							? `Submit (${stats.discrepancies} Variances)`
							: "Submit Shift Count",
						shortlabel: isSubmitting ? "Saving..." : "Submit",
						icon: ClipboardCheck,
						onClick: () => handleSubmit(),
						variant: "primary",
						disabled: isSubmitting,
					},
				]}
			/>

			{/* Shift Summary Metrics Card */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				<div className="p-3.5 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex flex-col justify-between">
					<span className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider">
						Total Items
					</span>
					<div className="flex items-baseline gap-1.5 mt-1">
						<span className="text-2xl font-black text-base-content">
							{stats.counted}
						</span>
						<span className="text-xs font-semibold text-base-content/50">
							/ {stats.total} counted
						</span>
					</div>
				</div>

				<div className="p-3.5 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex flex-col justify-between">
					<span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
						<CheckCircle2 className="w-3.5 h-3.5" />
						Matching Stock
					</span>
					<div className="flex items-baseline gap-1.5 mt-1">
						<span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
							{stats.matches}
						</span>
						<span className="text-xs font-semibold text-base-content/50">
							items verified
						</span>
					</div>
				</div>

				<div className="p-3.5 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex flex-col justify-between">
					<span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
						<AlertTriangle className="w-3.5 h-3.5" />
						Variances Found
					</span>
					<div className="flex items-baseline gap-1.5 mt-1">
						<span className="text-2xl font-black text-amber-600 dark:text-amber-400">
							{stats.discrepancies}
						</span>
						<span className="text-xs font-semibold text-base-content/50">
							to be audited
						</span>
					</div>
				</div>

				<div className="p-3.5 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex flex-col justify-between">
					<span className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider">
						Variance Cost
					</span>
					<div className="flex items-baseline gap-1 mt-1">
						<span
							className={`text-2xl font-black ${
								stats.netVarianceCost < 0
									? "text-error"
									: stats.netVarianceCost > 0
									? "text-amber-500"
									: "text-base-content"
							}`}>
							{stats.netVarianceCost < 0
								? `-฿${Math.abs(stats.netVarianceCost).toFixed(2)}`
								: `฿${stats.netVarianceCost.toFixed(2)}`}
						</span>
					</div>
				</div>
			</div>

			{/* Navigation & Station Filters */}
			<div className="card bg-base-100 shadow-sm border border-base-200">
				<div className="card-body p-3 sm:p-4 space-y-3">
					{/* Top Level Item Type Classification */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
						<div className="tabs tabs-boxed bg-base-200 p-1 rounded-xl text-xs flex-wrap self-start">
							<button
								type="button"
								onClick={() => {
									setFilterType("all");
									setSelectedCategory("all");
								}}
								className={`tab tab-sm font-bold ${
									filterType === "all"
										? "tab-active !bg-primary !text-primary-content shadow-sm"
										: ""
								}`}>
								All Items
							</button>
							<button
								type="button"
								onClick={() => {
									setFilterType("ingredient");
									setSelectedCategory("all");
								}}
								className={`tab tab-sm font-bold ${
									filterType === "ingredient"
										? "tab-active !bg-primary !text-primary-content shadow-sm"
										: ""
								}`}>
								Ingredients
							</button>
							<button
								type="button"
								onClick={() => {
									setFilterType("packaging");
									setSelectedCategory("all");
								}}
								className={`tab tab-sm font-bold ${
									filterType === "packaging"
										? "tab-active !bg-primary !text-primary-content shadow-sm"
										: ""
								}`}>
								Packaging
							</button>
							<button
								type="button"
								onClick={() => {
									setFilterType("operational_supply");
									setSelectedCategory("all");
								}}
								className={`tab tab-sm font-bold ${
									filterType === "operational_supply"
										? "tab-active !bg-primary !text-primary-content shadow-sm"
										: ""
								}`}>
								Supplies
							</button>
						</div>

						{/* Quick Discrepancy Toggle */}
						<label className="flex items-center gap-2 cursor-pointer text-xs font-semibold self-end sm:self-auto">
							<input
								type="checkbox"
								checked={onlyDiscrepancies}
								onChange={(e) => setOnlyDiscrepancies(e.target.checked)}
								className="checkbox checkbox-primary checkbox-xs"
							/>
							<span>Show Discrepancies Only ({stats.discrepancies})</span>
						</label>
					</div>

					{/* Category Filter Pills (if multiple categories available) */}
					{availableCategories.length > 0 && (
						<div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
							<button
								type="button"
								onClick={() => setSelectedCategory("all")}
								className={`btn btn-xs rounded-lg font-semibold ${
									selectedCategory === "all"
										? "btn-neutral"
										: "btn-ghost bg-base-200/60"
								}`}>
								All Categories
							</button>
							{availableCategories.map((cat) => (
								<button
									key={cat}
									type="button"
									onClick={() => setSelectedCategory(cat)}
									className={`btn btn-xs rounded-lg font-semibold whitespace-nowrap ${
										selectedCategory === cat
											? "btn-neutral"
											: "btn-ghost bg-base-200/60"
									}`}>
									{cat}
								</button>
							))}
						</div>
					)}

					{/* Search Bar */}
					<div className="relative">
						<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
						<input
							type="text"
							placeholder="Search by item name or category..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="input input-bordered input-sm w-full pl-9"
						/>
					</div>
				</div>
			</div>

			{/* Checklist Item Cards List */}
			<div className="space-y-2.5">
				{filteredItems.map((item) => {
					const currentVal = counts[item.id] ?? "";
					const enteredNum = parseFloat(currentVal);
					const sysQty = item.quantity ?? 0;
					const isValid = currentVal !== "" && !isNaN(enteredNum);
					const diff = isValid ? Math.round((enteredNum - sysQty) * 100) / 100 : 0;
					const hasDiff = isValid && Math.abs(diff) > 0.0001;
					const stepDelta = item.unit === "kg" || item.unit === "liter" ? 0.5 : 1;

					return (
						<div
							key={item.id}
							className={`card bg-base-100 border transition-all shadow-sm ${
								hasDiff
									? "border-amber-500/50 bg-amber-500/[0.02]"
									: "border-base-200 hover:border-base-300"
							}`}>
							<div className="p-3.5 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
								{/* Item Info */}
								<div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
									<div className="w-11 h-11 rounded-xl bg-base-200 border border-base-300 flex items-center justify-center flex-shrink-0">
										<Package className="w-5 h-5 text-base-content/40" />
									</div>

									<div className="min-w-0 flex-1">
										<div className="flex items-baseline gap-2 flex-wrap">
											<h4 className="font-bold text-sm text-base-content">
												{item.name_english || item.name}
											</h4>
											{item.item_type === "packaging" ? (
												<span className="badge badge-xs bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-semibold">
													Packaging
												</span>
											) : item.item_type === "operational_supply" ? (
												<span className="badge badge-xs bg-amber-500/10 text-amber-500 border-amber-500/20 font-semibold">
													Supply
												</span>
											) : (
												<span className="badge badge-ghost badge-xs">
													{item.category || "Ingredient"}
												</span>
											)}
										</div>

										{item.name_burmese && item.name_burmese !== item.name_english && (
											<p className="text-xs text-base-content/60 font-normal truncate mt-0.5">
												{item.name_burmese}
											</p>
										)}

										<div className="flex items-center gap-2 text-xs text-base-content/60 mt-1">
											<span>
												Unit: <strong className="text-base-content">{item.unit}</strong>
											</span>
											{item.cost_per_unit > 0 && (
												<span>
													• ฿{Number(item.cost_per_unit).toFixed(2)}/{item.unit}
												</span>
											)}
										</div>
									</div>
								</div>

								{/* Mobile Friendly Stepper Controls & System Expected */}
								<div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-base-200">
									{/* System Expected Reference */}
									<div className="text-left md:text-right min-w-[70px]">
										<span className="text-[10px] uppercase font-bold text-base-content/50 block">
											Expected
										</span>
										<span className="text-sm font-bold text-base-content">
											{sysQty} <span className="text-xs font-normal text-base-content/60">{item.unit}</span>
										</span>
									</div>

									{/* Large Stepper Control Group (Tap Friendly) */}
									<div className="flex items-center bg-base-200/90 rounded-2xl p-1 shadow-inner border border-base-300">
										{/* Minus Button */}
										<button
											type="button"
											onClick={() => handleStep(item.id, -stepDelta)}
											className="btn btn-sm sm:btn-md btn-square btn-ghost bg-base-100 hover:bg-base-300 shadow-sm rounded-xl touch-manipulation active:scale-95 transition-transform"
											title={`Decrease by ${stepDelta}`}>
											<Minus className="w-4 h-4 text-base-content" />
										</button>

										{/* Input Box */}
										<div className="w-16 sm:w-20 text-center px-1">
											<input
												type="text"
												inputMode="decimal"
												value={currentVal}
												onChange={(e) => handleCountChange(item.id, e.target.value)}
												placeholder={String(sysQty)}
												className="w-full text-center bg-transparent border-none font-black text-base text-base-content focus:outline-none p-0"
											/>
										</div>

										{/* Plus Button */}
										<button
											type="button"
											onClick={() => handleStep(item.id, stepDelta)}
											className="btn btn-sm sm:btn-md btn-square btn-ghost bg-base-100 hover:bg-base-300 shadow-sm rounded-xl touch-manipulation active:scale-95 transition-transform"
											title={`Increase by ${stepDelta}`}>
											<Plus className="w-4 h-4 text-base-content" />
										</button>
									</div>

									{/* Quick Snap to Expected */}
									<button
										type="button"
										onClick={() => handleMatchExpected(item.id, sysQty)}
										className="btn btn-sm btn-ghost btn-square text-base-content/40 hover:text-primary"
										title="Snap to expected quantity">
										<Check className="w-4 h-4" />
									</button>

									{/* Discrepancy Status Badge */}
									<div className="min-w-[75px] text-right">
										{hasDiff ? (
											<span
												className={`badge badge-sm font-bold shadow-sm ${
													diff < 0 ? "badge-error" : "badge-warning"
												}`}>
												{diff > 0 ? `+${diff}` : `${diff}`}
											</span>
										) : (
											<span className="badge badge-success badge-sm badge-outline font-semibold">
												Match
											</span>
										)}
									</div>
								</div>
							</div>

							{/* Optional Reason Tag Drawer (shows when discrepancy exists) */}
							{hasDiff && (
								<div className="px-3.5 pb-3 pt-1 border-t border-amber-500/20 bg-amber-500/5">
									<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
										<div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
											<AlertTriangle className="w-3.5 h-3.5" />
											<span>
												Estimated variance loss:{" "}
												<strong>
													฿{Math.abs(Math.round(diff * (item.cost_per_unit || 0) * 100) / 100).toFixed(2)}
												</strong>
											</span>
										</div>

										<div className="flex items-center gap-2 w-full sm:w-auto">
											<select
												value={reasons[item.id] || COMMON_DISCREPANCY_REASONS[0]}
												onChange={(e) =>
													setReasons((prev) => ({
														...prev,
														[item.id]: e.target.value,
													}))
												}
												className="select select-bordered select-xs w-full sm:w-56 text-xs bg-base-100">
												{COMMON_DISCREPANCY_REASONS.map((r) => (
													<option key={r} value={r}>
														{r}
													</option>
												))}
											</select>
										</div>
									</div>
								</div>
							)}
						</div>
					);
				})}

				{filteredItems.length === 0 && (
					<div className="text-center py-12 bg-base-100 rounded-2xl border border-base-200">
						<Package className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
						<p className="text-base-content/60 font-medium">No items match your filters</p>
					</div>
				)}
			</div>

			{/* Floating Mobile Sticky Footer for 1-Tap Submission */}
			<div className="fixed bottom-0 left-0 right-0 p-3 bg-base-100/95 backdrop-blur-md border-t border-base-200 shadow-2xl z-30 md:hidden flex items-center justify-between gap-3">
				<div>
					<div className="text-xs font-bold text-base-content">
						{stats.discrepancies > 0 ? (
							<span className="text-amber-600 dark:text-amber-400">
								{stats.discrepancies} Variances Found
							</span>
						) : (
							<span className="text-emerald-600 dark:text-emerald-400">
								All Verified Clean
							</span>
						)}
					</div>
					<div className="text-[11px] text-base-content/50">
						{stats.counted} / {stats.total} counted
					</div>
				</div>

				<button
					type="button"
					onClick={() => handleSubmit()}
					disabled={isSubmitting}
					className="btn btn-primary btn-sm px-5 gap-1.5 shadow-md">
					{isSubmitting ? (
						<span className="loading loading-spinner loading-xs"></span>
					) : (
						<ClipboardCheck className="w-4 h-4" />
					)}
					Submit Shift Count
				</button>
			</div>
		</div>
	);
};

export default StockChecklist;
