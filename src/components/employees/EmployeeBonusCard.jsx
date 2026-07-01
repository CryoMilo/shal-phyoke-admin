import { useState } from "react";
import { HeartCrack, ChevronDown, Sparkles } from "lucide-react";

const formatCurrency = (amount) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(Math.floor(amount) || 0);

/**
 * EmployeeBonusCard
 *
 * Leads with the bonus amount and a friendly mood indicator instead of a
 * data table. Absence points are shown as a small row of hearts: one
 * heart = the free pass, hearts "break" as points are used. Technical
 * numbers (penalty %, base share) are tucked behind a "Why?" toggle so
 * the default view stays light and glanceable.
 */
const EmployeeBonusCard = ({
	name,
	position,
	absencePoints,
	penaltyPercentage,
	baseShareAmount,
	estimatedBonus,
}) => {
	const [showDetails, setShowDetails] = useState(false);

	const isPerfect = absencePoints === 0;
	const isPenalized = penaltyPercentage > 0;

	// Mood tier drives the accent color and face
	const mood = isPenalized
		? penaltyPercentage >= 100
			? "low"
			: "mid"
		: "great";

	const moodStyles = {
		great: {
			ring: "ring-2 ring-success/30",
			glow: "bg-success/10",
			face: "😄",
			label: isPerfect ? "Perfect month!" : "On track",
			textColor: "text-success",
		},
		mid: {
			ring: "ring-2 ring-warning/30",
			glow: "bg-warning/10",
			face: "🙂",
			label: "A little dinged",
			textColor: "text-warning",
		},
		low: {
			ring: "ring-2 ring-base-300",
			glow: "bg-base-200",
			face: "😅",
			label: "Tough month",
			textColor: "text-base-content/50",
		},
	};

	const style = moodStyles[mood];

	// Render hearts: 1 free heart always shown solid pink unless used.
	// Each absence point "cracks" a heart, starting from the free one.
	const totalHeartsToShow = Math.max(1, Math.ceil(absencePoints) || 1);
	const hearts = Array.from({ length: totalHeartsToShow }, (_, i) => {
		const pointsUsedByThisHeart = i + 1;
		const isUsed = absencePoints >= pointsUsedByThisHeart - 0.5;
		return isUsed;
	});

	return (
		<div
			className={`card bg-base-100 border border-base-200 shadow-sm transition-all hover:shadow-md ${style.ring}`}>
			<div className="card-body p-5">
				{/* Header: face + name */}
				<div className="flex items-center gap-3 mb-3">
					<div
						className={`w-12 h-12 rounded-full ${style.glow} flex items-center justify-center text-2xl shrink-0`}>
						{style.face}
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-bold text-base leading-tight truncate">
							{name}
						</h3>
						{position && (
							<p className="text-xs text-base-content/50 truncate">
								{position}
							</p>
						)}
					</div>
				</div>

				{/* Hero bonus number */}
				<div className="text-center py-3">
					<div className="text-3xl font-extrabold text-primary tabular-nums">
						฿{formatCurrency(estimatedBonus)}
					</div>
					<p className={`text-xs font-semibold mt-1 ${style.textColor}`}>
						{style.label}
					</p>
				</div>

				{/* Absence hearts */}
				<div className="flex items-center justify-center gap-1.5 py-2">

					{absencePoints === 0 ? (
						<span className="text-xs text-base-content/50 ml-1 flex items-center gap-1">
							<Sparkles className="w-3.5 h-3.5" />
							1 free pass untouched
						</span>
					) :
						hearts.map((used, i) => (
							<HeartCrack
								key={i}
								className="stroke-red-500 stroke-2"
							/>
						))
					}
				</div>

				{/* Why toggle */}
				<button
					onClick={() => setShowDetails(!showDetails)}
					className="btn btn-ghost btn-xs w-full mt-1 gap-1 text-base-content/50">
					Why?
					<ChevronDown
						className={`w-3.5 h-3.5 transition-transform ${showDetails ? "rotate-180" : ""
							}`}
					/>
				</button>

				{showDetails && (
					<div className="mt-2 pt-3 border-t border-base-200 space-y-1.5 text-xs text-base-content/60">
						<div className="flex justify-between">
							<span>Equal base share</span>
							<span className="font-mono">
								฿{formatCurrency(baseShareAmount)}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Absence points this month</span>
							<span className="font-mono">{absencePoints}</span>
						</div>
						<div className="flex justify-between">
							<span>Penalty applied</span>
							<span className="font-mono">{penaltyPercentage}%</span>
						</div>
						{isPenalized && (
							<p className="pt-1 text-base-content/50 italic">
								The amount held back gets shared among teammates with a clean
								record this month.
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default EmployeeBonusCard;