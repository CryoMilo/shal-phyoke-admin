export const PerformanceCard = ({ salesData }) => {
	return (
		<div className="card bg-base-200">
			<div className="card-body">
				<h2 className="card-title mb-4">Today's Performance</h2>
				<div className="space-y-4">
					{/* Orders */}
					<div className="flex items-center justify-between p-3 bg-base-300 rounded-lg">
						<div>
							<p className="text-sm text-base-content/70">Total Orders</p>
							<p className="text-2xl font-bold text-primary">
								{salesData.totalOrders}
							</p>
						</div>
						<div className="text-right">
							<p className="text-sm text-base-content/70">Avg Value</p>
							<p className="text-lg font-semibold">
								Ks{salesData.avgOrderValue.toFixed(2)}
							</p>
						</div>
					</div>

					{/* Items */}
					<div className="flex items-center justify-between p-3 bg-base-300 rounded-lg">
						<div>
							<p className="text-sm text-base-content/70">Items Sold</p>
							<p className="text-2xl font-bold text-secondary">
								{salesData.totalItems}
							</p>
						</div>
						<div className="text-right">
							<p className="text-sm text-base-content/70">Per Order</p>
							<p className="text-lg font-semibold">
								{salesData.totalOrders > 0
									? (salesData.totalItems / salesData.totalOrders).toFixed(1)
									: "0.0"}
							</p>
						</div>
					</div>

					{/* Sales Breakdown */}
					<div className="p-3 bg-base-300 rounded-lg">
						<p className="text-sm text-base-content/70 mb-2">Sales Breakdown</p>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span>Cash Sales</span>
								<span className="font-medium">
									Ks{salesData.cashSales.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between">
								<span>QR Sales</span>
								<span className="font-medium">
									Ks{salesData.qrSales.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between border-t pt-2">
								<span className="font-medium">Total</span>
								<span className="font-bold">
									Ks{salesData.totalIncome.toFixed(2)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
