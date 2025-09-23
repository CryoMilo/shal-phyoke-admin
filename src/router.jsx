import {
	createRouter,
	createRootRoute,
	createRoute,
} from "@tanstack/react-router";
import App from "./App";
import Home from "./pages/Home";
import About from "./pages/AboutPage";

import CreatorInfoPage from "./pages/CreatorInfoPage";
import SalesPageContentAgent from "./pages/SalesPageContentAgent";
import WLPageContentAgent from "./pages/WLPageContentAgent";
import EmailContentAgent from "./pages/EmailContentAgent";
import StorePageContentAgent from "./pages/StorePageContentAgent";
import GlobalPreChecks from "./pages/GlobalPreChecks";
import GlobalPostChecks from "./pages/GlobalPostChecks";

// 1. Root route
const rootRoute = createRootRoute({ component: App });

// 2. Child routes
const homeRoute = createRoute({
	path: "/",
	getParentRoute: () => rootRoute,
	component: Home,
});

const aboutRoute = createRoute({
	path: "/about",
	getParentRoute: () => rootRoute,
	component: About,
});

const creatorInfoCreateRoute = createRoute({
	path: "/creator-info/create",
	getParentRoute: () => rootRoute,
	component: CreatorInfoPage,
});

const creatorInfoIdRoute = createRoute({
	path: "/creator-info/$id",
	getParentRoute: () => rootRoute,
	component: CreatorInfoPage,
});

const preChecksRoute = createRoute({
	path: "/pre-checks",
	getParentRoute: () => rootRoute,
	component: GlobalPreChecks,
});

const postChecksRoute = createRoute({
	path: "/post-checks",
	getParentRoute: () => rootRoute,
	component: GlobalPostChecks,
});

const salesPageContentAgentRoute = createRoute({
	path: "/content-agent/sales-page",
	getParentRoute: () => rootRoute,
	component: SalesPageContentAgent,
});

const wlPageContentAgentRoute = createRoute({
	path: "/content-agent/wl-page",
	getParentRoute: () => rootRoute,
	component: WLPageContentAgent,
});

const emailContentAgentRoute = createRoute({
	path: "/content-agent/email",
	getParentRoute: () => rootRoute,
	component: EmailContentAgent,
});

const storePageContentAgentRoute = createRoute({
	path: "/content-agent/store-page/",
	getParentRoute: () => rootRoute,
	component: StorePageContentAgent,
});

// 3. Combine all routes
const routeTree = rootRoute.addChildren([
	homeRoute,
	aboutRoute,
	creatorInfoCreateRoute,
	creatorInfoIdRoute,
	preChecksRoute,
	postChecksRoute,
	salesPageContentAgentRoute,
	wlPageContentAgentRoute,
	emailContentAgentRoute,
	storePageContentAgentRoute,
]);

// 4. Create and export router
export const router = createRouter({ routeTree });
