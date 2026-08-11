import { useEffect, useState } from "react";
import { Users, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "../../components/common/PageHeader";
import { Loading } from "../../components/common/Loading";
import useBonusStore from "../../stores/bonusStore";
import PiggyBank from "./PiggyBank";
import EmployeeBonusCard from "./EmployeeBonusCard";

const BonusTracker = () => {
	const { loading, bonuses, summary, fetchMonthlyBonuses } = useBonusStore();
	const [selectedDate] = useState(new Date());

	useEffect(() => {
		fetchMonthlyBonuses(selectedDate);
	}, [selectedDate, fetchMonthlyBonuses]);

	const monthLabel = format(selectedDate, "MMMM yyyy");

	if (loading && bonuses.length === 0) {
		return <Loading message="Counting the coins..." />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6 max-w-5xl">
			<PageHeader
				title="Bonus Tracker"
				description={
					<div className="flex items-center gap-2">
						<CalendarDays className="w-4 h-4 text-base-content/50" />
						<span>{monthLabel}</span>
					</div>
				}
			/>

			{/* Piggy Bank Hero */}
			<div className="flex flex-col items-center mb-6">
				<PiggyBank poolAmount={summary.totalPool} caption="Growing every day! 🌱" />
			</div>

			{summary.isAtLoss && (
				<div className="alert alert-warning text-sm p-4 rounded-xl mb-6 shadow-sm border border-warning/20 flex items-start gap-3">
					<span className="text-xl">⚠️</span>
					<p>
						Month currently operating at a net loss — bonus pool will accumulate once revenue exceeds prorated overheads.
					</p>
				</div>
			)}

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
							absencePoints={log.absence_points}
							penaltyPercentage={log.penalty_percentage}
							baseShareAmount={log.base_bonus_amount}
							estimatedBonus={log.final_bonus_amount}
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
				Numbers update automatically as the month goes on. Final amounts are
				confirmed at month-end.
			</p>
		</div>
	);
};

export default BonusTracker;