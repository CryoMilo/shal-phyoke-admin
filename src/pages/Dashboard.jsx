import React, { useState, useEffect, useMemo } from "react";
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
	StatsCard,
	ItemDetailsModal,
} from "../components/dashboard";
import { formatDisplayDate, getBangkokDayRange } from "../utils/dateUtils";

// Consistent YYYY-MM-DD for Bangkok
const getBangkokISO = (date) =>
	new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(date);

export const Dashboard = () => {
	const [salesData, setSalesData] = useState({
		dailySales: [],
		totalIncome: 0,
		totalExpenses: 0,
		cashSales: 0,
		qrSales: 0,
		totalOrders: 0,
		totalItems: 0,
		avgOrderValue: 0,
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

			if (ordersError) throw ordersError;

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

			if (salesError) throw salesError;

			// 3. Fetch daily expenses for the selected date
			const { data: dailyExpenses, error: expensesError } = await supabase
				.from("daily_expenses")
				.select("id, amount, category, paid_by, description")
				.eq("date", bangkokDateStr);

			if (expensesError) throw expensesError;

			// 4. Fetch daily cash record if exists
			const { data: dailyCash, error: cashError } = await supabase
				.from("daily_cash")
				.select("cash_collected, cash_deposited, opening_balance")
				.eq("date", bangkokDateStr)
				.single();

			if (cashError && cashError.code !== "PGRST116") {
				console.error("Error fetching daily cash:", cashError);
			}

			processData(
				orders || [],
				aggregatedSales || [],
				dailyExpenses || [],
				dailyCash,
				bangkokDateStr
			);
		} catch (error) {
			console.error("Dashboard Fetch Error:", error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const processData = (
		orders,
		aggregatedSales,
		dailyExpenses,
		dailyCash,
		dateStr
	) => {
		const totalIncome = orders.reduce((sum, o) => sum + o.total_amount, 0);
		const totalOrders = orders.length;
		const totalItems = orders.reduce(
			(sum, o) => sum + (o.order_items?.length || 0),
			0
		);

		const cashSales = orders
			.filter((o) => o.payment_method === "cash")
			.reduce((sum, o) => sum + o.total_amount, 0);

		const qrSales = totalIncome - cashSales;

		// Calculate total expenses
		const totalExpenses = dailyExpenses.reduce(
			(sum, expense) => sum + parseFloat(expense.amount || 0),
			0
		);

		// Categorize expenses
		const expenseByCategory = dailyExpenses.reduce((acc, expense) => {
			const category = expense.category || "other";
			if (!acc[category]) acc[category] = 0;
			acc[category] += parseFloat(expense.amount || 0);
			return acc;
		}, {});

		// Expenses by payment source
		const expenseByPaidBy = dailyExpenses.reduce((acc, expense) => {
			const paidBy = expense.paid_by || "cash_drawer";
			if (!acc[paidBy]) acc[paidBy] = 0;
			acc[paidBy] += parseFloat(expense.amount || 0);
			return acc;
		}, {});

		// Aggregate items
		const itemSalesMap = {};
		aggregatedSales.forEach((sale) => {
			const key = sale.menu_item_name_burmese;
			if (!itemSalesMap[key]) {
				itemSalesMap[key] = {
					name: sale.menu_item_name_burmese,
					englishName: sale.menu_item_name_english,
					category: sale.menu_item_category,
					price: sale.menu_item_price,
					quantitySold: 0,
					totalRevenue: 0,
					orderIds: new Set(),
					cashOrders: 0,
					qrOrders: 0,
				};
			}

			itemSalesMap[key].quantitySold += sale.quantity_sold;
			itemSalesMap[key].totalRevenue += sale.total_revenue;
			itemSalesMap[key].orderIds.add(sale.order_id);
			sale.payment_method === "cash"
				? itemSalesMap[key].cashOrders++
				: itemSalesMap[key].qrOrders++;
		});

		const itemSalesArray = Object.values(itemSalesMap).sort(
			(a, b) => b.quantitySold - a.quantitySold
		);
		const allItemsTotalQty = itemSalesArray.reduce(
			(sum, i) => sum + i.quantitySold,
			0
		);

		// Format for display and modals
		const itemDetailsList = itemSalesArray.map((item) => ({
			item_name: item.name,
			item_english_name: item.englishName,
			category: item.category,
			price: item.price,
			quantity_sold: item.quantitySold,
			total_revenue: item.totalRevenue,
			avg_price:
				item.quantitySold > 0
					? item.totalRevenue / item.quantitySold
					: item.price,
			order_count: item.orderIds.size,
			cash_orders: item.cashOrders,
			qr_orders: item.qrOrders,
			percentage:
				allItemsTotalQty > 0 ? (item.quantitySold / allItemsTotalQty) * 100 : 0,
			sale_date: dateStr,
		}));

		// Calculate cash variance if daily cash exists
		const cashVariance = dailyCash
			? (dailyCash.cash_collected || 0) -
				(dailyCash.opening_balance || 0) -
				cashSales
			: 0;

		setSalesData({
			dailySales: itemDetailsList.slice(0, 8).map((i) => ({
				name: i.item_name,
				value: i.quantity_sold,
				percentage: i.percentage,
			})),
			totalIncome,
			totalExpenses,
			cashSales,
			qrSales,
			totalOrders,
			totalItems,
			avgOrderValue: totalOrders > 0 ? totalIncome / totalOrders : 0,
			// New data for expanded dashboard
			dailyExpenses: dailyExpenses,
			expenseByCategory,
			expenseByPaidBy,
			dailyCash: dailyCash || {},
			cashVariance,
			netProfit: totalIncome - totalExpenses,
			profitMargin:
				totalIncome > 0
					? ((totalIncome - totalExpenses) / totalIncome) * 100
					: 0,
		});

		setItemDetails(itemDetailsList);
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
		].join("\n");

		const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `sales_${getBangkokISO(selectedDate)}.csv`;
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
			<div className="container mx-auto p-4 md:p-6">
				<PageHeader
					title="Dashboard Analytics"
					description={
						<div className="flex items-center gap-2">
							<span>{formatDisplayDate(selectedDate)}</span>
							{!isTodaySelected && (
								<span className="badge badge-sm badge-warning">
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
				<div className="mb-6 flex items-center justify-between bg-base-200 rounded-lg p-3">
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
					<div className="flex gap-2">
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

				<StatsCard salesData={salesData} />
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
