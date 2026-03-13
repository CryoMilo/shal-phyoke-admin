// Updated src/components/Sidebar.jsx - Add conditional menu items based on role
import { useState } from "react";
import { Link, useLocation, Outlet } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
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
	LogOut,
	User,
} from "lucide-react";

const Sidebar = ({ children }) => {
	const location = useLocation();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const { profile, signOut, isAdmin } = useAuth();

	const isActiveRoute = (path) => {
		return location.pathname === path;
	};

	const toggleSidebar = () => {
		setIsCollapsed(!isCollapsed);
	};

	const handleSignOut = async () => {
		await signOut();
	};

	// Base menu items accessible to all authenticated users
	const baseMenuItems = [
		{
			name: "Dashboard",
			path: "/",
			icon: Home,
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
			name: "Menu Status",
			path: "/menu-status",
			icon: Settings2,
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
	];

	// Finance menu items - only admins can see
	const financeMenuItems = [
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
	];

	// Settings menu items
	const settingsMenuItems = [
		{
			type: "divider",
			label: "Settings",
		},
		{
			name: "Quick Note Settings",
			path: "/orders/settings",
			icon: Settings2,
		},
	];

	// Combine menu items based on role
	const menuStructure = [
		...baseMenuItems,
		...(isAdmin ? financeMenuItems : []),
		...settingsMenuItems,
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
					<div className="flex-none">
						<div className="dropdown dropdown-end">
							<label tabIndex={0} className="btn btn-ghost btn-circle avatar">
								<div className="w-10 rounded-full bg-primary flex items-center justify-center text-primary-content">
									<User className="w-5 h-5" />
								</div>
							</label>
							<ul
								tabIndex={0}
								className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-base-100 rounded-box w-52">
								<li className="menu-title">
									<span>{profile?.full_name || profile?.email}</span>
								</li>
								<li className="menu-title">
									<span className="badge badge-sm">{profile?.role}</span>
								</li>
								<li>
									<a onClick={handleSignOut}>Logout</a>
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Page content */}
				<main className="flex-1 p-4 overflow-x-hidden">
					{children || <Outlet />}
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
					{/* Sidebar Header with User Info */}
					<div className="p-4 border-b border-base-300">
						<div className="flex items-center justify-between">
							{!isCollapsed && (
								<div>
									<p className="text-xl font-bold">Shal Phyoke</p>
									<p className="text-sm text-gray-600">Admin Panel</p>
									<div className="mt-2 flex items-center gap-2">
										<div className="avatar placeholder">
											<div className="bg-primary text-primary-content rounded-full w-8">
												<span className="text-xs">
													{profile?.full_name?.charAt(0) ||
														profile?.email?.charAt(0)}
												</span>
											</div>
										</div>
										<div>
											<p className="text-sm font-medium truncate max-w-[120px]">
												{profile?.full_name || profile?.email}
											</p>
											<p className="text-xs capitalize badge badge-sm">
												{profile?.role}
											</p>
										</div>
									</div>
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

					{/* Logout Button */}
					{!isCollapsed && (
						<div className="p-4 border-t border-base-300">
							<button
								onClick={handleSignOut}
								className="btn btn-ghost btn-sm w-full justify-start gap-2">
								<LogOut className="w-4 h-4" />
								Sign Out
							</button>
						</div>
					)}
				</aside>
			</div>
		</div>
	);
};

export default Sidebar;
