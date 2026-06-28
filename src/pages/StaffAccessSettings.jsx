import React, { useEffect, useState } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { 
	Shield, 
	Users, 
	Save, 
	RotateCcw,
	Home,
	Calendar,
	ShoppingBasket,
	Layers2,
	UtensilsCrossed,
	Menu,
	Settings2,
	ShoppingCart,
	Box,
	DollarSign,
	TrendingDown,
	FileText,
	Gift,
	CheckCircle2,
	XCircle,
	Printer
} from "lucide-react";
import useStaffAccessStore, { DEFAULT_PERMISSIONS } from "../stores/staffAccessStore";

const ALL_TABS = [
	{ name: "Dashboard", path: "/dashboard", icon: Home, category: "Operations" },
	{ name: "Weekly Menu", path: "/weekly-menu", icon: Calendar, category: "Operations" },
	{ name: "Orders", path: "/orders", icon: ShoppingBasket, category: "Operations" },
	{ name: "Combo Manager", path: "/combo-manager", icon: Layers2, category: "Operations" },
	{ name: "Menu Manager", path: "/all-menu", icon: UtensilsCrossed, category: "Menu" },
	{ name: "Regular Menu Items", path: "/regular-menu", icon: Menu, category: "Menu" },
	{ name: "Menu Status", path: "/menu-status", icon: Settings2, category: "Menu" },
	{ name: "Procurement", path: "/procurement", icon: ShoppingCart, category: "Inventory" },
	{ name: "Inventory Items", path: "/inventory-items", icon: Box, category: "Inventory" },
	{ name: "Daily Cash", path: "/daily-cash", icon: DollarSign, category: "Finance" },
	{ name: "Daily Expenses", path: "/daily-expenses", icon: TrendingDown, category: "Finance" },
	{ name: "Monthly Overheads", path: "/monthly-overheads", icon: FileText, category: "Finance" },
	{ name: "Employee Management", path: "/employee-management", icon: Users, category: "Employees" },
	{ name: "Quick Note Settings", path: "/quick-note-settings", icon: Settings2, category: "Settings" },
];

