// pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import {
	Calendar,
	Download,
	RefreshCw,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Loading } from "../components/common/Loading";
import {
	SummaryCards,
	PieChartCard,
	PerformanceCard,
	// StatsCard,
	ItemDetailsModal,
} from "../components/dashboard";
import { getBangkokDateRange } from "../utils/dateUtils";

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

	// Date selection state
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [dateRange, setDateRange] = useState({
		minDate: null,
		maxDate: new Date(),
	});

	useEffect(() => {
		fetchDashboardData();
		fetchDateRange();
	}, [selectedDate]);

	const fetchDateRange = async () => {
		try {
			// Get min and max dates from sales data
			const { data, error } = await supabase
				.from("current_month_sales")
				.select("sale_date")
				.order("sale_date", { ascending: true })
				.limit(1);

			if (!error && data && data.length > 0) {
				setDateRange((prev) => ({
					...prev,
					minDate: new Date(data[0].sale_date),
				}));
			}
		} catch (error) {
			console.error("Error fetching date range:", error);
		}
	};

	const fetchDashboardData = async (isRefresh = false) => {
		try {
			if (isRefresh) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}

			// Get Bangkok date range
			const { start, end, dateStr } = getBangkokDateRange(selectedDate);

			// 1. Fetch orders for selected date
			const { data: orders, error: ordersError } = await supabase
				.from("orders")
				.select("id, created_at, total_amount, payment_method, order_items")
				.eq("pos_order_status", "completed")
				.eq("payment_status", "paid")
				.gte("created_at", start)
				.lte("created_at", end);

			if (ordersError) throw ordersError;

			// 2. Fetch sales analytics for Bangkok date
			const { data: dailyAnalytics, error: analyticsError } = await supabase
				.from("daily_sales_analytics")
				.select("*")
				.eq("sale_date", dateStr)
				.order("quantity_sold", { ascending: false });

			if (analyticsError) throw analyticsError;

			// 3. Process the data
			processData(orders || [], dailyAnalytics || [], dateStr);
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};
	const processData = (orders, dailyAnalytics) => {
		// Calculate totals from orders
		const totalIncome = orders.reduce(
			(sum, order) => sum + order.total_amount,
			0
		);
		const totalOrders = orders.length;
		const totalItems = orders.reduce(
			(sum, order) => sum + (order.order_items?.length || 0),
			0
		);

		// Calculate payment breakdown
		const cashSales = orders
			.filter((order) => order.payment_method === "cash")
			.reduce((sum, order) => sum + order.total_amount, 0);

		const qrSales = orders
			.filter((order) => order.payment_method === "qr")
			.reduce((sum, order) => sum + order.total_amount, 0);

		// Calculate avg order value
		const avgOrderValue = totalOrders > 0 ? totalIncome / totalOrders : 0;

		// Process pie chart data (top 8 items)
		const topItems = dailyAnalytics.slice(0, 8);
		const totalQuantity = topItems.reduce(
			(sum, item) => sum + item.quantity_sold,
			0
		);

		const dailySales = topItems.map((item) => ({
			name: item.menu_item_name_burmese,
			value: item.quantity_sold,
			percentage:
				totalQuantity > 0 ? (item.quantity_sold / totalQuantity) * 100 : 0,
		}));

		// Prepare item details for modal
		const allItemsTotalQty = dailyAnalytics.reduce(
			(sum, item) => sum + item.quantity_sold,
			0
		);
		const itemDetailsList = dailyAnalytics.map((item) => ({
			item_name: item.menu_item_name_burmese,
			item_english_name: item.menu_item_name_english,
			category: item.menu_item_category,
			price: item.menu_item_price,
			quantity_sold: item.quantity_sold,
			total_revenue: item.total_revenue,
			avg_price:
				item.quantity_sold > 0
					? item.total_revenue / item.quantity_sold
					: item.menu_item_price,
			order_count: item.order_count,
			cash_orders: item.cash_orders,
			qr_orders: item.qr_orders,
			percentage:
				allItemsTotalQty > 0
					? (item.quantity_sold / allItemsTotalQty) * 100
					: 0,
			month_source: item.month_source,
			sale_date: item.sale_date,
		}));

		setSalesData({
			dailySales,
			totalIncome,
			totalExpenses: 0, // Will come from daily_cash_management
			cashSales,
			qrSales,
			totalOrders,
			totalItems,
			avgOrderValue,
		});

		setItemDetails(itemDetailsList);
	};

	const exportToCSV = () => {
		try {
			const headers = [
				"Date",
				"Item Name (Burmese)",
				"Item Name (English)",
				"Category",
				"Price",
				"Quantity Sold",
				"Total Revenue",
				"Average Price",
				"Orders Containing Item",
				"Cash Orders",
				"QR Orders",
				"Percentage of Total",
				"Data Source",
			];

			const csvContent = [
				headers.join(","),
				...itemDetails.map((item) =>
					[
						`"${item.sale_date}"`,
						`"${item.item_name || ""}"`,
						`"${item.item_english_name || ""}"`,
						`"${item.category || ""}"`,
						item.price,
						item.quantity_sold,
						item.total_revenue,
						item.avg_price.toFixed(2),
						item.order_count,
						item.cash_orders,
						item.qr_orders,
						item.percentage.toFixed(1),
						`"${item.month_source}"`,
					].join(",")
				),
			].join("\n");

			// Create download link
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const link = document.createElement("a");
			const url = URL.createObjectURL(blob);

			const dateStr = selectedDate.toISOString().split("T")[0];
			link.setAttribute("href", url);
			link.setAttribute("download", `sales_report_${dateStr}.csv`);
			link.style.visibility = "hidden";

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			alert("CSV exported successfully!");
		} catch (error) {
			console.error("Error exporting CSV:", error);
			alert("Failed to export CSV");
		}
	};

	const handleRefresh = () => {
		fetchDashboardData(true);
	};

	const handleDateChange = (daysOffset = 0) => {
		const newDate = new Date(selectedDate);
		newDate.setDate(newDate.getDate() + daysOffset);

		// Don't allow future dates
		const today = new Date();
		if (newDate > today) return;

		// Don't go before min date
		if (dateRange.minDate && newDate < dateRange.minDate) return;

		setSelectedDate(newDate);
	};

	const formatDate = (date) => {
		const bangkokDate = new Date(date);
		bangkokDate.setHours(bangkokDate.getHours() + 7);

		return bangkokDate.toLocaleDateString("en-US", {
			weekday: "short",
			year: "numeric",
			month: "short",
			day: "numeric",
			timeZone: "Asia/Bangkok",
		});
	};

	// For the isToday check
	const isToday = () => {
		const today = new Date();
		const todayBangkok = new Date(today);
		todayBangkok.setHours(todayBangkok.getHours() + 7);

		const selectedBangkok = new Date(selectedDate);
		selectedBangkok.setHours(selectedBangkok.getHours() + 7);

		return selectedBangkok.toDateString() === todayBangkok.toDateString();
	};

	const isYesterday = () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		return selectedDate.toDateString() === yesterday.toDateString();
	};

	if (loading) {
		return <Loading message="Loading dashboard data..." />;
	}

	return (
		<div className="min-h-screen bg-base-100">
			<div className="container mx-auto p-4 md:p-6">
				{/* Header */}
				<PageHeader
					title="Dashboard Analytics"
					description={
						<div className="flex items-center gap-2">
							<span>{formatDate(selectedDate)}</span>
							{!isToday && (
								<span className="badge badge-sm badge-warning">
									Historical View
								</span>
							)}
						</div>
					}
					buttons={[
						{
							type: "button",
							label: "Calendar",
							shortLabel: "Calendar",
							icon: Calendar,
							onClick: () => setShowDatePicker(true),
							variant: "outline",
						},
						{
							type: "button",
							label: "Refresh",
							shortLabel: "Refresh",
							icon: RefreshCw,
							onClick: handleRefresh,
							variant: "outline",
							loading: refreshing,
						},
						{
							type: "button",
							label: "Export Report",
							shortLabel: "Export",
							icon: Download,
							onClick: () => setShowItemDetails(true),
							variant: "primary",
						},
					]}
				/>

				{/* Date Navigation */}
				<div className="mb-6">
					<div className="flex items-center justify-between bg-base-200 rounded-lg p-3">
						<div className="flex items-center gap-2">
							<button
								className="btn btn-circle btn-sm"
								onClick={() => handleDateChange(-1)}
								disabled={
									dateRange.minDate && selectedDate <= dateRange.minDate
								}>
								<ChevronLeft className="w-4 h-4" />
							</button>

							<button
								className="btn btn-ghost btn-sm"
								onClick={() => setShowDatePicker(true)}>
								{formatDate(selectedDate)}
							</button>

							<button
								className="btn btn-circle btn-sm"
								onClick={() => handleDateChange(1)}
								disabled={
									selectedDate.toDateString() === new Date().toDateString()
								}>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>

						<div className="flex gap-2">
							<button
								className={`btn btn-sm ${
									isYesterday() ? "btn-primary" : "btn-ghost"
								}`}
								onClick={() => {
									const yesterday = new Date();
									yesterday.setDate(yesterday.getDate() - 1);
									setSelectedDate(yesterday);
								}}>
								Yesterday
							</button>

							<button
								className={`btn btn-sm ${
									isToday ? "btn-primary" : "btn-ghost"
								}`}
								onClick={() => setSelectedDate(new Date())}>
								Today
							</button>
						</div>
					</div>

					{!isToday && (
						<div className="mt-2 text-center">
							<div className="alert alert-warning alert-sm">
								<span>
									Viewing historical data. Today's data is not included.
								</span>
							</div>
						</div>
					)}
				</div>

				{/* Summary Cards */}
				<SummaryCards salesData={salesData} />

				{/* Charts Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					<PieChartCard
						dailySales={salesData.dailySales}
						totalItems={salesData.totalItems}
						onChartClick={() => setShowItemDetails(true)}
						date={selectedDate}
					/>

					<PerformanceCard salesData={salesData} />
				</div>

				{/* Stats Card */}
				{/* <StatsCard salesData={salesData} /> */}
			</div>

			{/* Date Picker Modal */}
			{showDatePicker && (
				<div className="modal modal-open">
					<div className="modal-box">
						<h3 className="font-bold text-lg mb-4">Select Date</h3>
						<input
							type="date"
							className="input input-bordered w-full"
							value={selectedDate.toISOString().split("T")[0]}
							max={new Date().toISOString().split("T")[0]}
							min={
								dateRange.minDate
									? dateRange.minDate.toISOString().split("T")[0]
									: undefined
							}
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
							<button
								className="btn btn-primary"
								onClick={() => {
									setShowDatePicker(false);
									fetchDashboardData();
								}}>
								View Analytics
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Item Details Modal */}
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
