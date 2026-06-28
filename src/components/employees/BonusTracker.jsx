import { useState, useEffect } from "react";
import { Wallet, Users, TrendingUp, CalendarDays } from "lucide-react";
import { PageHeader } from "../../components/common/PageHeader";
import { Loading } from "../../components/common/Loading";
import useBonusStore from "../../stores/bonusStore";
import ShalPhyokeDatePicker from "../common/ShalPhyokeDatePicker";

const formatCurrency = (amount) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount || 0);

const BonusTracker = () => {
	const [selectedMonth, setSelectedMonth] = useState(new Date());
	const {
		loading,
		totalPool,
		poolPercentage,
		allowedAbsences,
		monthLabel,
		employeeBonuses,
		fetchBonusTracker,
	} = useBonusStore();

	useEffect(() => {
		fetchBonusTracker(selectedMonth);
	}, [selectedMonth, fetchBonusTracker]);

	if (loading && employeeBonuses.length === 0) {
		return <Loading message="Calculating bonus pool..." />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6">
			<PageHeader
				title="Bonus Tracker"
				description={
					<div className="flex items-center gap-2">
						<CalendarDays className="w-4 h-4 text-base-content/50" />
						<span>Estimated bonuses for the selected month</span>
					</div>
				}
			/>

			{/* Date/Month Navigation */}
			<div className="mb-6 flex flex-wrap items-center justify-between bg-base-200/60 rounded-xl p-3 gap-3 border border-base-200">
				<div className="flex items-center gap-2">
					<span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Select Month:</span>
					<ShalPhyokeDatePicker
						mode="month"
						value={selectedMonth}
						onChange={(date) => setSelectedMonth(date)}
						className="w-48 shadow-sm"
					/>
				</div>
				<div className="text-xs text-base-content/50 font-medium">
					Active Configuration: <span className="font-bold text-primary">{poolPercentage}% Pool Share</span> · Allowed absences: <span className="font-bold text-base-content">{allowedAbsences} pts</span>
				</div>
			</div>

			{/* Pool Summary */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<div className="card bg-primary text-primary-content shadow-md">
					<div className="card-body">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-semibold text-primary-content/70 uppercase tracking-wider">
									Current Bonus Pool
								</p>
								<h3 className="text-4xl font-bold mt-1">
									฿{formatCurrency(totalPool)}
								</h3>
								<p className="text-xs text-primary-content/70 mt-2">
									{poolPercentage}% of month-to-date net profit
								</p>
							</div>
							<div className="p-3 bg-white/20 rounded-lg text-white">
								<Wallet className="w-8 h-8" />
							</div>
						</div>
					</div>
				</div>

				{/* <div className="card bg-base-200">
					<div className="card-body">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
									Month-to-Date Profit
								</p>
								<h3 className="text-3xl font-bold mt-1">
									฿{formatCurrency(monthToDateProfit)}
								</h3>
								<p className="text-xs text-base-content/50 mt-2">
									Net of sales, expenses, and daily overhead allocation
								</p>
							</div>
							<div className="p-3 bg-success/10 text-success rounded-lg">
								<TrendingUp className="w-8 h-8" />
							</div>
						</div>
					</div>
				</div> */}
			</div>

			{/* Employee Shares */}
			<div className="flex items-center gap-2 mb-4">
				<Users className="w-5 h-5 text-base-content/60" />
				<h2 className="text-lg font-bold">Employee Bonus Shares</h2>
				<span className="badge badge-outline">{employeeBonuses.length} active</span>
			</div>

			{employeeBonuses.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{employeeBonuses.map((emp) => (
						<div
							key={emp.employeeId}
							className="card bg-base-100 border border-base-200 shadow-sm">
							<div className="card-body p-5">
								<div className="flex justify-between items-start mb-3">
									<div>
										<h3 className="font-bold text-lg leading-tight">
											{emp.name}
										</h3>
										{emp.position && (
											<p className="text-xs text-base-content/50">
												{emp.position}
											</p>
										)}
									</div>
									<span className="badge badge-ghost badge-sm">
										{emp.sharePercentage.toFixed(1)}% share
									</span>
								</div>

								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-base-content/60">Base Share</span>
										<span className="font-mono">
											฿{formatCurrency(emp.baseShareAmount)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-base-content/60">
											Absences this month
										</span>
										<span className="font-medium">
											{emp.absencePoints} pts
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-base-content/60">
											Penalty Applied
										</span>
										<span
											className={`font-medium ${
												emp.penaltyPercentage > 0 ? "text-error" : "text-success"
											}`}>
											{emp.penaltyPercentage}%
										</span>
									</div>
								</div>

								<div className="divider my-2"></div>

								<div className="flex justify-between items-center">
									<span className="font-bold">Estimated Bonus</span>
									<span className="text-xl font-bold text-primary">
										฿{formatCurrency(emp.estimatedBonus)}
									</span>
								</div>
							</div>
						</div>
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
				Figures update automatically as new sales and expenses are recorded. Final
				amounts are confirmed at month-end.
			</p>
		</div>
	);
};

export default BonusTracker;