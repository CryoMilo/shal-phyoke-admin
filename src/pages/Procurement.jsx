// src/pages/Procurement.jsx
import React, { useEffect, useState } from "react";
import { ShoppingBag, Truck, History, Package, Settings } from "lucide-react";
import useProcurementStore from "../stores/procurementStore";
import { Loading } from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";
import MarketListTab from "../components/procurement/MarketListTab";
import EditVendorsModal from "../components/procurement/EditVendorsModal";

const Procurement = () => {
	const {
		activeTab,
		setActiveTab,
		loading,
		fetchVendors,
		fetchInventoryItems,
		fetchMarketList,
	} = useProcurementStore();

	const [showVendorsModal, setShowVendorsModal] = useState(false);

	useEffect(() => {
		// Fetch initial data
		const init = async () => {
			await Promise.all([
				fetchVendors(),
				fetchInventoryItems(),
				fetchMarketList(),
			]);
		};

		init();
	}, []);

	const tabs = [
		{ id: "market-list", label: "Market List", icon: ShoppingBag },
		{ id: "order-status", label: "Order Status", icon: Truck },
		{ id: "order-history", label: "Order History", icon: History },
	];

	if (loading) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6">
			<PageHeader
				title="Procurement"
				description="Manage your shopping list and track orders"
				icon={Package}
				buttons={[
					{
						type: "button",
						label: "Edit Vendors",
						shortLabel: "Vendors",
						icon: Settings,
						onClick: () => setShowVendorsModal(true),
						variant: "ghost",
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

			{/* Tab Content */}
			{activeTab === "market-list" && <MarketListTab />}
			{activeTab === "order-status" && (
				<div className="text-center py-12">
					<Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
					<p className="text-gray-500">Order Status tab coming soon...</p>
				</div>
			)}
			{activeTab === "order-history" && (
				<div className="text-center py-12">
					<History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
					<p className="text-gray-500">Order History tab coming soon...</p>
				</div>
			)}

			{/* Edit Vendors Modal */}
			<EditVendorsModal
				isOpen={showVendorsModal}
				onClose={() => setShowVendorsModal(false)}
			/>
		</div>
	);
};

export default Procurement;