const StaffAccessSettings = () => {
	const { permissions, autoPrintKitchenTicket, savePermissions, fetchPermissions, loading } = useStaffAccessStore();
	const [tempPermissions, setTempPermissions] = useState(permissions);
	const [tempAutoPrint, setTempAutoPrint] = useState(autoPrintKitchenTicket);

	useEffect(() => {
		fetchPermissions();
	}, [fetchPermissions]);

	useEffect(() => {
		setTempPermissions(permissions);
		setTempAutoPrint(autoPrintKitchenTicket);
	}, [permissions, autoPrintKitchenTicket]);

	const togglePermission = (role, path) => {
		setTempPermissions(prev => {
			const rolePerms = prev[role] || [];
			const newPerms = rolePerms.includes(path)
				? rolePerms.filter(p => p !== path)
				: [...rolePerms, path];
			
			return {
				...prev,
				[role]: newPerms
			};
		});
	};

	const handleSave = async () => {
		await savePermissions(tempPermissions, tempAutoPrint);
	};

	const handleReset = () => {
		if (window.confirm("Are you sure you want to reset all settings to default?")) {
			setTempPermissions(DEFAULT_PERMISSIONS);
			setTempAutoPrint(false);
		}
	};

	const categories = [...new Set(ALL_TABS.map(t => t.category))];

	return (
		<div className="container mx-auto pb-10">
			<PageHeader
				title="Staff Access Settings"
				description="Configure which sidebar tabs are visible for Admins and Staff members."
				buttons={[
					{
						label: "Reset to Default",
						icon: RotateCcw,
						onClick: handleReset,
						variant: "ghost",
					},
					{
						label: loading ? "Saving..." : "Save Changes",
						icon: Save,
						onClick: handleSave,
						variant: "primary",
						disabled: loading,
					},
				]}
			/>

			<div className="space-y-8 mt-6">
				{/* Printer Settings */}
				<div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
					<div className="p-6 bg-accent/5 border-b border-base-300 flex items-center gap-3">
						<div className="p-2 bg-accent/10 rounded-lg text-accent">
							<Printer className="w-6 h-6" />
						</div>
						<div>
							<h2 className="text-xl font-bold">Printer Settings</h2>
							<p className="text-sm opacity-60">Configure automatic ticket printing</p>
						</div>
					</div>
					<div className="p-6">
						<div className="flex items-center justify-between p-4 bg-base-200/50 rounded-2xl border border-base-300">
							<div className="flex items-center gap-4">
								<div className={`p-3 rounded-xl ${tempAutoPrint ? 'bg-success/10 text-success' : 'bg-base-300 text-base-content/30'}`}>
									<Printer className="w-6 h-6" />
								</div>
								<div>
									<h3 className="font-bold text-lg">Auto-Print Kitchen Ticket</h3>
									<p className="text-sm opacity-60">Automatically send a ticket to the kitchen printer when "Process Order" is clicked.</p>
								</div>
							</div>
							<input 
								type="checkbox" 
								className="toggle toggle-primary toggle-lg" 
								checked={tempAutoPrint}
								onChange={(e) => setTempAutoPrint(e.target.checked)}
							/>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Admin Permissions */}
					<div className="card bg-base-100 shadow-sm border border-base-300">
						<div className="card-body p-0">
							<div className="p-6 bg-primary/5 border-b border-base-300 flex items-center gap-3">
								<div className="p-2 bg-primary/10 rounded-lg text-primary">
									<Shield className="w-6 h-6" />
								</div>
								<div>
									<h2 className="text-xl font-bold">Admin Role</h2>
									<p className="text-sm opacity-60">Full system access recommended</p>
								</div>
							</div>
							
							<div className="p-4 space-y-6">
								{categories.map(category => (
									<div key={`admin-${category}`} className="space-y-2">
										<h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50 px-2">{category}</h3>
										<div className="grid grid-cols-1 gap-1">
											{ALL_TABS.filter(t => t.category === category).map(tab => {
												const isEnabled = tempPermissions.admin?.includes(tab.path);
												const Icon = tab.icon;
												return (
													<button
														key={`admin-${tab.path}`}
														onClick={() => togglePermission("admin", tab.path)}
														className={`flex items-center justify-between p-3 rounded-xl transition-all hover:bg-base-200 text-left ${isEnabled ? 'bg-base-100' : 'bg-base-200/30'}`}
													>
														<div className="flex items-center gap-3">
															<div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-base-300 text-base-content/30'}`}>
																<Icon className="w-4 h-4" />
															</div>
															<span className={`font-medium ${isEnabled ? 'text-base-content' : 'text-base-content/40'}`}>
																{tab.name}
															</span>
														</div>
														{isEnabled ? (
															<CheckCircle2 className="w-5 h-5 text-success" />
														) : (
															<XCircle className="w-5 h-5 text-base-content/20" />
														)}
													</button>
												);
											})}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Staff Permissions */}
					<div className="card bg-base-100 shadow-sm border border-base-300">
						<div className="card-body p-0">
							<div className="p-6 bg-secondary/5 border-b border-base-300 flex items-center gap-3">
								<div className="p-2 bg-secondary/10 rounded-lg text-secondary">
									<Users className="w-6 h-6" />
								</div>
								<div>
									<h2 className="text-xl font-bold">Staff Role</h2>
									<p className="text-sm opacity-60">Restricted access for daily operations</p>
								</div>
							</div>

							<div className="p-4 space-y-6">
								{categories.map(category => (
									<div key={`staff-${category}`} className="space-y-2">
										<h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50 px-2">{category}</h3>
										<div className="grid grid-cols-1 gap-1">
											{ALL_TABS.filter(t => t.category === category).map(tab => {
												const isEnabled = tempPermissions.staff?.includes(tab.path);
												const Icon = tab.icon;
												return (
													<button
														key={`staff-${tab.path}`}
														onClick={() => togglePermission("staff", tab.path)}
														className={`flex items-center justify-between p-3 rounded-xl transition-all hover:bg-base-200 text-left ${isEnabled ? 'bg-base-100' : 'bg-base-200/30'}`}
													>
														<div className="flex items-center gap-3">
															<div className={`p-2 rounded-lg ${isEnabled ? 'bg-secondary/10 text-secondary' : 'bg-base-300 text-base-content/30'}`}>
																<Icon className="w-4 h-4" />
															</div>
															<span className={`font-medium ${isEnabled ? 'text-base-content' : 'text-base-content/40'}`}>
																{tab.name}
															</span>
														</div>
														{isEnabled ? (
															<CheckCircle2 className="w-5 h-5 text-success" />
														) : (
															<XCircle className="w-5 h-5 text-base-content/20" />
														)}
													</button>
												);
											})}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StaffAccessSettings;
