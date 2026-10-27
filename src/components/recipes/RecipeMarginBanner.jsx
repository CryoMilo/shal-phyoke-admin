// src/components/recipes/RecipeMarginBanner.jsx
import React from "react";
import { TrendingUp, AlertTriangle, CheckCircle, Percent } from "lucide-react";

const RecipeMarginBanner = ({ sellingPrice, explodedCost }) => {
	const price = Number(sellingPrice) || 0;
	const cost = Number(explodedCost) || 0;
	const profit = Math.round((price - cost) * 100) / 100;
	const marginPercent = price > 0 ? Math.round((profit / price) * 1000) / 10 : 0;

	// Color-coded margin categories:
	// > 65% : Healthy / Green
	// 50% - 65% : Fair / Amber
	// < 50% : Warning / Red
	let statusBadge = {
		color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
		badge: "badge-success",
		icon: CheckCircle,
		label: "Healthy Margin (>65%)",
	};

	if (marginPercent < 50) {
		statusBadge = {
			color: "text-rose-500 bg-rose-500/10 border-rose-500/30",
			badge: "badge-error",
			icon: AlertTriangle,
			label: "Low Margin (<50%)",
		};
	} else if (marginPercent <= 65) {
		statusBadge = {
			color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
			badge: "badge-warning",
			icon: TrendingUp,
			label: "Moderate Margin (50-65%)",
		};
	}

	const StatusIcon = statusBadge.icon;

	return (
		<div className={`p-4 rounded-2xl border transition-all ${statusBadge.color}`}>
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<StatusIcon className="w-5 h-5 flex-shrink-0" />
					<div>
						<h4 className="font-bold text-sm tracking-wide uppercase">
							Profitability & Live BOM Margin (အမြတ်အစွန်း တွက်ချက်မှု)
						</h4>
						<p className="text-xs opacity-80">
							Exploded live raw ingredient cost vs POS menu selling price
						</p>
					</div>
				</div>

				<span className={`badge ${statusBadge.badge} badge-sm font-semibold`}>
					{statusBadge.label}
				</span>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-current/15">
				{/* Selling Price */}
				<div className="bg-base-100/70 dark:bg-base-300/40 p-2.5 rounded-xl border border-base-200">
					<span className="text-[11px] text-base-content/60 font-medium block">
						Selling Price (ရောင်းဈေး)
					</span>
					<span className="text-lg font-black text-base-content">
						฿{price.toFixed(2)}
					</span>
				</div>

				{/* Exploded BOM Cost */}
				<div className="bg-base-100/70 dark:bg-base-300/40 p-2.5 rounded-xl border border-base-200">
					<span className="text-[11px] text-base-content/60 font-medium block">
						Recipe Cost (ကုန်ကျစရိတ်)
					</span>
					<span className="text-lg font-black text-rose-500 dark:text-rose-400">
						฿{cost.toFixed(2)}
					</span>
				</div>

				{/* Gross Profit */}
				<div className="bg-base-100/70 dark:bg-base-300/40 p-2.5 rounded-xl border border-base-200">
					<span className="text-[11px] text-base-content/60 font-medium block">
						Gross Profit (အမြတ်)
					</span>
					<span className={`text-lg font-black ${profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
						฿{profit.toFixed(2)}
					</span>
				</div>

				{/* Gross Margin % */}
				<div className="bg-base-100/70 dark:bg-base-300/40 p-2.5 rounded-xl border border-base-200">
					<span className="text-[11px] text-base-content/60 font-medium block">
						Margin (အမြတ်ရာခိုင်နှုန်း)
					</span>
					<div className="flex items-center gap-1">
						<Percent className="w-4 h-4 text-current/80" />
						<span className="text-lg font-black">{marginPercent}%</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RecipeMarginBanner;
