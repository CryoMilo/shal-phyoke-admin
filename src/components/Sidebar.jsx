import React, { useState } from "react";
import { Link, useLocation, Outlet } from "@tanstack/react-router";
import {
	Home,
	UtensilsCrossed,
	Users,
	CreditCard,
	Calendar,
	CheckCheck,
	ListOrdered,
	Menu,
	ChevronLeft,
	ChevronRight,
	ShoppingBasket,
} from "lucide-react";

const Sidebar = () => {
	const location = useLocation();
	const [isCollapsed, setIsCollapsed] = useState(false);

	const menuItems = [
		{
			name: "Dashboard",
			path: "/",
			icon: Home,
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
			name: "Weekly Menu",
			path: "/weekly-menu",
			icon: Calendar,
		},
		{
			name: "Menu Status",
			path: "/menu-status",
			icon: CheckCheck,
		},
		{
			name: "Subscribers",
			path: "/subscribers",
			icon: Users,
		},
		{
			name: "Subscription Plans",
			path: "/subscription-plans",
			icon: CreditCard,
		},
		{
			name: "Subscriber Orders",
			path: "/subscriber-orders",
			icon: ListOrdered,
		},
		{
			name: "Orders",
			path: "/orders",
			icon: ShoppingBasket,
		},
	];

	const isActiveRoute = (path) => {
		return location.pathname === path;
	};

	const toggleSidebar = () => {
		setIsCollapsed(!isCollapsed);
	};

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
						isCollapsed ? "w-16" : "w-60"
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
					<ul className="menu p-4 space-y-2">
						{menuItems.map((item) => {
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
					<div className="absolute bottom-0 left-0 right-0 p-4 border-t border-base-300">
						{/* Optional: Add collapsed version of footer content if needed */}
						{!isCollapsed && (
							<>
								{/* <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300 cursor-pointer">
									<Settings className="w-5 h-5" />
									<span className="font-medium">Settings</span>
								</div> */}

								{/* <div className="mt-2 p-3 bg-base-300 rounded-lg">
									<div className="flex items-center gap-2 text-sm">
										<div className="w-2 h-2 bg-green-500 rounded-full"></div>
										<span>System Online</span>
									</div>
								</div> */}
							</>
						)}
					</div>
				</aside>
			</div>
		</div>
	);
};

export default Sidebar;
