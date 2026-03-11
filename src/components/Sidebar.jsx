import { useState } from "react";
import { Link, useLocation, Outlet } from "@tanstack/react-router";
import {
	Home,
	UtensilsCrossed,
	Calendar,
	Menu,
	ChevronLeft,
	ChevronRight,
	ShoppingBasket,
	DollarSign,
	FileText,
	Package,
	TrendingDown,
	Box,
	ShoppingCart,
	Settings2,
} from "lucide-react";

const Sidebar = () => {
	const location = useLocation();
	const [isCollapsed, setIsCollapsed] = useState(false);

	const isActiveRoute = (path) => {
		return location.pathname === path;
	};

	const toggleSidebar = () => {
		setIsCollapsed(!isCollapsed);
	};

	const menuStructure = [
		{
			name: "Dashboard",
			path: "/",
			icon: Home,
		},
		{
			type: "divider",
			label: "Finance",
		},
		{
			name: "Daily Cash",
			path: "/daily-cash",
			icon: DollarSign,
		},
		{
			name: "Daily Expenses",
			path: "/daily-expenses",
			icon: TrendingDown,
		},
		{
			name: "Monthly Overheads",
			path: "/monthly-overheads",
			icon: FileText,
		},
		{
			type: "divider",
			label: "Inventory",
		},
		{
			name: "Procurement",
			path: "/procurement",
			icon: ShoppingCart,
		},
		{
			name: "Inventory Items",
			path: "/inventory-items",
			icon: Box,
		},
		{
			type: "divider",
			label: "Menu",
		},
		{
			name: "All Menu Items",
			path: "/all-menu",
			icon: UtensilsCrossed,
		},
		{
			name: "Regular Menu Items",
			path: "/regular-menu",
			icon: Menu,
		},
		{
			type: "divider",
			label: "Operations",
		},
		{
			name: "Weekly Menu",
			path: "/weekly-menu",
			icon: Calendar,
		},
		{
			name: "Orders",
			path: "/orders",
			icon: ShoppingBasket,
		},
		{
			name: "Quick Note Settings",
			path: "/orders/settings",
			icon: Settings2,
		},
	];

	return (
		<div className="drawer lg:drawer-open">
			<input id="my-drawer-2" type="checkbox" className="drawer-toggle" />

			{/* Main content area */}
			<div className="drawer-content flex flex-col">
				{/* Navbar for mobile */}
				<div className="navbar bg-base-300 lg:hidden">
					<div className="flex-none">
						<label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								className="inline-block w-6 h-6 stroke-current">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M4 6h16M4 12h16M4 18h16"></path>
							</svg>
						</label>
					</div>
					<div className="flex-1">
						<span className="text-xl font-bold">Shal Phyoke Admin</span>
					</div>
				</div>

				{/* Page content */}
				<main className="flex-1 p-4">
					<Outlet />
				</main>
			</div>

			{/* Sidebar */}
			<div className="drawer-side">
				<label
					htmlFor="my-drawer-2"
					aria-label="close sidebar"
					className="drawer-overlay"></label>

				<aside
					className={`min-h-full bg-base-200 transition-all duration-300 ${
						isCollapsed ? "w-16" : "w-64"
					}`}>
					{/* Sidebar Header */}
					<div className="p-4 border-b border-base-300">
						<div className="flex items-center justify-between">
							{!isCollapsed && (
								<div>
									<p className="text-xl font-bold">Shal Phyoke</p>
									<p className="text-sm text-gray-600">Admin Panel</p>
								</div>
							)}
							<button
								onClick={toggleSidebar}
								className="btn btn-ghost btn-sm rounded-lg p-1 hover:bg-base-300 transition-colors"
								title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
								{isCollapsed ? (
									<ChevronRight className="w-4 h-4" />
								) : (
									<ChevronLeft className="w-4 h-4" />
								)}
							</button>
						</div>
					</div>

					{/* Navigation Menu */}
					<ul className="menu p-4 space-y-1">
						{menuStructure.map((item, index) => {
							if (item.type === "divider") {
								if (isCollapsed) return null;
								return (
									<div key={`divider-${index}`} className="py-2">
										<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
											{item.label}
										</div>
										<div className="divider my-1"></div>
									</div>
								);
							}

							const Icon = item.icon;
							return (
								<li key={item.path}>
									<Link
										to={item.path}
										className={`flex items-center rounded-lg transition-colors ${
											isActiveRoute(item.path)
												? "bg-primary text-primary-content"
												: "hover:bg-base-300"
										} ${isCollapsed ? "justify-center p-3" : "gap-3 p-3"}`}
										title={isCollapsed ? item.name : ""}>
										<Icon className="w-5 h-5" />
										{!isCollapsed && (
											<span className="font-medium">{item.name}</span>
										)}
									</Link>
								</li>
							);
						})}
					</ul>

					{/* Sidebar Footer */}
					<div className="p-4 border-t border-base-300">
						{!isCollapsed && (
							<div className="text-xs text-gray-500">
								<p>© {new Date().getFullYear()} Shal Phyoke</p>
								<p className="mt-1">Restaurant Management</p>
							</div>
						)}
					</div>
				</aside>
			</div>
		</div>
	);
};

export default Sidebar;
