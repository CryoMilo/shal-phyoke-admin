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

// 3. Combine all routes
const routeTree = rootRoute.addChildren([
	homeRoute,
	allMenuRoute,
	subscriberListRoute,
	subscriptionPlansRoute,
	weeklyMenuRoute,
]);

// 4. Create and export router
export const router = createRouter({ routeTree });
