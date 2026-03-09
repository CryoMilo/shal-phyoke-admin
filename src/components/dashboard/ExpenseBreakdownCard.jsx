// components/dashboard/ExpenseBreakdownCard.jsx
import { TrendingDown, Calendar, AlertCircle } from "lucide-react";

export const ExpenseBreakdownCard = ({ salesData }) => {
	const todayOverheadCost = salesData.dailyOverheadCost || 0;
	const totalExpenses = salesData.totalDailyExpenses + todayOverheadCost;

	// Format expense categories for display
	const formatCategory = (category) => {
		const categories = {
			ingredients: "Ingredients",
			utilities: "Utilities",
			equipment: "Equipment",
			packaging: "Packaging",
			delivery: "Delivery",
			marketing: "Marketing",
			maintenance: "Maintenance",
			gas: "Gas",
			rent: "Rent",
			salaries: "Salaries",
			other: "Other",
		};
		return categories[category] || category;
	};

	return (
		<div className="card bg-base-200">
			<div className="card-body">
				<div className="flex justify-between items-center mb-4">
					<h3 className="card-title">Expense Breakdown</h3>
					<span className="badge badge-error">
						Total: Ks{totalExpenses.toFixed(2)}
					</span>
				</div>

				{/* Expense Distribution */}
				<div className="space-y-4">
					{/* Daily Expenses */}
					<div>
						<div className="flex justify-between items-center mb-2">
							<h4 className="font-semibold flex items-center gap-2">
								<TrendingDown className="w-4 h-4 text-error" />
								Daily Expenses
								<span className="badge badge-sm">
									Ks{salesData.totalDailyExpenses.toFixed(2)}
								</span>
							</h4>
							<span className="text-sm text-gray-500">
								{salesData.dailyExpenses?.length || 0} items
							</span>
						</div>

						{salesData.dailyExpenses?.length > 0 ? (
							<div className="space-y-2">
								{Object.entries(salesData.dailyExpenseByCategory || {})
									.filter(([, amount]) => amount > 0)
									.slice(0, 3)
									.map(([category, amount]) => (
										<div key={category} className="space-y-1">
											<div className="flex justify-between text-sm">
												<span>{formatCategory(category)}</span>
												<span className="font-medium">
													Ks{amount.toFixed(2)}
												</span>
											</div>
											<progress
												className="progress progress-error w-full"
												value={amount}
												max={salesData.totalDailyExpenses}
											/>
										</div>
									))}
							</div>
						) : (
							<p className="text-sm text-gray-500 text-center py-2">
								No daily expenses recorded
							</p>
						)}
					</div>

					{/* Overhead Cost */}
					<div>
						<div className="flex justify-between items-center mb-2">
							<h4 className="font-semibold flex items-center gap-2">
								<Calendar className="w-4 h-4 text-warning" />
								Overhead Cost (Today's Portion)
								<span className="badge badge-sm badge-warning">
									Ks{todayOverheadCost.toFixed(2)}
								</span>
							</h4>
							<span className="text-sm text-gray-500">
								{salesData.pendingOverheads > 0 ? "Pending" : "All paid"}
							</span>
						</div>

						{salesData.pendingOverheads > 0 ? (
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>Daily Allocation</span>
									<span className="font-medium">
										Ks{todayOverheadCost.toFixed(2)}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>Monthly Total</span>
									<span className="font-medium">
										Ks{salesData.totalMonthlyOverheads?.toFixed(2) || "0.00"}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>Pending</span>
									<span className="font-medium text-warning">
										Ks{salesData.pendingOverheads?.toFixed(2) || "0.00"}
									</span>
								</div>
								{salesData.overdueOverheads > 0 && (
									<div className="flex justify-between text-sm text-error">
										<span className="flex items-center gap-1">
											<AlertCircle className="w-3 h-3" />
											Overdue
										</span>
										<span className="font-medium">
											Ks{salesData.overdueOverheads?.toFixed(2) || "0.00"}
										</span>
									</div>
								)}
							</div>
						) : (
							<p className="text-sm text-gray-500 text-center py-2">
								All monthly overheads are paid
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
