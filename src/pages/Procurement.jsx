// src/pages/Procurement.jsx
import React, { useState, useEffect } from "react";
import { ShoppingBag, History, Package, ShoppingCart } from "lucide-react";
import useProcurementStore from "../stores/procurementStore";
import { supabase } from "../services/supabase";
import { Loading } from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";
import MarketListTab from "../components/procurement/MarketListTab";
import HistoryTab from "../components/procurement/HistoryTab";
import CartDrawer from "../components/procurement/CartDrawer";

const Procurement = () => {
	const {
		activeTab,
		setActiveTab,
		loading,
		fetchVendors,
		fetchInventoryItems,
		fetchActiveCart,
		fetchMarketLists,
		setCurrentUser,
		activeCart,
	} = useProcurementStore();

	const [user, setUser] = useState(null);

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

	const cartItemsCount = activeCart.length;

	if (loading && !user) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6">
			{/* Header */}
			<PageHeader
				title="Procurement"
				description="Manage your market lists and track incoming orders"
				icon={Package}
				buttons={[
					{
						type: "button",
						label: `Cart (${cartItemsCount})`,
						shortLabel: `${cartItemsCount}`,
						icon: ShoppingCart,
						onClick: () => useProcurementStore.getState().toggleCart(),
						variant: "primary",
						badge: cartItemsCount > 0 ? cartItemsCount : null,
					},
				]}
			/>

			{/* Tabs */}
			<div className="tabs tabs-boxed bg-base-200 p-1 mb-6">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`tab gap-2 flex-1 sm:flex-none ${
							activeTab === tab.id ? "tab-active" : ""
						}`}>
						<tab.icon className="w-4 h-4" />
						<span className="hidden sm:inline">{tab.label}</span>
					</button>
				))}
			</div>

			{/* Tab content */}
			{activeTab === "market-list" && <MarketListTab userId={user?.id} />}
			{activeTab === "history" && <HistoryTab />}

			{/* Cart Drawer */}
			<CartDrawer userId={user?.id} />
		</div>
	);
};

export default Procurement;
