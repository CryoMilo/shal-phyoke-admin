import { Calendar, BanknoteArrowUp, DollarSign, Receipt } from "lucide-react";

export const SummaryCards = ({ salesData }) => {
	// Today's overhead cost (daily portion of monthly overheads)
	const todayOverheadCost = salesData.dailyOverheadCost || 0;

	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
			{/* Today's Income */}
			<div className="card bg-base-200">
				<div className="card-body">
					<div className="flex items-center">
						<div className="avatar placeholder">
							<div className="bg-success/20 text-success rounded-full w-12 grid place-content-center place-items-center">
								<DollarSign className="w-6 h-6" />
							</div>
						</div>
						<div className="ml-4">
							<h3 className="text-sm font-medium text-base-content/70">
								Today's Income
							</h3>
							<p className="text-2xl font-bold">
								฿{salesData.totalIncome.toFixed(2)}
							</p>
							<div className="flex gap-2 mt-1">
								<span className="badge badge-sm badge-success">
									Cash: ฿{salesData.cashSales.toFixed(2)}
								</span>
								<span className="badge badge-sm badge-info">
									QR: ฿{salesData.qrSales.toFixed(2)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Today's Daily Expenses */}
			<div className="card bg-base-200">
				<div className="card-body">
					<div className="flex items-center">
						<div className="avatar placeholder">
							<div className="bg-error/20 text-error rounded-full w-12 grid place-content-center place-items-center">
								<Receipt className="w-6 h-6" />
							</div>
						</div>
						<div className="ml-4">
							<h3 className="text-sm font-medium text-base-content/70">
								Daily Expenses
							</h3>
							<p className="text-2xl font-bold text-error">
								฿{salesData.totalDailyExpenses.toFixed(2)}
							</p>
							<div className="flex gap-1 mt-1">
								<span className="badge badge-xs">
									{salesData.dailyExpenses?.length || 0} items
								</span>
								<span className="text-xs text-gray-500">
									{salesData.totalIncome > 0
										? (
												(salesData.totalDailyExpenses / salesData.totalIncome) *
												100
											).toFixed(1) + "%"
										: "0%"}{" "}
									of income
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Today's Overhead Cost */}
			<div className="card bg-base-200">
				<div className="card-body">
					<div className="flex items-center">
						<div className="avatar placeholder">
							<div className="bg-warning/20 text-warning rounded-full w-12 grid place-content-center place-items-center">
								<Calendar className="w-6 h-6" />
							</div>
						</div>
						<div className="ml-4">
							<h3 className="text-sm font-medium text-base-content/70">
								Overhead Cost
							</h3>
							<p className="text-2xl font-bold text-warning">
								฿{todayOverheadCost.toFixed(2)}
							</p>
							<div className="space-y-1">
								<div className="flex justify-between text-xs">
									<span>Monthly Total:</span>
									<span className="font-medium">
										฿{salesData.totalMonthlyOverheads?.toFixed(2) || "0.00"}
									</span>
								</div>
								<div className="flex justify-between text-xs">
									<span>Pending:</span>
									<span className="font-medium">
										฿{salesData.pendingOverheads?.toFixed(2) || "0.00"}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Net Profit */}
			<div className="card bg-base-200">
				<div className="card-body">
					<div className="flex items-center">
						<div className="avatar placeholder">
							<div
								className={`${salesData.netProfit >= 0 ? "bg-primary/20 text-primary" : "bg-error/20 text-error"} rounded-full w-12 grid place-content-center place-items-center`}>
								<BanknoteArrowUp className="w-6 h-6" />
							</div>
						</div>
						<div className="ml-4">
							<h3 className="text-sm font-medium text-base-content/70">
								Net Profit
							</h3>
							<p
								className={`text-2xl font-bold ${salesData.netProfit >= 0 ? "text-primary" : "text-error"}`}>
								฿{salesData.netProfit.toFixed(2)}
							</p>
							<div className="flex gap-2 mt-1">
								<span className="badge badge-sm badge-primary">
									Margin: {salesData.profitMargin.toFixed(1)}%
								</span>
								{salesData.netProfit < 0 && (
									<span className="badge badge-sm badge-error">Loss</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
