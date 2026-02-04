import { startOfMonth, endOfMonth, differenceInDays } from "date-fns";

// Helper functions
const getSafeNumber = (value) => parseFloat(value) || 0;

const calculateDailyOverheadCost = (monthlyOverheads, selectedDate) => {
	if (!monthlyOverheads || monthlyOverheads.length === 0) return 0;

	const monthStart = startOfMonth(selectedDate);
	const monthEnd = endOfMonth(selectedDate);
	const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;

	// Calculate total pending overheads for the month
	const totalPendingOverheads = monthlyOverheads.reduce((sum, overhead) => {
		if (overhead.paid_date) return sum; // Skip paid overheads
		return sum + getSafeNumber(overhead.amount);
	}, 0);

	// Return daily portion
	return daysInMonth > 0 ? totalPendingOverheads / daysInMonth : 0;
};

const processSalesData = (orders, aggregatedSales, dateStr) => {
	const totalIncome = orders.reduce(
		(sum, o) => sum + getSafeNumber(o.total_amount),
		0
	);
	const totalOrders = orders.length;
	const totalItems = orders.reduce(
		(sum, o) => sum + (o.order_items?.length || 0),
		0
	);

	const cashSales = orders
		.filter((o) => o.payment_method === "cash")
		.reduce((sum, o) => sum + getSafeNumber(o.total_amount), 0);

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

	return {
		totalIncome,
		cashSales,
		qrSales,
		totalOrders,
		totalItems,
		avgOrderValue,
		itemDetailsList,
		topSellingItems,
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

const processMonthlyOverheads = (monthlyOverheads, selectedDate) => {
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
		selectedDate
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
	dateStr
) => {
	// Process each section
	const salesData = processSalesData(orders, aggregatedSales, dateStr);
	const expensesData = processDailyExpenses(dailyExpenses);
	const overheadsData = processMonthlyOverheads(monthlyOverheads, selectedDate);
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
		totalIncome: salesData.totalIncome,
		cashSales: salesData.cashSales,
		qrSales: salesData.qrSales,
		totalOrders: salesData.totalOrders,
		totalItems: salesData.totalItems,
		avgOrderValue: salesData.avgOrderValue,
		itemDetailsList: salesData.itemDetailsList,

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
