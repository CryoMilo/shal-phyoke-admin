import { useEffect, useState } from "react";
import { Users, CalendarDays, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { PageHeader } from "../../components/common/PageHeader";
import { Loading } from "../../components/common/Loading";
import useBonusStore from "../../stores/bonusStore";
import PiggyBank from "./PiggyBank";
import EmployeeBonusCard from "./EmployeeBonusCard";
import ResetConfirmationModal from "./ResetConfirmationModal";

const BonusTracker = () => {
	const {
		loading,
		resetting,
		bonuses,
		summary,
		fetchMonthlyBonuses,
		resetBonuses,
	} = useBonusStore();

	const [selectedDate, setSelectedDate] = useState(new Date());
	const [showResetModal, setShowResetModal] = useState(false);

	useEffect(() => {
		fetchMonthlyBonuses(selectedDate);
	}, [selectedDate, fetchMonthlyBonuses]);

	const monthLabel = format(selectedDate, "MMMM yyyy");

	const handleNavigateMonth = (direction) => {
		setSelectedDate((prev) => (direction > 0 ? addMonths(prev, 1) : subMonths(prev, 1)));
	};

	const handleConfirmReset = async () => {
		await resetBonuses();
		setShowResetModal(false);
	};

	if (loading && bonuses.length === 0) {
		return <Loading message="Counting the coins..." />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6 max-w-5xl">
			<PageHeader
				title="Bonus Tracker"
				description={
					<div className="flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-1.5 bg-base-200/60 px-3 py-1.5 rounded-xl border border-base-300">
							<CalendarDays className="w-4 h-4 text-base-content/60" />
							<span className="font-semibold text-sm">{monthLabel}</span>
							<div className="flex items-center gap-0.5 ml-2 border-l border-base-300 pl-1.5">
								<button
									type="button"
									onClick={() => handleNavigateMonth(-1)}
									className="btn btn-ghost btn-xs btn-square"
									title="Previous month"
									aria-label="Previous month"
								>
									<ChevronLeft className="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onClick={() => handleNavigateMonth(1)}
									className="btn btn-ghost btn-xs btn-square"
									title="Next month"
									aria-label="Next month"
								>
									<ChevronRight className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>

						{summary.isReset && (
							<span className="badge badge-neutral gap-1.5 py-3 px-3 text-xs font-medium">
								<RotateCcw className="w-3 h-3 text-warning" />
								Reset cycle (฿0 pool)
							</span>
						)}
					</div>
				}
				buttons={[
					{
						type: "button",
						label: "Reset Bonuses",
						icon: RotateCcw,
						onClick: () => setShowResetModal(true),
						variant: "error",
						loading: resetting,
					},
				]}
			/>

			{/* Piggy Bank Hero */}
			<div className="flex flex-col items-center mb-6">
				<PiggyBank
					poolAmount={summary.totalPool}
					caption={
						summary.isReset
							? "Reset • Ready for new bonuses! ✨"
							: summary.totalPool > 0
							? "Growing every day! 🌱"
							: "Awaiting net profit ⏳"
					}
				/>
			</div>

			{summary.isReset ? (
				<div className="alert alert-info text-sm p-4 rounded-xl mb-6 shadow-sm border border-info/20 flex items-start gap-3">
					<RotateCcw className="w-5 h-5 text-info shrink-0 mt-0.5" />
					<div>
						<p className="font-semibold">Bonus pool has been reset</p>
						<p className="text-xs opacity-80 mt-0.5">
							{summary.resetAt
								? `Reset on ${format(new Date(summary.resetAt), "dd MMMM yyyy, h:mm a")}. New bonuses will accumulate as completed orders generate profit.`
								: "Bonuses have been reset to ฿0.00. New bonuses will accumulate as completed orders generate profit."}
						</p>
					</div>
				</div>
			) : summary.isAtLoss ? (
				<div className="alert alert-warning text-sm p-4 rounded-xl mb-6 shadow-sm border border-warning/20 flex items-start gap-3">
					<span className="text-xl">⚠️</span>
					<p>
						Month currently operating at a net loss — bonus pool will accumulate once revenue exceeds prorated overheads.
					</p>
				</div>
			) : null}

			{/* Employee Cards */}
			<div className="flex items-center gap-2 mb-4">
				<Users className="w-5 h-5 text-base-content/60" />
				<h2 className="text-lg font-bold">Your team's shares</h2>
			</div>

			{bonuses.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{bonuses.map((log) => (
						<EmployeeBonusCard
							key={log.id}
							name={log.employee?.name || "Unknown"}
							position={log.employee?.position || ""}
							absencePoints={log.absence_points || 0}
							penaltyPercentage={log.penalty_percentage || 0}
							baseShareAmount={log.base_bonus_amount || 0}
							estimatedBonus={log.final_bonus_amount || 0}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-12 bg-base-100 rounded-lg border border-base-200">
					<Users className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
					<p className="text-base-content/60 text-lg mb-2">No active employees</p>
					<p className="text-sm text-base-content/40">
						Bonus shares will appear here once employees are added
					</p>
				</div>
			)}

			<p className="text-xs text-base-content/40 text-center mt-8">
				Numbers update automatically as sales are completed. Use the Reset Bonuses button to reset after paying salaries.
			</p>

			<ResetConfirmationModal
				isOpen={showResetModal}
				onClose={() => setShowResetModal(false)}
				onConfirm={handleConfirmReset}
				loading={resetting}
			/>
		</div>
	);
};

export default BonusTracker;