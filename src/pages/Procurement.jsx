// src/pages/Procurement.jsx
import { useState, useEffect } from "react";
import { ShoppingBag, History, Package, Plus } from "lucide-react";
import { supabase } from "../services/supabase";
import MarketListTab from "../components/procurement/MarketListTab";
import HistoryTab from "../components/procurement/HistoryTab";
import CartDrawer from "../components/procurement/CartDrawer";
import { Loading } from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";
import useProcurementStore from "../stores/useProcurementStore";

const Procurement = () => {
	const [activeTab, setActiveTab] = useState("market-list");
	const [user, setUser] = useState(null);

	const {
		fetchVendors,
		fetchInventoryItems,
		fetchActiveCart,
		fetchMarketLists,
		loading,
		error,
		setCurrentUser,
	} = useProcurementStore();

	useEffect(() => {
		// Get current user
		const getUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				setUser(user);
				setCurrentUser(user);

				// Fetch all necessary data
				await Promise.all([
					fetchVendors(),
					fetchInventoryItems(),
					fetchActiveCart(user.id),
					fetchMarketLists("Ordered"),
				]);
			}
		};

		getUser();

		// Subscribe to auth changes
		const { data: authListener } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				if (session?.user) {
					setUser(session.user);
					setCurrentUser(session.user);
					await fetchActiveCart(session.user.id);
				} else {
					setUser(null);
					setCurrentUser(null);
				}
			}
		);

		return () => {
			authListener?.subscription.unsubscribe();
		};
	}, []);

	const tabs = [
		{ id: "market-list", label: "Market List", icon: ShoppingBag },
		{ id: "history", label: "History", icon: History },
	];

	if (loading && !user) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loading size="lg" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Procurement"
				icon={Package}
				actions={
					<button
						onClick={() => useProcurementStore.getState().toggleCart()}
						className="btn btn-primary btn-sm gap-2 lg:hidden">
						<ShoppingBag className="w-4 h-4" />
						View Cart
					</button>
				}
			/>

			{/* Tabs */}
			<div className="tabs tabs-boxed bg-base-200 p-1">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`tab gap-2 ${activeTab === tab.id ? "tab-active" : ""}`}>
						<tab.icon className="w-4 h-4" />
						<span className="hidden sm:inline">{tab.label}</span>
					</button>
				))}
			</div>

			{/* Error message */}
			{error && (
				<div className="alert alert-error">
					<span>{error}</span>
				</div>
			)}

			{/* Tab content */}
			<div className="mt-6">
				{activeTab === "market-list" && <MarketListTab userId={user?.id} />}
				{activeTab === "history" && <HistoryTab />}
			</div>

			{/* Cart Drawer - visible on all tabs */}
			<CartDrawer userId={user?.id} />
		</div>
	);
};

export default Procurement;
