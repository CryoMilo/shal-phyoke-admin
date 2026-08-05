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
								฿{salesData.avgOrderValue.toFixed(2)}
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
									฿{salesData.cashSales.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between">
								<span>QR Sales</span>
								<span className="font-medium">
									฿{salesData.qrSales.toFixed(2)}
								</span>
							</div>
							<div className="flex justify-between text-accent font-medium">
								<span>Delivery Fees</span>
								<span>฿{salesData.totalDeliveryFees.toFixed(2)}</span>
							</div>
							<div className="flex justify-between border-t pt-2">
								<span className="font-medium">Total Income</span>
								<span className="font-bold text-success">
									฿{salesData.totalIncome.toFixed(2)}
								</span>
							</div>
						</div>
					</div>

					{/* Order Exceptions (Cancelled & Refunded) */}
					<div className="p-3 bg-base-300 rounded-lg">
						<p className="text-sm text-base-content/70 mb-2">Order Exceptions</p>
						<div className="grid grid-cols-2 gap-4">
							<div className="p-2 bg-base-200 rounded-md border border-error/20">
								<p className="text-xs text-base-content/70">Cancelled Orders</p>
								<p className="text-lg font-bold text-error">
									{salesData.cancelledCount || 0}
								</p>
								<p className="text-xs text-base-content/60">
									฿{(salesData.cancelledAmount || 0).toFixed(2)}
								</p>
							</div>
							<div className="p-2 bg-base-200 rounded-md border border-warning/20">
								<p className="text-xs text-base-content/70">Refunded Orders</p>
								<p className="text-lg font-bold text-warning">
									{salesData.refundedCount || 0}
								</p>
								<p className="text-xs text-base-content/60">
									฿{(salesData.refundedAmount || 0).toFixed(2)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
