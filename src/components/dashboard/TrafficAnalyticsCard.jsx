import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from "recharts";
import { Users } from "lucide-react";

export const TrafficAnalyticsCard = ({ hourlyTraffic }) => {
	const CustomTooltip = ({ active, payload, label }) => {
		if (active && payload && payload.length) {
			return (
				<div className="bg-base-100 p-3 rounded-lg shadow-lg border border-base-300">
					<p className="font-bold">{label}</p>
					<p className="text-sm">
						Orders / Customers:{" "}
						<span className="font-semibold text-primary">
							{payload[0].value}
						</span>
					</p>
					<p className="text-sm">
						Revenue:{" "}
						<span className="font-semibold text-secondary">
							฿{payload[0].payload.revenue.toFixed(2)}
						</span>
					</p>
				</div>
			);
		}
		return null;
	};

	const hasData = hourlyTraffic && hourlyTraffic.some((h) => h.orders > 0);

	return (
		<div className="card bg-base-200">
			<div className="card-body">
				<div className="flex justify-between items-center mb-4">
					<div>
						<h2 className="card-title">Customer Traffic Analytics</h2>
						<p className="text-sm text-base-content/70">
							Order volume breakdown by hour
						</p>
					</div>
					<div className="p-2 bg-base-300 rounded-lg">
						<Users className="w-5 h-5 text-primary" />
					</div>
				</div>

				<div className="h-64">
					{hasData ? (
						<ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
							<BarChart
								data={hourlyTraffic}
								margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" opacity={0.2} />
								<XAxis
									dataKey="hour"
									tick={{ fontSize: 11 }}
									interval="preserveStartEnd"
								/>
								<YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
								<Tooltip content={<CustomTooltip />} />
								<Bar
									dataKey="orders"
									name="Orders"
									fill="#3B82F6"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					) : (
						<div className="h-full flex items-center justify-center text-base-content/50">
							<div className="text-center">
								<div className="text-4xl mb-2">📈</div>
								<p>No traffic data for this date</p>
								<p className="text-sm">
									Orders will appear broken down by hour here
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
