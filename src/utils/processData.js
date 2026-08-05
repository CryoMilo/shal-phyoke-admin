import { startOfMonth, endOfMonth, differenceInDays } from "date-fns";

// Helper functions
const getSafeNumber = (value) => parseFloat(value) || 0;

const calculateDailyOverheadCost = (monthlyOverheads, selectedDate, openingDays = [1, 2, 3, 4, 5, 6]) => {
	if (!monthlyOverheads || monthlyOverheads.length === 0) return 0;

	// Check if selectedDate is an open day
	const dayOfWeek = selectedDate.getDay();
	if (!openingDays.includes(dayOfWeek)) {
		return 0; // Closed day, overhead is 0
	}

	const monthStart = startOfMonth(selectedDate);
	const monthEnd = endOfMonth(selectedDate);

	// Count number of open days in the month
	let openDaysCount = 0;
	const currentDate = new Date(monthStart);
	while (currentDate <= monthEnd) {
		if (openingDays.includes(currentDate.getDay())) {
			openDaysCount++;
		}
		currentDate.setDate(currentDate.getDate() + 1);
	}

	// Calculate total overheads for the month (both paid and pending)
	const totalOverheads = monthlyOverheads.reduce((sum, overhead) => {
		return sum + getSafeNumber(overhead.amount);
	}, 0);

	// Return daily portion
	return openDaysCount > 0 ? totalOverheads / openDaysCount : 0;
};

const processSalesData = (orders, aggregatedSales, dateStr) => {
	// Filter completed orders (only completed orders count towards sales income, items sold, and traffic)
	const completedOrders = orders.filter((o) => o.pos_order_status === "completed");
	const cancelledOrders = orders.filter((o) => o.pos_order_status === "cancelled");
	const refundedOrders = orders.filter((o) => o.pos_order_status === "refunded");

	const cancelledCount = cancelledOrders.length;
	const refundedCount = refundedOrders.length;
	const cancelledAmount = cancelledOrders.reduce((sum, o) => sum + getSafeNumber(o.total_amount), 0);
	const refundedAmount = refundedOrders.reduce((sum, o) => sum + getSafeNumber(o.total_amount), 0);

	// totalIncome should be (total_amount - delivery_fee) for completed orders
	const totalIncome = completedOrders.reduce(
		(sum, o) =>
			sum + (getSafeNumber(o.total_amount) - getSafeNumber(o.delivery_fee)),
		0
	);
	const totalDeliveryFees = completedOrders.reduce(
		(sum, o) => sum + getSafeNumber(o.delivery_fee),
		0
	);
	const totalOrders = completedOrders.length;
	const totalItems = completedOrders.reduce(
		(sum, o) => sum + (o.order_items?.length || 0),
		0
	);

	const cashSales = completedOrders
		.filter((o) => o.payment_method?.toLowerCase() === "cash")
		.reduce(
			(sum, o) =>
				sum + (getSafeNumber(o.total_amount) - getSafeNumber(o.delivery_fee)),
			0
		);

	const qrSales = totalIncome - cashSales;
	const avgOrderValue = totalOrders > 0 ? totalIncome / totalOrders : 0;

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
		sale.payment_method?.toLowerCase() === "cash"
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

	// Format item details
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

	const topSellingItems = itemDetailsList.slice(0, 8).map((i) => ({
		name: i.item_name,
		value: i.quantity_sold,
		percentage: i.percentage,
	}));

	// Process hourly traffic (Bangkok Time UTC+7) for completed orders
	const hourlyMap = {};
	for (let h = 0; h < 24; h++) {
		const hourLabel = `${h.toString().padStart(2, "0")}:00`;
		hourlyMap[hourLabel] = { hour: hourLabel, orders: 0, revenue: 0 };
	}

	completedOrders.forEach((o) => {
		if (o.created_at) {
			const dateObj = new Date(o.created_at);
			// Convert to Bangkok hour (UTC+7)
			const bangkokHour = (dateObj.getUTCHours() + 7) % 24;
			const hourLabel = `${bangkokHour.toString().padStart(2, "0")}:00`;
			const amount = getSafeNumber(o.total_amount) - getSafeNumber(o.delivery_fee);
			hourlyMap[hourLabel].orders += 1;
			hourlyMap[hourLabel].revenue += amount;
		}
	});

	const hourlyTraffic = Object.values(hourlyMap);

	return {
		totalIncome,
		totalDeliveryFees,
		cashSales,
		qrSales,
		totalOrders,
		totalItems,
		avgOrderValue,
		itemDetailsList,
		topSellingItems,
		hourlyTraffic,
		cancelledCount,
		cancelledAmount,
		refundedCount,
		refundedAmount,
	};
};

