import { BanknoteArrowUp, DollarSign, Receipt } from "lucide-react";

export const SummaryCards = ({ salesData }) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
							<p className="text-xs text-base-content/50 mt-1">
								From misc expenses
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Net Profit */}
			<div className="card bg-base-200">
				<div className="card-body">
					<div className="flex items-center">
						<div className="avatar placeholder">
							<div className="bg-primary/20 text-primary rounded-full w-12 grid place-content-center place-items-center">
								<BanknoteArrowUp className="w-6 h-6" />
							</div>
						</div>
						<div className="ml-4">
							<h3 className="text-sm font-medium text-base-content/70">
								Net Profit
							</h3>
							<p className="text-2xl font-bold">
								฿{(salesData.totalIncome - salesData.totalExpenses).toFixed(2)}
							</p>
							<p className="text-xs text-base-content/50 mt-1">
								Income - Expenses
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
