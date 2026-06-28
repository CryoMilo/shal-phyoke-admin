// src/components/Sidebar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import useStaffAccessStore from "../stores/staffAccessStore";
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
	TrendingDown,
	Box,
	ShoppingCart,
	Layers2,
	Settings2,
	LogOut,
	ShieldCheck,
	Users,
} from "lucide-react";

const Sidebar = ({ children }) => {
	const location = useLocation();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const { profile, signOut, isAdmin, isStaff } = useAuth();
	const { permissions, fetchPermissions } = useStaffAccessStore();

	useEffect(() => {
		fetchPermissions();
	}, [fetchPermissions]);

	const isActiveRoute = (path) => location.pathname === path;
	const toggleSidebar = () => setIsCollapsed(!isCollapsed);
	const handleSignOut = async () => await signOut();

	const role = isAdmin ? "admin" : isStaff ? "staff" : null;
	const allowedPaths = role ? permissions[role] || [] : [];

	const filterItems = (items) => {
		return items.filter(item => {
			if (item.type === "divider") return true;
			return allowedPaths.includes(item.path);
		}).filter((item, index, self) => {
			// Remove dividers if they are followed by another divider or are at the end
			if (item.type === "divider") {
				const nextItem = self[index + 1];
				if (!nextItem || nextItem.type === "divider") return false;
			}
			return true;
		});
	};

	// All possible menu items
	const allMenuItems = [
		{
			name: "Dashboard",
			path: "/dashboard",
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
			name: "Combo Manager",
			path: "/combo-manager",
			icon: Layers2,
		},
		{
			type: "divider",
			label: "Menu",
		},
		{
			name: "Menu Manager",
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
			label: "Employees",
		},
		{
			name: "Employee Management",
			path: "/employee-management",
			icon: Users,
		},
		{
			type: "divider",
			label: "Settings",
		},
		{
			name: "Quick Note Settings",
			path: "/quick-note-settings",
			icon: Settings2,
		},
	];

	// Filter based on permissions
	const filteredMenu = filterItems(allMenuItems);

	// Add Admin-only Settings at the bottom if not already filtered in
	const finalMenu = [...filteredMenu];
	if (isAdmin) {
		// Ensure a divider exists before admin settings
		if (finalMenu.length > 0 && finalMenu[finalMenu.length - 1].type !== "divider") {
			finalMenu.push({ type: "divider", label: "Admin" });
		}
		finalMenu.push({
			name: "Staff Access",
			path: "/staff-access-settings",
			icon: ShieldCheck,
		});
	}

	return (
		<div className="drawer lg:drawer-open">
			<input id="my-drawer-2" type="checkbox" className="drawer-toggle" />

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
					<div className="flex-1 flex items-center gap-2">
						<div className="avatar">
							<div className="w-8 h-8 rounded-md bg-base-100 flex items-center justify-center p-1 border border-base-300 shadow-sm">
								<img src="/logo.svg" alt="Logo" className="object-contain" />
							</div>
						</div>
						<span className="text-xl font-bold">Shal Phyoke</span>
					</div>
				</div>

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
						isCollapsed ? "w-18" : "w-60"
					}`}>
					{/* Header */}
					<div className="p-4 border-b border-base-300">
						<div className="flex items-center justify-center md:justify-around">
							{!isCollapsed && (
								<div className="flex items-center gap-2">
									<div className="avatar">
										<div className="w-10 h-10 rounded-md bg-base-100 flex items-center justify-center p-1 border border-base-300 shadow-sm">
											<img
												src="/logo.svg"
												alt="Logo"
												className="object-contain"
											/>
										</div>
									</div>
									<div>
										<p className="text-xl font-bold whitespace-nowrap">
											Shal Phyoke
										</p>
										<p className="text-xs capitalize badge badge-sm">
											{profile?.role}
										</p>
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

					{/* Navigation */}
					<ul className="menu p-4 space-y-1">
						{finalMenu.map((item, index) => {
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

					{/* Logout */}
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
