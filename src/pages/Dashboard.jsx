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
	StatsCard,
	ItemDetailsModal,
} from "../components/dashboard";

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

	// Date selection
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);

	useEffect(() => {
		fetchDashboardData();
	}, [selectedDate]);

	// Convert to Bangkok date string
	const toBangkokDateStr = (date) => {
		const bangkokDate = new Date(date);
		bangkokDate.setHours(bangkokDate.getHours() + 7); // UTC+7
		return bangkokDate.toISOString().split("T")[0];
	};

	const fetchDashboardData = async (isRefresh = false) => {
		try {
			if (isRefresh) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}

			const bangkokDateStr = toBangkokDateStr(selectedDate);
			console.log("📅 Fetching data for Bangkok date:", bangkokDateStr);

			console.log("selected", selectedDate);

			// Get date range for filtering orders (Bangkok time)
			const bangkokDate = new Date(selectedDate);
			bangkokDate.setHours(bangkokDate.getHours() + 7);
			const startOfDay = new Date(bangkokDate);
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date(bangkokDate);
			endOfDay.setHours(23, 59, 59, 999);

			// 1. Fetch orders for the selected date
			const { data: orders, error: ordersError } = await supabase
				.from("orders")
				.select("id, created_at, total_amount, payment_method, order_items")
				.eq("pos_order_status", "completed")
				.eq("payment_status", "paid")
				.gte("created_at", startOfDay.toISOString())
				.lte("created_at", endOfDay.toISOString());

			if (ordersError) throw ordersError;

			// 2. Fetch aggregated sales data from monthly_sales table
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

			// 3. Process the data
			processData(orders || [], aggregatedSales || [], bangkokDateStr);
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const processData = (orders, aggregatedSales, dateStr) => {
		console.log("🔄 Processing data for:", dateStr);
		console.log("📦 Orders:", orders.length);
		console.log("📊 Aggregated sales items:", aggregatedSales.length);

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

		// Aggregate item sales manually from the raw data
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

			if (sale.payment_method === "cash") {
				itemSalesMap[key].cashOrders++;
			} else if (sale.payment_method === "qr") {
				itemSalesMap[key].qrOrders++;
			}
		});

		// Convert to array and sort by quantity
		const itemSalesArray = Object.values(itemSalesMap)
			.map((item) => ({
				...item,
				orderCount: item.orderIds.size,
			}))
			.sort((a, b) => b.quantitySold - a.quantitySold);

		// Prepare pie chart data (top 8 items)
		const topItems = itemSalesArray.slice(0, 8);
		const totalQuantity = topItems.reduce(
			(sum, item) => sum + item.quantitySold,
			0
		);

		const dailySales = topItems.map((item) => ({
			name: item.name,
			value: item.quantitySold,
			percentage:
				totalQuantity > 0 ? (item.quantitySold / totalQuantity) * 100 : 0,
		}));

		// Prepare item details for modal
		const allItemsTotalQty = itemSalesArray.reduce(
			(sum, item) => sum + item.quantitySold,
			0
		);
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
			order_count: item.orderCount,
			cash_orders: item.cashOrders,
			qr_orders: item.qrOrders,
			percentage:
				allItemsTotalQty > 0 ? (item.quantitySold / allItemsTotalQty) * 100 : 0,
			sale_date: dateStr,
		}));

		console.log("✅ Processed dailySales:", dailySales.length, "items");
		console.log("✅ Total items in details:", itemDetailsList.length);

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
					].join(",")
				),
			].join("\n");

			// Create download link
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const link = document.createElement("a");
			const url = URL.createObjectURL(blob);

			const dateStr = toBangkokDateStr(selectedDate);
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

		setSelectedDate(newDate);
	};

	// Fixed date formatting
	const formatDate = (date) => {
		// Convert to Bangkok time for display
		const bangkokDate = new Date(
			date.toLocaleString("en-US", {
				timeZone: "Asia/Bangkok",
			})
		);

		return bangkokDate.toLocaleDateString("en-US", {
			weekday: "short",
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const isToday = () => {
		const today = new Date();
		const todayBangkok = new Date(
			today.toLocaleString("en-US", {
				timeZone: "Asia/Bangkok",
			})
		);

		const selectedBangkok = new Date(
			selectedDate.toLocaleString("en-US", {
				timeZone: "Asia/Bangkok",
			})
		);

		return (
			selectedBangkok.getDate() === todayBangkok.getDate() &&
			selectedBangkok.getMonth() === todayBangkok.getMonth() &&
			selectedBangkok.getFullYear() === todayBangkok.getFullYear()
		);
	};

	if (loading) {
		return <Loading message="Loading dashboard data..." />;
	}

	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	return (
		<div className="min-h-screen bg-base-100">
			<div className="container mx-auto p-4 md:p-6">
				{/* Header */}
				<PageHeader
					title="Dashboard Analytics"
					description={
						<div className="flex items-center gap-2">
							<span>{formatDate(selectedDate)}</span>
							{!isToday() && (
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
								onClick={() => handleDateChange(-1)}>
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
								disabled={selectedDate.toDateString() === today.toDateString()}>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>

						<div className="flex gap-2">
							<button
								className={`btn btn-sm ${
									selectedDate.toDateString() === yesterday.toDateString()
										? "btn-primary"
										: "btn-ghost"
								}`}
								onClick={() => setSelectedDate(yesterday)}>
								Yesterday
							</button>

							<button
								className={`btn btn-sm ${
									isToday() ? "btn-primary" : "btn-ghost"
								}`}
								onClick={() => setSelectedDate(today)}>
								Today
							</button>
						</div>
					</div>
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
							value={selectedDate.toISOString().split("T")[0]}
							max={today.toISOString().split("T")[0]}
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
