import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";
import { useState } from "react";

export const PieChartCard = ({ dailySales, totalItems, onChartClick }) => {
	const [activeIndex, setActiveIndex] = useState(null);

	const COLORS = [
		"#3B82F6", // blue-500
		"#8B5CF6", // violet-500
		"#10B981", // emerald-500
		"#F59E0B", // amber-500
		"#EF4444", // red-500
		"#06B6D4", // cyan-500
		"#8B5CF6", // purple-500
		"#64748B", // slate-500
	];

	const handlePieEnter = (_, index) => {
		setActiveIndex(index);
	};

	const handlePieLeave = () => {
		setActiveIndex(null);
	};

	const renderCustomizedLabel = ({
		cx,
		cy,
		midAngle,
		innerRadius,
		outerRadius,
		percent,
	}) => {
		const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
		const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
		const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

		if (percent < 0.05) return null; // Don't show label for tiny slices

		return (
			<text
				x={x}
				y={y}
				fill="white"
				textAnchor="middle"
				dominantBaseline="central"
				className="text-xs font-bold">
				{`${(percent * 100).toFixed(0)}%`}
			</text>
		);
	};

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
					<h2 className="card-title">Top Selling Items (Today)</h2>
					<span className="badge badge-primary">{totalItems} items sold</span>
				</div>

				<div className="h-64 cursor-pointer" onClick={onChartClick}>
					{dailySales.length > 0 ? (
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={dailySales}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={renderCustomizedLabel}
									outerRadius={80}
									fill="#8884d8"
									dataKey="value"
									nameKey="name"
									onMouseEnter={handlePieEnter}
									onMouseLeave={handlePieLeave}
									activeIndex={activeIndex}
									activeShape={(props) => {
										const {
											cx,
											cy,

											outerRadius,
											startAngle,
											endAngle,
											fill,
										} = props;
										return (
											<g>
												<path
													d={`M${cx},${cy} L${
														cx +
														outerRadius *
															Math.cos((-startAngle * Math.PI) / 180)
													},${
														cy +
														outerRadius *
															Math.sin((-startAngle * Math.PI) / 180)
													} A${outerRadius},${outerRadius} 0 ${
														endAngle - startAngle > 180 ? 1 : 0
													},1 ${
														cx +
														outerRadius * Math.cos((-endAngle * Math.PI) / 180)
													},${
														cy +
														outerRadius * Math.sin((-endAngle * Math.PI) / 180)
													} Z`}
													fill={fill}
													stroke="#fff"
													strokeWidth={2}
												/>
											</g>
										);
									}}>
									{dailySales.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={COLORS[index % COLORS.length]}
											stroke="#1F2937"
											strokeWidth={1}
										/>
									))}
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
								<p>No sales data for today</p>
								<p className="text-sm">Start taking orders to see analytics</p>
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
