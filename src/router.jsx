import {
	createRouter,
	createRootRoute,
	createRoute,
} from "@tanstack/react-router";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import AllMenu from "./pages/AllMenu";
import WeeklyMenu from "./pages/WeeklyMenu";
import { MenuStatusManagement } from "./pages/MenuStatusManagement";
import RegularMenu from "./pages/RegularMenu";
import Orders from "./pages/Orders";
import QuickNoteSettings from "./pages/QuickNoteSettings";
import DailyCash from "./pages/DailyCash";
import DailyExpenses from "./pages/DailyExpenses";
import MonthlyOverheads from "./pages/MonthlyOverheads";
import Procurement from "./pages/Procurement";
import InventoryItems from "./pages/InventoryItems";

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

const ordersRoute = createRoute({
	path: "/orders",
	getParentRoute: () => rootRoute,
	component: Orders,
});

const ordersSettingsRoute = createRoute({
	path: "/settings",
	getParentRoute: () => ordersRoute,
	component: QuickNoteSettings,
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

const procurementRoute = createRoute({
	path: "/procurement",
	getParentRoute: () => rootRoute,
	component: Procurement,
});

const inventoryItemsRoute = createRoute({
	path: "/inventory-items",
	getParentRoute: () => rootRoute,
	component: InventoryItems,
});

// 3. Combine all routes
const routeTree = rootRoute.addChildren([
	dashboardRoute,
	allMenuRoute,
	weeklyMenuRoute,
	menuStatusRoute,
	regularMenuRoute,
	ordersRoute.addChildren([ordersSettingsRoute]),
	dailyCashRoute,
	dailyExpensesRoute,
	monthlyOverheadsRoute,
	procurementRoute,
	inventoryItemsRoute,
]);

// 4. Create and export router
export const router = createRouter({ routeTree });
