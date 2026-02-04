import {
	BanknoteArrowUp,
	DollarSign,
	Receipt,
	TrendingDown,
	AlertTriangle,
} from "lucide-react";

export const SummaryCards = ({ salesData }) => {
	// Calculate expense percentage of income
	const expensePercentage =
		salesData.totalIncome > 0
			? (salesData.totalExpenses / salesData.totalIncome) * 100
			: 0;

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

			{/* Today's Expenses */}
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
								Today's Expenses
							</h3>
							<p className="text-2xl font-bold">
								฿{salesData.totalExpenses.toFixed(2)}
							</p>
							<div className="flex items-center gap-1 mt-1">
								<TrendingDown className="w-3 h-3 text-error" />
								<span className="text-xs text-base-content/50">
									{expensePercentage.toFixed(1)}% of income
								</span>
							</div>
							{salesData.cashVariance !== 0 &&
								Math.abs(salesData.cashVariance) > 10 && (
									<div className="flex items-center gap-1 mt-1 text-xs">
										<AlertTriangle className="w-3 h-3 text-warning" />
										<span className="text-warning">
											Cash variance: ฿{salesData.cashVariance.toFixed(2)}
										</span>
									</div>
								)}
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

			{/* Cash Position */}
			<div className="card bg-base-200">
				<div className="card-body">
					<div className="flex items-center">
						<div className="avatar placeholder">
							<div
								className={`${salesData.cashVariance === 0 ? "bg-success/20 text-success" : "bg-warning/20 text-warning"} rounded-full w-12 grid place-content-center place-items-center`}>
								<DollarSign className="w-6 h-6" />
							</div>
						</div>
						<div className="ml-4">
							<h3 className="text-sm font-medium text-base-content/70">
								Cash Position
							</h3>
							<div className="space-y-1">
								<p className="text-lg font-bold">
									Collected: ฿
									{(salesData.dailyCash?.cash_collected || 0).toFixed(2)}
								</p>
								<p className="text-sm">
									Deposited: ฿
									{(salesData.dailyCash?.cash_deposited || 0).toFixed(2)}
								</p>
								{salesData.cashVariance !== 0 && (
									<div
										className={`badge badge-sm ${salesData.cashVariance < 0 ? "badge-error" : "badge-success"}`}>
										{salesData.cashVariance < 0 ? "Short" : "Over"}: ฿
										{Math.abs(salesData.cashVariance).toFixed(2)}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
