// src/pages/ProcurementInsights.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
	Scale,
	Sparkles,
	ClipboardCheck,
	Utensils,
	Calendar,
	RefreshCw,
	TrendingUp,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Loading } from "../components/common/Loading";
import useProcurementInsightsStore from "../stores/procurementInsightsStore";
import useInventoryStore from "../stores/inventoryStore";
import useRecipeStore from "../stores/recipeStore";
import TheoreticalVarianceTable from "../components/procurement/TheoreticalVarianceTable";
import SmartOrderGeneratorCard from "../components/procurement/SmartOrderGeneratorCard";
import KitchenPrepLogModal from "../components/procurement/KitchenPrepLogModal";

const ProcurementInsights = () => {
	const navigate = useNavigate();
	const {
		loading,
		startDate,
		endDate,
		theoreticalConsumption,
		stockAudits,
		suggestedOrders,
		fetchInsightsData,
		setDates,
	} = useProcurementInsightsStore();

	const { inventoryItems, fetchInventoryItems } = useInventoryStore();
	const { fetchRecipes } = useRecipeStore();

	const [activeTab, setActiveTab] = useState("reconciliation"); // 'reconciliation' | 'smart-generator'
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
			{/* Reusable PageHeader */}
			<PageHeader
				title="Procurement Insights & Stock Audits"
				description="Automated BOM theoretical consumption, physical audit reconciliation, and smart replenishment."
				buttons={[
					{
						type: "button",
						label: "Stock Checklist",
						shortlabel: "Checklist",
						icon: ClipboardCheck,
						onClick: () => navigate({ to: "/stock-checklist" }),
						variant: "primary",
					},
					{
						type: "button",
						label: "Kitchen Prep Log",
						shortlabel: "Prep Log",
						icon: Utensils,
						onClick: () => setShowPrepLogModal(true),
						variant: "outline",
					},
					{
						type: "custom",
						component: (
							<button
								key="refresh-btn"
								type="button"
								onClick={fetchInsightsData}
								className="btn btn-sm btn-ghost btn-square"
								title="Refresh Calculations">
								<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
							</button>
						),
					},
				]}
			/>

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
					inventoryItems={inventoryItems}
				/>
			) : (
				<SmartOrderGeneratorCard
					suggestedOrders={suggestedOrders}
				/>
			)}

			<KitchenPrepLogModal
				showModal={showPrepLogModal}
				setShowModal={setShowPrepLogModal}
			/>
		</div>
	);
};

export default ProcurementInsights;
