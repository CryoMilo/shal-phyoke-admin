import {
	PieChart,
	Pie,
	ResponsiveContainer,
	Tooltip,
	Legend,
	Cell,
} from "recharts";
import { Calendar } from "lucide-react";

export const PieChartCard = ({
	dailySales,
	totalItems,
	onChartClick,
	date,
}) => {
	const COLORS = [
		"#3B82F6",
		"#8B5CF6",
		"#10B981",
		"#F59E0B",
		"#EF4444",
		"#06B6D4",
		"#8B5CF6",
		"#64748B",
	];

	const isToday = date.toDateString() === new Date().toDateString();

	const CustomTooltip = ({ active, payload }) => {
		if (active && payload && payload.length) {
			return (
				<div className="bg-base-100 p-3 rounded-lg shadow-lg border border-base-300">
					<p className="font-bold">{payload[0].payload.name}</p>
					<p className="text-sm">
						Quantity: <span className="font-semibold">{payload[0].value}</span>
					</p>
					<p className="text-sm">
						Percentage:{" "}
						<span className="font-semibold">
							{payload[0].payload.percentage.toFixed(1)}%
						</span>
					</p>
				</div>
			);
		}
		return null;
	};

	return (
		<div className="card bg-base-200">
			<div className="card-body">
				<div className="flex justify-between items-center mb-4">
					<div>
						<h2 className="card-title">Top Selling Items</h2>
						<div className="flex items-center gap-2 mt-1">
							<Calendar className="w-4 h-4 text-base-content/70" />
							<span className="text-sm text-base-content/70">
								{date.toLocaleDateString("en-US", {
									weekday: "long",
									month: "short",
									day: "numeric",
								})}
							</span>
							{!isToday && (
								<span className="badge badge-xs badge-warning">Historical</span>
							)}
						</div>
					</div>
					<span className="badge badge-primary">{totalItems} items sold</span>
				</div>

				<div className="h-64 cursor-pointer" onClick={onChartClick}>
					{dailySales.length > 0 ? (
						<ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
							<PieChart>
								<Pie
									data={dailySales}
									cx="50%"
									cy="50%"
									labelLine={false}
									outerRadius={80}
									fill="#8884d8"
									dataKey="value"
									nameKey="name">
									{dailySales.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
											stroke="#1F2937"
											strokeWidth={1}
										/>
									))}
									{/* {testData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
										/>
									))} */}
								</Pie>
								<Tooltip content={<CustomTooltip />} />
								<Legend
									wrapperStyle={{ fontSize: "12px" }}
									formatter={(value) => (
										<span className="text-xs">{value}</span>
									)}
								/>
							</PieChart>
						</ResponsiveContainer>
					) : (
						<div className="h-full flex items-center justify-center text-base-content/50">
							<div className="text-center">
								<div className="text-4xl mb-2">📊</div>
								<p>No sales data for this date</p>
								<p className="text-sm">
									{isToday
										? "Start taking orders to see analytics"
										: "No sales recorded on this date"}
								</p>
							</div>
						</div>
					)}
				</div>

				{dailySales.length > 0 && (
					<div className="mt-4 text-center">
						<p className="text-sm text-base-content/70">
							Click chart to view all items
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
