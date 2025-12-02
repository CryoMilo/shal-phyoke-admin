import {
	createRouter,
	createRootRoute,
	createRoute,
} from "@tanstack/react-router";
import App from "./App";
import Home from "./pages/Home";
import AllMenu from "./pages/AllMenu";
import { SubscribersPage } from "./pages/Subscribers";
import SubscriptionPlansPage from "./pages/SubscriptionPlans";
import WeeklyMenu from "./pages/WeeklyMenu";
import { MenuStatusManagement } from "./pages/MenuStatusManagement";
import { SubscriberOrder } from "./pages/SubscriberOrder";
import RegularMenu from "./pages/RegularMenu";
import { ArchivedOrders } from "./pages/ArchivedOrders";
import Orders from "./pages/Orders";

// 1. Root route
const rootRoute = createRootRoute({ component: App });

// 2. Child routes
const homeRoute = createRoute({
	path: "/",
	getParentRoute: () => rootRoute,
	component: Home,
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

// 3. Combine all routes
const routeTree = rootRoute.addChildren([
	homeRoute,
	allMenuRoute,
	subscriberListRoute,
	subscriptionPlansRoute,
	weeklyMenuRoute,
	menuStatusRoute,
	subscriberOrderRoute,
	archivedOrdersRoute,
	regularMenuRoute,
	OrdersRoute,
]);

// 4. Create and export router
export const router = createRouter({ routeTree });
