// src/router.jsx
import {
	createRouter,
	createRootRoute,
	createRoute,
} from "@tanstack/react-router";
import App from "./App";
import Login from "./pages/Login";
import RootIndex from "./pages/RootIndex";
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
import ComboManager from "./pages/ComboManager";
import ProtectedRoute from "./components/ProtectedRoute";

const rootRoute = createRootRoute({
	component: () => <App />,
});

const loginRoute = createRoute({
	path: "/login",
	getParentRoute: () => rootRoute,
	component: Login,
});

// Admin-only routes
const dashboardRoute = createRoute({
	path: "/dashboard",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute requiredRole="admin">
			<Dashboard />
		</ProtectedRoute>
	),
});

// Root index redirect based on role
const rootIndexRoute = createRoute({
	path: "/",
	getParentRoute: () => rootRoute,
	component: RootIndex,
});

const monthlyOverheadsRoute = createRoute({
	path: "/monthly-overheads",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute requiredRole="admin">
			<MonthlyOverheads />
		</ProtectedRoute>
	),
});

// Staff + Admin accessible routes
const allMenuRoute = createRoute({
	path: "/all-menu",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute>
			<AllMenu />
		</ProtectedRoute>
	),
});

const regularMenuRoute = createRoute({
	path: "/regular-menu",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute>
			<RegularMenu />
		</ProtectedRoute>
	),
});

const weeklyMenuRoute = createRoute({
	path: "/weekly-menu",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute>
			<WeeklyMenu />
		</ProtectedRoute>
	),
});

const menuStatusRoute = createRoute({
	path: "/menu-status",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute>
			<MenuStatusManagement />
		</ProtectedRoute>
	),
});

const ordersRoute = createRoute({
	path: "/orders",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute>
			<Orders />
		</ProtectedRoute>
	),
});

const ordersSettingsRoute = createRoute({
	path: "/settings",
	getParentRoute: () => ordersRoute,
	component: () => (
		<ProtectedRoute>
			<QuickNoteSettings />
		</ProtectedRoute>
	),
});

const dailyCashRoute = createRoute({
	path: "/daily-cash",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute>
			<DailyCash />
		</ProtectedRoute>
	),
});

const dailyExpensesRoute = createRoute({
	path: "/daily-expenses",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute>
			<DailyExpenses />
		</ProtectedRoute>
	),
});

const procurementRoute = createRoute({
	path: "/procurement",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute>
			<Procurement />
		</ProtectedRoute>
	),
});

const inventoryItemsRoute = createRoute({
	path: "/inventory-items",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute>
			<InventoryItems />
		</ProtectedRoute>
	),
});

const comboManagerRoute = createRoute({
	path: "/combo-manager",
	getParentRoute: () => rootRoute,
	component: () => (
		<ProtectedRoute>
			<ComboManager />
		</ProtectedRoute>
	),
});

const routeTree = rootRoute.addChildren([
	loginRoute,
	rootIndexRoute,
	dashboardRoute,
	allMenuRoute,
	weeklyMenuRoute,
	menuStatusRoute,
	regularMenuRoute,
	comboManagerRoute,
	ordersRoute.addChildren([ordersSettingsRoute]),
	dailyCashRoute,
	dailyExpensesRoute,
	monthlyOverheadsRoute,
	procurementRoute,
	inventoryItemsRoute,
]);

export const router = createRouter({ routeTree });