const processDailyExpenses = (dailyExpenses) => {
	const totalDailyExpenses = dailyExpenses.reduce(
		(sum, expense) => sum + getSafeNumber(expense.amount),
		0
	);

	// Categorize daily expenses
	const dailyExpenseByCategory = dailyExpenses.reduce((acc, expense) => {
		const category = expense.category || "other";
		if (!acc[category]) acc[category] = 0;
		acc[category] += getSafeNumber(expense.amount);
		return acc;
	}, {});

	// Expenses by payment source
	const expenseByPaidBy = dailyExpenses.reduce((acc, expense) => {
		const paidBy = expense.paid_by || "cash_drawer";
		if (!acc[paidBy]) acc[paidBy] = 0;
		acc[paidBy] += getSafeNumber(expense.amount);
		return acc;
	}, {});

	return {
		totalDailyExpenses,
		dailyExpenseByCategory,
		expenseByPaidBy,
	};
};

const processMonthlyOverheads = (monthlyOverheads, selectedDate, openingDays = [1, 2, 3, 4, 5, 6]) => {
	const totalMonthlyOverheads = monthlyOverheads.reduce(
		(sum, overhead) => sum + getSafeNumber(overhead.amount),
		0
	);

	// Calculate paid vs pending overheads
	const paidOverheads = monthlyOverheads
		.filter((o) => o.paid_date)
		.reduce((sum, o) => sum + getSafeNumber(o.amount), 0);

	const pendingOverheads = totalMonthlyOverheads - paidOverheads;

	// Find overdue overheads
	const now = new Date();
	const overdueOverheads = monthlyOverheads
		.filter((o) => !o.paid_date && o.due_date && new Date(o.due_date) < now)
		.reduce((sum, o) => sum + getSafeNumber(o.amount), 0);

	// Categorize monthly overheads using new categories
	const monthlyOverheadByCategory = monthlyOverheads.reduce((acc, overhead) => {
		const category = overhead.category || "other";
		if (!acc[category]) acc[category] = 0;
		acc[category] += getSafeNumber(overhead.amount);
		return acc;
	}, {});

	// Calculate daily portion for dashboard
	const dailyOverheadCost = calculateDailyOverheadCost(
		monthlyOverheads,
		selectedDate,
		openingDays
	);

	return {
		totalMonthlyOverheads,
		paidOverheads,
		pendingOverheads,
		overdueOverheads,
		monthlyOverheadByCategory,
		dailyOverheadCost, // This is what shows in dashboard
	};
};

const processCashData = (dailyCash, cashSales) => {
	const cashCollected = getSafeNumber(dailyCash?.cash_collected);
	const cashDeposited = getSafeNumber(dailyCash?.cash_deposited);
	const openingBalance = getSafeNumber(dailyCash?.opening_balance);

	// Cash variance = Actual collected - (Opening + Cash sales)
	const expectedCash = openingBalance + cashSales;
	const cashVariance = cashCollected - expectedCash;

	const cashShortage = cashCollected - cashDeposited;

	return {
		dailyCash: {
			opening_balance: openingBalance,
			cash_collected: cashCollected,
			cash_deposited: cashDeposited,
			cash_shortage: cashShortage,
		},
		cashVariance,
		expectedCash,
	};
};

