// src/pages/ProcurementInsights.jsx
import React, { useState, useEffect } from "react";
import {
	Scale,
	Sparkles,
	ClipboardCheck,
	Utensils,
	Calendar,
	RefreshCw,
	TrendingUp,
} from "lucide-react";
import { Loading } from "../components/common/Loading";
import useProcurementInsightsStore from "../stores/procurementInsightsStore";
import useInventoryStore from "../stores/inventoryStore";
import useRecipeStore from "../stores/recipeStore";
import TheoreticalVarianceTable from "../components/procurement/TheoreticalVarianceTable";
import SmartOrderGeneratorCard from "../components/procurement/SmartOrderGeneratorCard";
import StaffStockAuditModal from "../components/procurement/StaffStockAuditModal";
import KitchenPrepLogModal from "../components/procurement/KitchenPrepLogModal";

const ProcurementInsights = () => {
	const {
		loading,
		startDate,
		endDate,
		theoreticalConsumption,
		stockAudits,
		prepLogs,
		suggestedOrders,
		vendors,
		fetchInsightsData,
		setDates,
	} = useProcurementInsightsStore();

	const { inventoryItems, fetchInventoryItems } = useInventoryStore();
	const { fetchRecipes } = useRecipeStore();

	const [activeTab, setActiveTab] = useState("reconciliation"); // 'reconciliation' | 'smart-generator'
	const [showStockAuditModal, setShowStockAuditModal] = useState(false);
	const [showPrepLogModal, setShowPrepLogModal] = useState(false);

	useEffect(() => {
		fetchInsightsData();
		fetchInventoryItems();
		fetchRecipes();
	}, [fetchInsightsData, fetchInventoryItems, fetchRecipes]);

	const handlePresetDates = (days) => {
		const end = new Date().toISOString().split("T")[0];
		const start = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0];
		setDates(start, end);
	};

	if (loading && Object.keys(theoreticalConsumption).length === 0) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6 space-y-5">
			{/* Header & Controls */}
			<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
				<div>
					<h1 className="text-xl sm:text-2xl font-bold text-base-content leading-relaxed">
						Procurement Insights & Stock Audits (ကုန်ကြမ်း အလေအလွင့်နှင့် ဈေးဝယ်အင်ဂျင်)
					</h1>
					<p className="text-xs text-base-content/60">
						Automated BOM Theoretical Consumption, Staff Audit Reconciliation, and Smart Replenishment.
					</p>
				</div>

				{/* Action Modals Trigger Buttons */}
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => setShowStockAuditModal(true)}
						className="btn btn-sm btn-outline gap-1.5">
						<ClipboardCheck className="w-4 h-4 text-primary" />
						Physical Stock Audit
					</button>

					<button
						type="button"
						onClick={() => setShowPrepLogModal(true)}
						className="btn btn-sm btn-outline gap-1.5">
						<Utensils className="w-4 h-4 text-primary" />
						Kitchen Prep Log
					</button>

					<button
						type="button"
						onClick={fetchInsightsData}
						className="btn btn-sm btn-ghost btn-square"
						title="Refresh Calculations">
						<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
					</button>
				</div>
			</div>

			{/* Date Range Picker Bar */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-base-100 border border-base-200 shadow-sm text-xs">
				<div className="flex items-center gap-2">
					<Calendar className="w-4 h-4 text-base-content/60" />
					<span className="font-semibold text-base-content/80">Date Window:</span>
					<div className="flex items-center gap-1.5">
						<input
							type="date"
							value={startDate}
							onChange={(e) => setDates(e.target.value, endDate)}
							className="input input-bordered input-xs"
						/>
						<span className="text-base-content/50">to</span>
						<input
							type="date"
							value={endDate}
							onChange={(e) => setDates(startDate, e.target.value)}
							className="input input-bordered input-xs"
						/>
					</div>
				</div>

				<div className="flex items-center gap-1.5 self-end sm:self-auto">
					<button
						type="button"
						onClick={() => handlePresetDates(7)}
						className="btn btn-ghost btn-xs">
						Last 7 Days
					</button>
					<button
						type="button"
						onClick={() => handlePresetDates(14)}
						className="btn btn-ghost btn-xs">
						Last 14 Days
					</button>
					<button
						type="button"
						onClick={() => handlePresetDates(30)}
						className="btn btn-ghost btn-xs">
						Last 30 Days
					</button>
				</div>
			</div>

			{/* Segmented View Tabs */}
			<div className="tabs tabs-boxed bg-base-200/80 p-1 rounded-2xl w-full sm:w-auto self-start inline-flex">
				<button
					type="button"
					onClick={() => setActiveTab("reconciliation")}
					className={`tab tab-sm gap-2 font-bold ${
						activeTab === "reconciliation" ? "tab-active !bg-primary !text-primary-content shadow-sm" : ""
					}`}>
					<Scale className="w-4 h-4" />
					Theoretical vs Staff Actuals Reconciliation
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("smart-generator")}
					className={`tab tab-sm gap-2 font-bold ${
						activeTab === "smart-generator" ? "tab-active !bg-primary !text-primary-content shadow-sm" : ""
					}`}>
					<Sparkles className="w-4 h-4" />
					Smart Next-Cycle Order Generator ({suggestedOrders.length})
				</button>
			</div>

			{/* Tab Content */}
			{activeTab === "reconciliation" ? (
				<TheoreticalVarianceTable
					theoreticalConsumption={theoreticalConsumption}
					stockAudits={stockAudits}
					prepLogs={prepLogs}
					inventoryItems={inventoryItems}
				/>
			) : (
				<SmartOrderGeneratorCard
					suggestedOrders={suggestedOrders}
					vendors={vendors}
				/>
			)}

			{/* Staff Modals */}
			<StaffStockAuditModal
				showModal={showStockAuditModal}
				setShowModal={setShowStockAuditModal}
			/>

			<KitchenPrepLogModal
				showModal={showPrepLogModal}
				setShowModal={setShowPrepLogModal}
			/>
		</div>
	);
};

export default ProcurementInsights;
