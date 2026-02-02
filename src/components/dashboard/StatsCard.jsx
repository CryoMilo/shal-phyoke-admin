export const StatsCard = ({ salesData }) => {
	const profitMargin =
		salesData.totalIncome > 0
			? (
					((salesData.totalIncome - salesData.totalExpenses) /
						salesData.totalIncome) *
					100
			  ).toFixed(1)
			: "0";

	return (
		<div className="card bg-base-200 mb-6">
			<div className="card-body">
				<h2 className="card-title mb-4">Today's Quick Stats</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="stat">
						<div className="stat-title">Total Orders</div>
						<div className="stat-value text-primary">
							{salesData.totalOrders}
						</div>
						<div className="stat-desc">Completed today</div>
					</div>

					<div className="stat">
						<div className="stat-title">Items Sold</div>
						<div className="stat-value text-secondary">
							{salesData.totalItems}
						</div>
						<div className="stat-desc">Total quantity</div>
					</div>

					<div className="stat">
						<div className="stat-title">Avg Order Value</div>
						<div className="stat-value text-accent">
							฿{salesData.avgOrderValue.toFixed(2)}
						</div>
						<div className="stat-desc">Per completed order</div>
					</div>

					<div className="stat">
						<div className="stat-title">Profit Margin</div>
						<div className="stat-value">{profitMargin}%</div>
						<div className="stat-desc">Net profit percentage</div>
					</div>
				</div>
			</div>
		</div>
	);
};
