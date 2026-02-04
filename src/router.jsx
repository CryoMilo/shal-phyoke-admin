import {
	createRouter,
	createRootRoute,
	createRoute,
} from "@tanstack/react-router";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import AllMenu from "./pages/AllMenu";
import { SubscribersPage } from "./pages/Subscribers";
import SubscriptionPlansPage from "./pages/SubscriptionPlans";
import WeeklyMenu from "./pages/WeeklyMenu";
import { MenuStatusManagement } from "./pages/MenuStatusManagement";
import { SubscriberOrder } from "./pages/SubscriberOrder";
import RegularMenu from "./pages/RegularMenu";
import { ArchivedOrders } from "./pages/ArchivedOrders";
import Orders from "./pages/Orders";
import DailyCash from "./pages/DailyCash";
import DailyExpenses from "./pages/DailyExpenses";
import MonthlyOverheads from "./pages/MonthlyOverheads";

// 1. Root route
const rootRoute = createRootRoute({ component: App });

// 2. Child routes
const dashboardRoute = createRoute({
	path: "/",
	getParentRoute: () => rootRoute,
	component: Dashboard,
});

const allMenuRoute = createRoute({
	path: "/all-menu",
	getParentRoute: () => rootRoute,
	component: AllMenu,
});

const regularMenuRoute = createRoute({
	path: "/regular-menu",
	getParentRoute: () => rootRoute,
	component: RegularMenu,
});

const subscriberListRoute = createRoute({
	path: "/subscribers",
	getParentRoute: () => rootRoute,
	component: SubscribersPage,
});

const subscriptionPlansRoute = createRoute({
	path: "/subscription-plans",
	getParentRoute: () => rootRoute,
	component: SubscriptionPlansPage,
});

const weeklyMenuRoute = createRoute({
	path: "/weekly-menu",
	getParentRoute: () => rootRoute,
	component: WeeklyMenu,
});

const menuStatusRoute = createRoute({
	path: "/menu-status",
	getParentRoute: () => rootRoute,
	component: MenuStatusManagement,
});

// Subscriber orders with nested routes
const subscriberOrderRoute = createRoute({
	path: "/subscriber-orders",
	getParentRoute: () => rootRoute,
	component: SubscriberOrder,
});

const OrdersRoute = createRoute({
	path: "/orders",
	getParentRoute: () => rootRoute,
	component: Orders,
});

const archivedOrdersRoute = createRoute({
	path: "/subscriber-orders/archived-orders",
	getParentRoute: () => rootRoute,
	component: ArchivedOrders,
});

// Income & Expense Routes
const dailyCashRoute = createRoute({
	path: "/daily-cash",
	getParentRoute: () => rootRoute,
	component: DailyCash,
});

const dailyExpensesRoute = createRoute({
	path: "/daily-expenses",
	getParentRoute: () => rootRoute,
	component: DailyExpenses,
});

const monthlyOverheadsRoute = createRoute({
	path: "/monthly-overheads",
	getParentRoute: () => rootRoute,
	component: MonthlyOverheads,
});

// 3. Combine all routes
const routeTree = rootRoute.addChildren([
	dashboardRoute,
	allMenuRoute,
	subscriberListRoute,
	subscriptionPlansRoute,
	weeklyMenuRoute,
	menuStatusRoute,
	subscriberOrderRoute,
	archivedOrdersRoute,
	regularMenuRoute,
	OrdersRoute,
	dailyCashRoute,
	dailyExpensesRoute,
	monthlyOverheadsRoute,
]);

// 4. Create and export router
export const router = createRouter({ routeTree });
