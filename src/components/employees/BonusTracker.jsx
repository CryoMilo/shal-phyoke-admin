import { useEffect } from "react";
import { Users, CalendarDays } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Loading } from "../../components/common/Loading";
import useBonusStore from "../../stores/bonusStore";
import PiggyBank from "./PiggyBank";
import EmployeeBonusCard from "./EmployeeBonusCard";

const BonusTracker = () => {
	const { loading, totalPool, monthLabel, employeeBonuses, fetchBonusTracker } =
		useBonusStore();

	useEffect(() => {
		fetchBonusTracker();
	}, [fetchBonusTracker]);

	if (loading && employeeBonuses.length === 0) {
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
				<PiggyBank poolAmount={totalPool} caption="Growing every day! 🌱" />
			</div>

			{/* Employee Cards */}
			<div className="flex items-center gap-2 mb-4">
				<Users className="w-5 h-5 text-base-content/60" />
				<h2 className="text-lg font-bold">Your team's shares</h2>
			</div>

			{employeeBonuses.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{employeeBonuses.map((emp) => (
						<EmployeeBonusCard
							key={emp.employeeId}
							name={emp.name}
							position={emp.position}
							absencePoints={emp.absencePoints}
							penaltyPercentage={emp.penaltyPercentage}
							baseShareAmount={emp.baseShareAmount}
							estimatedBonus={emp.estimatedBonus}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-12 bg-base-100 rounded-lg border border-base-200">
					<Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
					<p className="text-gray-500 text-lg mb-2">No active employees</p>
					<p className="text-sm text-gray-400">
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