import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
	Calendar,
	DollarSign,
	TrendingUp,
	TrendingDown,
	CheckCircle,
	AlertCircle,
	CreditCard,
} from "lucide-react";
import { supabase } from "../services/supabase";

const DailyCash = () => {
	const [selectedDate, setSelectedDate] = useState(
		format(new Date(), "yyyy-MM-dd")
	);
	const [cashData, setCashData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [salesData, setSalesData] = useState({ cash: 0, card: 0, online: 0 });

	const fetchDailyCash = async (date) => {
		setLoading(true);
		try {
			// Get daily cash record
			const { data: cash, error } = await supabase
				.from("daily_cash")
				.select("*")
				.eq("date", date)
				.single();

			if (error && error.code !== "PGRST116") {
				console.error("Error fetching daily cash:", error);
				// Create default cash data if not found
				const defaultCashData = {
					id: null,
					date: date,
					opening_balance: 0,
					closing_balance: 0,
					cash_sales: 0,
					card_sales: 0,
					online_sales: 0,
					cash_collected: 0,
					cash_deposited: 0,
					notes: "",
				};
				setCashData(defaultCashData);
			} else if (cash) {
				setCashData(cash);
			} else {
				// No record found, create default
				const defaultCashData = {
					id: null,
					date: date,
					opening_balance: 0,
					closing_balance: 0,
					cash_sales: 0,
					card_sales: 0,
					online_sales: 0,
					cash_collected: 0,
					cash_deposited: 0,
					notes: "",
				};
				setCashData(defaultCashData);
			}

			// Get sales data for the day
			const { data: sales } = await supabase
				.from("orders")
				.select("total_amount, payment_method, payment_status")
				.eq("payment_status", "paid")
				.gte("created_at", `${date}T00:00:00`)
				.lt("created_at", `${date}T23:59:59`);

			if (sales) {
				const totals = sales.reduce(
					(acc, order) => {
						const amount = parseFloat(order.total_amount) || 0;
						if (order.payment_method === "cash") acc.cash += amount;
						else if (order.payment_method === "card") acc.card += amount;
						else if (order.payment_method === "online") acc.online += amount;
						return acc;
					},
					{ cash: 0, card: 0, online: 0 }
				);

				setSalesData(totals);
			}
		} catch (error) {
			console.error("Error fetching daily cash:", error);
			// Set default data on error
			const defaultCashData = {
				id: null,
				date: date,
				opening_balance: 0,
				closing_balance: 0,
				cash_sales: 0,
				card_sales: 0,
				online_sales: 0,
				cash_collected: 0,
				cash_deposited: 0,
				notes: "",
			};
			setCashData(defaultCashData);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDailyCash(selectedDate);
	}, [selectedDate]);

	const handleDateChange = (e) => {
		setSelectedDate(e.target.value);
	};

	const navigateDate = (days) => {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() + days);
		setSelectedDate(format(newDate, "yyyy-MM-dd"));
	};

	const updateDailyCash = async (field, value) => {
		if (!cashData) return;

		const updates = {
			...cashData,
			[field]: parseFloat(value) || 0,
			date: selectedDate,
		};

		try {
			if (cashData.id) {
				const { error } = await supabase
					.from("daily_cash")
					.update(updates)
					.eq("id", cashData.id);

				if (error) throw error;
			} else {
				const { data, error } = await supabase
					.from("daily_cash")
					.insert([updates])
					.select()
					.single();

				if (error) throw error;
				if (data) setCashData(data);
			}

			fetchDailyCash(selectedDate);
		} catch (error) {
			console.error("Error updating daily cash:", error);
		}
	};

	// Safe calculation functions
	const calculateExpectedCash = () => {
		const opening = cashData?.opening_balance || 0;
		const cashSales = salesData.cash || 0;
		return opening + cashSales;
	};

	const calculateVariance = () => {
		const expected = calculateExpectedCash();
		const actual = cashData?.cash_collected || 0;
		return actual - expected;
	};

	// Get safe values for display
	const getSafeValue = (value, defaultValue = 0) => {
		return cashData ? cashData[value] || defaultValue : defaultValue;
	};

	return (
		<div className="p-4">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold">Daily Cash Tracking</h1>
					<p className="text-gray-600">
						Track daily cash flow and detect discrepancies
					</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={() => navigateDate(-1)}
						className="btn btn-ghost btn-sm">
						Previous Day
					</button>
					<div className="flex items-center gap-2 bg-base-300 px-3 py-2 rounded-lg">
						<Calendar className="w-4 h-4" />
						<input
							type="date"
							value={selectedDate}
							onChange={handleDateChange}
							className="bg-transparent focus:outline-none"
						/>
					</div>
					<button
						onClick={() => navigateDate(1)}
						className="btn btn-ghost btn-sm">
						Next Day
					</button>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center py-8">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			) : (
				<>
					{/* Quick Stats */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
						<div className="stats shadow">
							<div className="stat">
								<div className="stat-title">Expected Cash</div>
								<div className="stat-value text-primary">
									${calculateExpectedCash().toFixed(2)}
								</div>
								<div className="stat-desc">
									Opening: ${getSafeValue("opening_balance").toFixed(2)} +
									Sales: ${salesData.cash.toFixed(2)}
								</div>
							</div>
						</div>

						<div className="stats shadow">
							<div className="stat">
								<div className="stat-title">Cash Collected</div>
								<div className="stat-value">
									${getSafeValue("cash_collected").toFixed(2)}
								</div>
								<div className="stat-desc">
									<input
										type="number"
										step="0.01"
										value={getSafeValue("cash_collected")}
										onChange={(e) =>
											updateDailyCash("cash_collected", e.target.value)
										}
										className="input input-bordered input-sm w-full"
									/>
								</div>
							</div>
						</div>

						<div className="stats shadow">
							<div className="stat">
								<div className="stat-title">Cash Deposited</div>
								<div className="stat-value">
									${getSafeValue("cash_deposited").toFixed(2)}
								</div>
								<div className="stat-desc">
									<input
										type="number"
										step="0.01"
										value={getSafeValue("cash_deposited")}
										onChange={(e) =>
											updateDailyCash("cash_deposited", e.target.value)
										}
										className="input input-bordered input-sm w-full"
									/>
								</div>
							</div>
						</div>

						<div className="stats shadow">
							<div className="stat">
								<div
									className={`stat-title ${calculateVariance() < 0 ? "text-error" : "text-success"}`}>
									Variance
								</div>
								<div
									className={`stat-value ${calculateVariance() < 0 ? "text-error" : "text-success"}`}>
									${calculateVariance().toFixed(2)}
								</div>
								<div className="stat-desc flex items-center gap-1">
									{calculateVariance() < 0 ? (
										<>
											<TrendingDown className="w-4 h-4" />
											Shortage
										</>
									) : (
										<>
											<TrendingUp className="w-4 h-4" />
											Overage
										</>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Sales Breakdown */}
					<div className="card bg-base-100 shadow mb-6">
						<div className="card-body">
							<h2 className="card-title">Sales Breakdown</h2>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="bg-base-200 p-4 rounded-lg">
									<div className="flex justify-between items-center">
										<div>
											<p className="text-sm text-gray-600">Cash Sales</p>
											<p className="text-2xl font-bold">
												${salesData.cash.toFixed(2)}
											</p>
										</div>
										<DollarSign className="w-8 h-8 text-green-500" />
									</div>
								</div>
								<div className="bg-base-200 p-4 rounded-lg">
									<div className="flex justify-between items-center">
										<div>
											<p className="text-sm text-gray-600">Card Sales</p>
											<p className="text-2xl font-bold">
												${salesData.card.toFixed(2)}
											</p>
										</div>
										<CreditCard className="w-8 h-8 text-blue-500" />
									</div>
								</div>
								<div className="bg-base-200 p-4 rounded-lg">
									<div className="flex justify-between items-center">
										<div>
											<p className="text-sm text-gray-600">Online Sales</p>
											<p className="text-2xl font-bold">
												${salesData.online.toFixed(2)}
											</p>
										</div>
										<TrendingUp className="w-8 h-8 text-purple-500" />
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Cash Flow Details */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="card bg-base-100 shadow">
							<div className="card-body">
								<h2 className="card-title">Cash Flow</h2>
								<div className="space-y-4">
									<div className="flex justify-between items-center p-3 bg-base-200 rounded">
										<span>Opening Balance</span>
										<input
											type="number"
											step="0.01"
											value={getSafeValue("opening_balance")}
											onChange={(e) =>
												updateDailyCash("opening_balance", e.target.value)
											}
											className="input input-bordered input-sm w-32"
										/>
									</div>
									<div className="flex justify-between items-center p-3 bg-base-200 rounded">
										<span>Cash Sales</span>
										<span className="font-bold">
											${salesData.cash.toFixed(2)}
										</span>
									</div>
									<div className="divider"></div>
									<div className="flex justify-between items-center p-3 bg-primary/10 rounded">
										<span className="font-bold">Expected Total</span>
										<span className="font-bold">
											${calculateExpectedCash().toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between items-center p-3 bg-base-200 rounded">
										<span>Actual Collected</span>
										<input
											type="number"
											step="0.01"
											value={getSafeValue("cash_collected")}
											onChange={(e) =>
												updateDailyCash("cash_collected", e.target.value)
											}
											className="input input-bordered input-sm w-32"
										/>
									</div>
								</div>
							</div>
						</div>

						<div className="card bg-base-100 shadow">
							<div className="card-body">
								<h2 className="card-title">Banking & Notes</h2>
								<div className="space-y-4">
									<div className="form-control">
										<label className="label">
											<span className="label-text">Cash to Deposit</span>
										</label>
										<input
											type="number"
											step="0.01"
											value={getSafeValue("cash_deposited")}
											onChange={(e) =>
												updateDailyCash("cash_deposited", e.target.value)
											}
											className="input input-bordered"
										/>
									</div>
									<div className="form-control">
										<label className="label">
											<span className="label-text">Notes</span>
										</label>
										<textarea
											value={getSafeValue("notes", "")}
											onChange={(e) => updateDailyCash("notes", e.target.value)}
											className="textarea textarea-bordered h-24"
											placeholder="Any notes about today's cash..."
										/>
									</div>
									<div className="flex justify-between items-center mt-4">
										<div
											className={`badge ${calculateVariance() === 0 ? "badge-success" : "badge-warning"}`}>
											{calculateVariance() === 0
												? "Balanced"
												: "Check Required"}
										</div>
										<button
											className="btn btn-primary"
											onClick={async () => {
												// Calculate closing balance
												const closingBalance =
													getSafeValue("cash_collected") -
													getSafeValue("cash_deposited");
												await updateDailyCash(
													"closing_balance",
													closingBalance
												);
												alert("Day closed successfully!");
											}}>
											<CheckCircle className="w-4 h-4 mr-2" />
											Close Day
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default DailyCash;
