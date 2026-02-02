// pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { RefreshCw, Download } from "lucide-react";
import {
	SummaryCards,
	PieChartCard,
	PerformanceCard,
	StatsCard,
	ItemDetailsModal,
} from "../components/dashboard";
import { Loading } from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";

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

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async (isRefresh = false) => {
		try {
			if (isRefresh) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}

			// Get today's date boundaries (Bangkok time)
			const today = new Date();
			const startOfDay = new Date(today);
			startOfDay.setHours(0, 0, 0, 0);

			const endOfDay = new Date(today);
			endOfDay.setHours(23, 59, 59, 999);

			// 1. Fetch today's completed orders
			const { data: orders, error: ordersError } = await supabase
				.from("orders")
				.select("id, created_at, total_amount, payment_method, order_items")
				.eq("pos_order_status", "completed")
				.eq("payment_status", "paid")
				.gte("created_at", startOfDay.toISOString())
				.lte("created_at", endOfDay.toISOString());

			if (ordersError) throw ordersError;

			// 2. Fetch aggregated item data from the view
			const { data: itemSales, error: itemsError } = await supabase
				.from("today_sales_dashboard")
				.select("*")
				.order("quantity_sold", { ascending: false });

			if (itemsError) throw itemsError;

			// 3. Process data in frontend
			processData(orders || [], itemSales || []);
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const processData = (orders, itemSales) => {
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
		const topItems = itemSales.slice(0, 8);
		const totalQuantity = topItems.reduce(
			(sum, item) => sum + item.quantity_sold,
			0
		);

		const dailySales = topItems.map((item) => ({
			name: item.item_name_burmese,
			value: item.quantity_sold,
			percentage:
				totalQuantity > 0 ? (item.quantity_sold / totalQuantity) * 100 : 0,
		}));

		// Prepare item details for modal
		const allItemsTotalQty = itemSales.reduce(
			(sum, item) => sum + item.quantity_sold,
			0
		);
		const itemDetailsList = itemSales.map((item) => ({
			item_name: item.item_name_burmese,
			item_english_name: item.item_name_english,
			category: item.category,
			price: item.price,
			quantity_sold: item.quantity_sold,
			total_revenue: item.total_revenue,
			avg_price:
				item.quantity_sold > 0
					? item.total_revenue / item.quantity_sold
					: item.price,
			order_count: item.order_count,
			cash_orders: item.cash_orders,
			qr_orders: item.qr_orders,
			percentage:
				allItemsTotalQty > 0
					? (item.quantity_sold / allItemsTotalQty) * 100
					: 0,
			first_sale_time: item.first_sale_time,
			last_sale_time: item.last_sale_time,
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
				"First Sale Time",
				"Last Sale Time",
			];

			const csvContent = [
				headers.join(","),
				...itemDetails.map((item) =>
					[
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
						`"${
							item.first_sale_time
								? new Date(item.first_sale_time).toLocaleTimeString()
								: ""
						}"`,
						`"${
							item.last_sale_time
								? new Date(item.last_sale_time).toLocaleTimeString()
								: ""
						}"`,
					].join(",")
				),
			].join("\n");

			// Create download link
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const link = document.createElement("a");
			const url = URL.createObjectURL(blob);

			link.setAttribute("href", url);
			link.setAttribute(
				"download",
				`sales_${new Date().toISOString().split("T")[0]}.csv`
			);
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

	const today = new Date();
	const formattedDate = today.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	if (loading) {
		return <Loading message="Loading dashboard data..." />;
	}

	return (
		<div className="min-h-screen bg-base-100">
			<div className="container mx-auto p-4 md:p-6">
				{/* Header */}
				<PageHeader
					title="Dashboard Analytics"
					description={formattedDate}
					buttons={[
						{
							type: "button",
							label: "Refresh Data",
							shortLabel: "Refresh",
							icon: RefreshCw,
							onClick: handleRefresh,
							variant: "outline",
							loading: refreshing,
						},
						{
							type: "button",
							label: "Export Full Report",
							shortLabel: "Export",
							icon: Download,
							onClick: () => setShowItemDetails(true),
							variant: "primary",
						},
					]}
				/>

				{/* Summary Cards */}
				<SummaryCards salesData={salesData} />

				{/* Charts Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					<PieChartCard
						dailySales={salesData.dailySales}
						totalItems={salesData.totalItems}
						onChartClick={() => setShowItemDetails(true)}
					/>

					<PerformanceCard salesData={salesData} />
				</div>

				{/* Stats Card */}
				{/* <StatsCard salesData={salesData} /> */}
			</div>

			{/* Item Details Modal */}
			<ItemDetailsModal
				isOpen={showItemDetails}
				onClose={() => setShowItemDetails(false)}
				itemDetails={itemDetails}
				date={today.toLocaleDateString()}
				onExportCSV={exportToCSV}
			/>
		</div>
	);
};

export default Dashboard;
