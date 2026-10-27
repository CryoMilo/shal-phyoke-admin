// src/pages/KitchenLogs.jsx
import React, { useState, useEffect } from "react";
import { Plus, AlertTriangle, Calendar, Clock, RefreshCw } from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Loading } from "../components/common/Loading";
import useKitchenLogStore from "../stores/kitchenLogStore";
import useRecipeStore from "../stores/recipeStore";
import useInventoryStore from "../stores/inventoryStore";
import KitchenLogsCalendar from "../components/kitchenLogs/KitchenLogsCalendar";
import ShiftDayLedger from "../components/kitchenLogs/ShiftDayLedger";
import LogBatchModal from "../components/kitchenLogs/LogBatchModal";
import LogSpoilageModal from "../components/kitchenLogs/LogSpoilageModal";

const KitchenLogs = () => {
	const {
		logs,
		selectedDate,
		loading,
		setSelectedDate,
		fetchLogs,
		deleteLog,
		getLogsForDate,
	} = useKitchenLogStore();

	const { fetchRecipes } = useRecipeStore();
	const { fetchInventoryItems } = useInventoryStore();

	const [viewMode, setViewMode] = useState("day"); // 'day' | 'month'
	const [showBatchModal, setShowBatchModal] = useState(false);
	const [showSpoilageModal, setShowSpoilageModal] = useState(false);

	useEffect(() => {
		// Fetch logs for surrounding 60-day window
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
			.toISOString()
			.split("T")[0];
		const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
			.toISOString()
			.split("T")[0];

		fetchLogs(start, end);
		fetchRecipes();
		fetchInventoryItems();
	}, [fetchLogs, fetchRecipes, fetchInventoryItems]);

	const { preps, spoilages } = getLogsForDate(selectedDate);

	if (loading && logs.length === 0) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-3 md:p-6 space-y-5">
			{/* Standard Reusable PageHeader */}
			<PageHeader
				title="Kitchen Prep & Spoilage Log"
				description="Chronological shift tracking of prepared batches, recipe outputs, and food waste."
				buttons={[
					{
						type: "custom",
						component: (
							<div key="view-toggle" className="join bg-base-200 p-1 rounded-xl shadow-inner">
								<button
									type="button"
									onClick={() => setViewMode("day")}
									className={`join-item btn btn-sm gap-1.5 border-none ${
										viewMode === "day"
											? "btn-primary shadow-sm"
											: "btn-ghost text-base-content/70"
									}`}>
									<Clock className="w-4 h-4" />
									<span className="text-xs">Day Ledger</span>
								</button>
								<button
									type="button"
									onClick={() => setViewMode("month")}
									className={`join-item btn btn-sm gap-1.5 border-none ${
										viewMode === "month"
											? "btn-primary shadow-sm"
											: "btn-ghost text-base-content/70"
									}`}>
									<Calendar className="w-4 h-4" />
									<span className="text-xs">Month Calendar</span>
								</button>
							</div>
						),
					},
					{
						type: "button",
						label: "Log Batch",
						shortlabel: "Batch",
						icon: Plus,
						onClick: () => setShowBatchModal(true),
						variant: "primary",
					},
					{
						type: "button",
						label: "Log Waste",
						shortlabel: "Waste",
						icon: AlertTriangle,
						onClick: () => setShowSpoilageModal(true),
						variant: "outline",
					},
					{
						type: "custom",
						component: (
							<button
								key="refresh-btn"
								type="button"
								onClick={() => {
									const now = new Date();
									const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
									const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split("T")[0];
									fetchLogs(start, end);
								}}
								className="btn btn-sm btn-ghost btn-square"
								title="Refresh Logs">
								<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
							</button>
						),
					},
				]}
			/>

			{/* Main Workspace Layout */}
			{viewMode === "month" ? (
				/* Month Calendar View */
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
					<div className="lg:col-span-7 xl:col-span-8">
						<KitchenLogsCalendar
							logs={logs}
							selectedDate={selectedDate}
							onSelectDate={(date) => {
								setSelectedDate(date);
								setViewMode("day");
							}}
						/>
					</div>

					<div className="lg:col-span-5 xl:col-span-4">
						<ShiftDayLedger
							selectedDate={selectedDate}
							preps={preps}
							spoilages={spoilages}
							onOpenLogBatch={() => setShowBatchModal(true)}
							onOpenLogSpoilage={() => setShowSpoilageModal(true)}
							onDeleteLog={deleteLog}
						/>
					</div>
				</div>
			) : (
				/* Day Ledger View (Default for staff) */
				<div className="space-y-4">
					<ShiftDayLedger
						selectedDate={selectedDate}
						preps={preps}
						spoilages={spoilages}
						onOpenLogBatch={() => setShowBatchModal(true)}
						onOpenLogSpoilage={() => setShowSpoilageModal(true)}
						onDeleteLog={deleteLog}
					/>
				</div>
			)}

			{/* Modals */}
			<LogBatchModal
				showModal={showBatchModal}
				setShowModal={setShowBatchModal}
				defaultDate={selectedDate}
			/>

			<LogSpoilageModal
				showModal={showSpoilageModal}
				setShowModal={setShowSpoilageModal}
				defaultDate={selectedDate}
			/>
		</div>
	);
};

export default KitchenLogs;
