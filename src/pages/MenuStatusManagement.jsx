import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useMenuStatusStore } from "../stores/useMenuStatusStore";
import { getDayInfo, formatDateRange } from "../utils/dateUtils";
import { Loading } from "../components/common/Loading";
import { showToast } from "../utils/toastUtils";

export const MenuStatusManagement = () => {
	const {
		todayItems,
		tomorrowItems,
		loading,
		publishedWeeklyMenu,
		fetchMenuStatus,
		updateItemStatus,
	} = useMenuStatusStore();

	const [updating, setUpdating] = useState({});

	useEffect(() => {
		fetchMenuStatus();
	}, []);

	const handleStatusChange = async (itemId, newStatus) => {
		setUpdating((prev) => ({ ...prev, [itemId]: true }));

		const result = await updateItemStatus(itemId, newStatus);

		if (result.error) {
			showToast.error("Error updating status");
		} else {
			showToast.success(`Status updated to ${newStatus}`);
		}

		setUpdating((prev) => ({ ...prev, [itemId]: false }));
	};

	const todayInfo = getDayInfo(0);
	const tomorrowInfo = getDayInfo(1);

	const statusOptions = [
		{ value: "Pending", label: "Pending", color: "badge-warning" },
		{ value: "Confirmed", label: "Confirmed", color: "badge-info" },
		{ value: "Cooking", label: "Cooking", color: "badge-warning" },
		{ value: "Available", label: "Available", color: "badge-success" },
		{ value: "Out of Order", label: "Out of Order", color: "badge-error" },
		{ value: "Cancelled", label: "Cancelled", color: "badge-neutral" },
	];

	const getStatusColor = (status) => {
		const option = statusOptions.find((opt) => opt.value === status);
		return option ? option.color : "badge-neutral";
	};

	if (loading) {
		return <Loading />;
	}

	if (!publishedWeeklyMenu) {
		return (
			<div className="container mx-auto p-6">
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body items-center text-center py-12">
						<h2 className="card-title text-2xl mb-4">
							No Published Weekly Menu
						</h2>
						<p className="text-base-content/70 mb-6">
							You need to publish a weekly menu before managing daily status.
						</p>
						<button
							className="btn btn-primary"
							onClick={() => fetchMenuStatus()}>
							<RefreshCw className="w-4 h-4 mr-2" />
							Check Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4 md:p-6">
			{/* Header */}
			<div className="text-center mb-8">
				<h1 className="text-3xl md:text-4xl font-bold mb-2 text-base-content">
					Menu Status Management
				</h1>
				<div className="text-base-content/70 text-sm md:text-base">
					{formatDateRange(
						publishedWeeklyMenu.week_from,
						publishedWeeklyMenu.week_to
					)}
				</div>
			</div>

			{/* Menu Columns */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
				{/* Today Column */}
				<div className="card bg-base-100 shadow-xl border border-base-300">
					<div className="card-body">
						<div className="text-center mb-6">
							<h2 className="card-title text-2xl font-bold justify-center text-base-content mb-2">
								Today ({todayInfo.name})
							</h2>
							<p className="text-base-content/70">{todayInfo.date}</p>
						</div>

						<div className="space-y-4">
							{todayItems.length === 0 ? (
								<div className="text-center py-8 text-base-content/50">
									No menu items for today
								</div>
							) : (
								todayItems.map((item) => (
									<div
										key={item.id}
										className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
										<div className="flex-1">
											<div className="font-semibold text-lg text-base-content">
												{item.menu_items.name_burmese}
											</div>
											<div className="text-base-content/70 text-sm">
												{item.menu_items.category}
											</div>
										</div>

										<div className="flex items-center gap-3">
											<div className={`badge ${getStatusColor(item.status)}`}>
												{item.status}
											</div>

											<div className="relative">
												<select
													className="select select-bordered select-sm w-full min-w-[140px]"
													value={item.status}
													onChange={(e) =>
														handleStatusChange(item.id, e.target.value)
													}
													disabled={updating[item.id]}>
													{statusOptions.map((option) => (
														<option key={option.value} value={option.value}>
															{option.label}
														</option>
													))}
												</select>
												{updating[item.id] && (
													<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
														<span className="loading loading-spinner loading-xs"></span>
													</div>
												)}
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>

				{/* Tomorrow Column */}
				<div className="card bg-base-100 shadow-xl border border-base-300">
					<div className="card-body">
						<div className="text-center mb-6">
							<h2 className="card-title text-2xl font-bold justify-center text-base-content mb-2">
								Tomorrow ({tomorrowInfo.name})
							</h2>
							<p className="text-base-content/70">{tomorrowInfo.date}</p>
						</div>

						<div className="space-y-4">
							{tomorrowItems.length === 0 ? (
								<div className="text-center py-8 text-base-content/50">
									No menu items for tomorrow
								</div>
							) : (
								tomorrowItems.map((item) => (
									<div
										key={item.id}
										className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
										<div className="flex-1">
											<div className="font-semibold text-lg text-base-content">
												{item.menu_items.name_burmese}
											</div>
											<div className="text-base-content/70 text-sm">
												{item.menu_items.category}
											</div>
										</div>

										<div className="flex items-center gap-3">
											<div className={`badge ${getStatusColor(item.status)}`}>
												{item.status}
											</div>

											<div className="relative">
												<select
													className="select select-bordered select-sm w-full min-w-[140px]"
													value={item.status}
													onChange={(e) =>
														handleStatusChange(item.id, e.target.value)
													}
													disabled={updating[item.id]}>
													{statusOptions.map((option) => (
														<option key={option.value} value={option.value}>
															{option.label}
														</option>
													))}
												</select>
												{updating[item.id] && (
													<div className="absolute right-2 top-1/2 transform -translate-y-1/2">
														<span className="loading loading-spinner loading-xs"></span>
													</div>
												)}
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Refresh Button */}
			<div className="text-center mt-8">
				<button
					className="btn btn-outline btn-sm"
					onClick={() => fetchMenuStatus()}
					disabled={loading}>
					<RefreshCw
						className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
					/>
					Refresh Menu
				</button>
			</div>
		</div>
	);
};
