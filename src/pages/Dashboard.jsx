import { useState, useEffect, useMemo } from "react";
import { supabase } from "../services/supabase";
import {
	Calendar,
	Download,
	RefreshCw,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

// Components
import { PageHeader } from "../components/common/PageHeader";
import { Loading } from "../components/common/Loading";
import {
	SummaryCards,
	PieChartCard,
	PerformanceCard,
	ExpenseBreakdownCard,
	ItemDetailsModal,
} from "../components/dashboard";
import { formatDisplayDate, getBangkokDayRange } from "../utils/dateUtils";
import { processDashboardData } from "../utils/processData"; // Import the refactored function

// Consistent YYYY-MM-DD for Bangkok
const getBangkokISO = (date) =>
	new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(date);

export const Dashboard = () => {
	const [salesData, setSalesData] = useState({
		dailySales: [],
		totalIncome: 0,
		totalDailyExpenses: 0,
		totalMonthlyOverheads: 0,
		dailyOverheadCost: 0,
		cashSales: 0,
		qrSales: 0,
		totalOrders: 0,
		totalItems: 0,
		avgOrderValue: 0,
		dailyExpenseByCategory: {},
		monthlyOverheadByCategory: {},
		expenseByPaidBy: {},
		dailyCash: {},
		cashVariance: 0,
		netProfit: 0,
		dailyProfit: 0,
		profitMargin: 0,
		expenseToIncomeRatio: 0,
		dailyExpenseToIncomeRatio: 0,
		overheadToIncomeRatio: 0,
		dailyExpenses: [],
		monthlyOverheads: [],
		date: "",
	});

	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [showItemDetails, setShowItemDetails] = useState(false);
	const [itemDetails, setItemDetails] = useState([]);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);

	// Constants for navigation logic
	const today = new Date();
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);

	// Derived state: Is the selected date "Today" in Bangkok?
	const isTodaySelected = useMemo(
		() => getBangkokISO(selectedDate) === getBangkokISO(today),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[selectedDate]
	);

	useEffect(() => {
		fetchDashboardData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedDate]);

	const fetchDashboardData = async (isRefresh = false) => {
		try {
			isRefresh ? setRefreshing(true) : setLoading(true);

			const bangkokDateStr = getBangkokISO(selectedDate);
			const { start, end } = getBangkokDayRange(selectedDate);

			// 1. Fetch orders using exact UTC window
			const { data: orders, error: ordersError } = await supabase
				.from("orders")
				.select("id, created_at, total_amount, payment_method, order_items")
				.eq("pos_order_status", "completed")
				.eq("payment_status", "paid")
				.gte("created_at", start)
				.lte("created_at", end);

			if (ordersError) {
				console.error("Error fetching orders:", ordersError);
				throw ordersError;
			}

			// 2. Fetch aggregated sales from monthly_sales table
			const { data: aggregatedSales, error: salesError } = await supabase
				.from("monthly_sales")
				.select(
					`
          menu_item_id,
          menu_item_name_burmese,
          menu_item_name_english,
          menu_item_category,
          menu_item_price,
          quantity_sold,
          total_revenue,
          order_id,
          payment_method
        `
				)
				.eq("sale_date", bangkokDateStr);

			if (salesError) {
				console.error("Error fetching aggregated sales:", salesError);
				throw salesError;
			}

			// 3. Fetch daily expenses for the selected date
			const { data: dailyExpenses, error: expensesError } = await supabase
				.from("daily_expenses")
				.select("id, amount, category, paid_by, description, notes")
				.eq("date", bangkokDateStr);

			if (expensesError && expensesError.code !== "PGRST116") {
				console.error("Error fetching daily expenses:", expensesError);
			}

			// 4. Fetch daily cash record
			const { data: dailyCash, error: cashError } = await supabase
				.from("daily_cash")
				.select("opening_balance, cash_collected, cash_deposited, notes")
				.eq("date", bangkokDateStr)
				.single();

			if (cashError && cashError.code !== "PGRST116") {
				console.error("Error fetching daily cash:", cashError);
			}

			// 5. Fetch monthly overheads for current month
			const currentMonthStart = new Date(selectedDate);
			currentMonthStart.setDate(1);
			const currentMonthStr = getBangkokISO(currentMonthStart);

			const { data: monthlyOverheads, error: overheadsError } = await supabase
				.from("monthly_overheads")
				.select(
					"id, amount, category, description, due_date, paid_date, is_recurring, notes"
				)
				.eq("month", currentMonthStr)
				.order("due_date", { ascending: true });

			if (overheadsError && overheadsError.code !== "PGRST116") {
				console.error("Error fetching monthly overheads:", overheadsError);
			}

			// Process all data using the refactored function
			const dashboardData = processDashboardData(
				orders || [],
				aggregatedSales || [],
				dailyExpenses || [],
				dailyCash || {},
				monthlyOverheads || [],
				selectedDate, // Pass selectedDate for daily overhead calculation
				bangkokDateStr
			);

			setSalesData(dashboardData);
			setItemDetails(dashboardData.itemDetailsList);
		} catch (error) {
			console.error("Dashboard Fetch Error:", error);
			// Set default data on error
			setSalesData({
				dailySales: [],
				totalIncome: 0,
				totalDailyExpenses: 0,
				totalMonthlyOverheads: 0,
				dailyOverheadCost: 0,
				cashSales: 0,
				qrSales: 0,
				totalOrders: 0,
				totalItems: 0,
				avgOrderValue: 0,
				dailyExpenseByCategory: {},
				monthlyOverheadByCategory: {},
				expenseByPaidBy: {},
				dailyCash: {},
				cashVariance: 0,
				netProfit: 0,
				dailyProfit: 0,
				profitMargin: 0,
				expenseToIncomeRatio: 0,
				dailyExpenseToIncomeRatio: 0,
				overheadToIncomeRatio: 0,
				dailyExpenses: [],
				monthlyOverheads: [],
				date: getBangkokISO(selectedDate),
			});
			setItemDetails([]);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const exportToCSV = () => {
		const headers = [
			"Date",
			"Item (MM)",
			"Item (EN)",
			"Category",
			"Price",
			"Qty",
			"Revenue",
			"Avg Price",
			"Orders",
			"Cash",
			"QR",
			"%",
		];

		const csvRows = [
			headers.join(","),
			...itemDetails.map((i) =>
				[
					`"${i.sale_date}"`,
					`"${i.item_name}"`,
					`"${i.item_english_name}"`,
					`"${i.category}"`,
					i.price,
					i.quantity_sold,
					i.total_revenue,
					i.avg_price.toFixed(2),
					i.order_count,
					i.cash_orders,
					i.qr_orders,
					i.percentage.toFixed(1),
				].join(",")
			),
		];

		// Add expense summary
		if (salesData.totalDailyExpenses > 0 || salesData.dailyOverheadCost > 0) {
			csvRows.push("");
			csvRows.push("Expense Summary");
			csvRows.push(["Type", "Amount"].join(","));
			csvRows.push(
				["Daily Expenses", salesData.totalDailyExpenses.toFixed(2)].join(",")
			);
			csvRows.push(
				[
					"Overhead Cost (Today's portion)",
					salesData.dailyOverheadCost.toFixed(2),
				].join(",")
			);
			csvRows.push(
				[
					"Total Expenses",
					(salesData.totalDailyExpenses + salesData.dailyOverheadCost).toFixed(
						2
					),
				].join(",")
			);
			csvRows.push(["Net Profit", salesData.netProfit.toFixed(2)].join(","));
			csvRows.push(
				["Profit Margin", `${salesData.profitMargin.toFixed(1)}%`].join(",")
			);
		}

		const blob = new Blob([csvRows.join("\n")], {
			type: "text/csv;charset=utf-8;",
		});
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `dashboard_${getBangkokISO(selectedDate)}.csv`;
		link.click();
	};

	const handleDateChange = (offset) => {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() + offset);
		if (newDate > today) return;
		setSelectedDate(newDate);
	};

	if (loading) return <Loading message="Syncing with Bangkok data..." />;

	return (
		<div className="min-h-screen bg-base-100">
			<div className="container mx-auto p-4 max-w-6xl">
				<PageHeader
					title="Dashboard Analytics"
					description={
						<div className="flex items-center gap-2">
							<span>{formatDisplayDate(selectedDate)}</span>
							{!isTodaySelected && (
								<span className="hidden md:badge badge-sm badge-warning">
									Historical View
								</span>
							)}
						</div>
					}
					buttons={[
						{
							label: "Calendar",
							icon: Calendar,
							onClick: () => setShowDatePicker(true),
							variant: "outline",
						},
						{
							label: "Refresh",
							icon: RefreshCw,
							onClick: () => fetchDashboardData(true),
							variant: "outline",
							loading: refreshing,
						},
						{
							label: "Export Report",
							icon: Download,
							onClick: () => setShowItemDetails(true),
							variant: "primary",
						},
					]}
				/>

				{/* Date Navigation */}
				<div className="mb-6 flex items-center justify-center md:justify-between bg-base-200 rounded-lg p-3">
					<div className="flex items-center gap-2">
						<button
							className="btn btn-circle btn-sm"
							onClick={() => handleDateChange(-1)}>
							<ChevronLeft size={16} />
						</button>
						<button
							className="btn btn-ghost btn-sm font-bold"
							onClick={() => setShowDatePicker(true)}>
							{formatDisplayDate(selectedDate)}
						</button>
						<button
							className="btn btn-circle btn-sm"
							onClick={() => handleDateChange(1)}
							disabled={isTodaySelected}>
							<ChevronRight size={16} />
						</button>
					</div>
					<div className="hidden md:flex gap-2">
						<button
							className={`btn btn-sm ${
								getBangkokISO(selectedDate) === getBangkokISO(yesterday)
									? "btn-primary"
									: "btn-ghost"
							}`}
							onClick={() => setSelectedDate(yesterday)}>
							Yesterday
						</button>
						<button
							className={`btn btn-sm ${
								isTodaySelected ? "btn-primary" : "btn-ghost"
							}`}
							onClick={() => setSelectedDate(today)}>
							Today
						</button>
					</div>
				</div>

				<SummaryCards salesData={salesData} />

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					<PieChartCard
						dailySales={salesData.dailySales}
						totalItems={salesData.totalItems}
						onChartClick={() => setShowItemDetails(true)}
						date={selectedDate}
					/>
					<PerformanceCard salesData={salesData} />
				</div>

				<ExpenseBreakdownCard salesData={salesData} />
			</div>

			{/* Date Picker Modal */}
			{showDatePicker && (
				<div className="modal modal-open">
					<div className="modal-box">
						<h3 className="font-bold text-lg mb-4">Select Date</h3>
						<input
							type="date"
							className="input input-bordered w-full"
							value={getBangkokISO(selectedDate)}
							max={getBangkokISO(today)}
							onChange={(e) => {
								setSelectedDate(new Date(e.target.value));
								setShowDatePicker(false);
							}}
						/>
						<div className="modal-action">
							<button
								className="btn btn-ghost"
								onClick={() => setShowDatePicker(false)}>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			<ItemDetailsModal
				isOpen={showItemDetails}
				onClose={() => setShowItemDetails(false)}
				itemDetails={itemDetails}
				date={selectedDate}
				onExportCSV={exportToCSV}
			/>
		</div>
	);
};

export default Dashboard;