export const processDashboardData = (
	orders,
	aggregatedSales,
	dailyExpenses,
	dailyCash,
	monthlyOverheads,
	selectedDate,
	dateStr,
	openingDays = [1, 2, 3, 4, 5, 6]
) => {
	// Process each section
	const salesData = processSalesData(orders, aggregatedSales, dateStr);
	const expensesData = processDailyExpenses(dailyExpenses);
	const overheadsData = processMonthlyOverheads(monthlyOverheads, selectedDate, openingDays);
	const cashData = processCashData(dailyCash, salesData.cashSales);

	// Calculate totals
	const totalExpenses =
		expensesData.totalDailyExpenses + overheadsData.dailyOverheadCost;
	const netProfit = salesData.totalIncome - totalExpenses;
	const profitMargin =
		salesData.totalIncome > 0 ? (netProfit / salesData.totalIncome) * 100 : 0;

	// Daily profit (income - daily expenses)
	const dailyProfit = salesData.totalIncome - expensesData.totalDailyExpenses;

	// Calculate ratios
	const expenseToIncomeRatio =
		salesData.totalIncome > 0
			? (totalExpenses / salesData.totalIncome) * 100
			: 0;

	const dailyExpenseToIncomeRatio =
		salesData.totalIncome > 0
			? (expensesData.totalDailyExpenses / salesData.totalIncome) * 100
			: 0;

	const overheadToIncomeRatio =
		salesData.totalIncome > 0
			? (overheadsData.dailyOverheadCost / salesData.totalIncome) * 100
			: 0;

	// Return complete dashboard data
	return {
		// Sales Data
		dailySales: salesData.topSellingItems,
		hourlyTraffic: salesData.hourlyTraffic,
		totalIncome: salesData.totalIncome,
		totalDeliveryFees: salesData.totalDeliveryFees,
		cashSales: salesData.cashSales,
		qrSales: salesData.qrSales,
		totalOrders: salesData.totalOrders,
		totalItems: salesData.totalItems,
		avgOrderValue: salesData.avgOrderValue,
		itemDetailsList: salesData.itemDetailsList,
		cancelledCount: salesData.cancelledCount,
		cancelledAmount: salesData.cancelledAmount,
		refundedCount: salesData.refundedCount,
		refundedAmount: salesData.refundedAmount,

		// Expense Data (DAILY ONLY in dashboard)
		totalDailyExpenses: expensesData.totalDailyExpenses,
		totalExpenses, // This includes daily portion of overheads

		// Overhead Data (for separate display)
		totalMonthlyOverheads: overheadsData.totalMonthlyOverheads,
		paidOverheads: overheadsData.paidOverheads,
		pendingOverheads: overheadsData.pendingOverheads,
		overdueOverheads: overheadsData.overdueOverheads,
		dailyOverheadCost: overheadsData.dailyOverheadCost, // This goes to dashboard

		// Breakdowns
		dailyExpenseByCategory: expensesData.dailyExpenseByCategory,
		monthlyOverheadByCategory: overheadsData.monthlyOverheadByCategory,
		expenseByPaidBy: expensesData.expenseByPaidBy,

		// Cash Data
		dailyCash: cashData.dailyCash,
		cashVariance: cashData.cashVariance,
		expectedCash: cashData.expectedCash,

		// Profit Data
		netProfit,
		dailyProfit,
		profitMargin,

		// Ratios
		expenseToIncomeRatio,
		dailyExpenseToIncomeRatio,
		overheadToIncomeRatio,

		// Raw Data for Components
		dailyExpenses: dailyExpenses || [],
		monthlyOverheads: monthlyOverheads || [],

		// Time Context
		date: dateStr,
	};
};
