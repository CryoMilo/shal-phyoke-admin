import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useMenuStatusStore } from "../stores/useMenuStatusStore";
import { getDayInfo } from "../utils/getDayInfo";
import { formatDateRange } from "../utils/formatDateRange";
import Loading from "../components/common/Loading";

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
			alert("Error updating status");
		}

		setUpdating((prev) => ({ ...prev, [itemId]: false }));
	};

	const todayInfo = getDayInfo(0);
	const tomorrowInfo = getDayInfo(1);

	const statusOptions = [
		{ value: "Pending", label: "Pending", color: "text-orange-600" },
		{ value: "Confirmed", label: "Confirmed", color: "text-pink-600" },
		{ value: "Cooking", label: "Cooking", color: "text-orange-600" },
		{ value: "Available", label: "Available", color: "text-green-600" },
		{ value: "Out of Order", label: "Out of Order", color: "text-red-600" },
		{ value: "Cancelled", label: "Cancelled", color: "text-gray-600" },
	];

	const getStatusColor = (status) => {
		const option = statusOptions.find((opt) => opt.value === status);
		return option ? option.color : "text-gray-600";
	};

	if (loading) {
		return <Loading />;
	}

	if (!publishedWeeklyMenu) {
		return (
			<div className="container mx-auto p-6">
				<div className="text-center py-20">
					<h1 className="text-3xl font-bold mb-4">No Published Weekly Menu</h1>
					<p className="text-gray-600 mb-4">
						You need to publish a weekly menu before managing daily status.
					</p>
					<button className="btn btn-primary" onClick={() => fetchMenuStatus()}>
						<RefreshCw className="w-4 h-4 mr-2" />
						Check Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen text-white p-6">
			{/* Header */}
			<div className="text-center mb-8">
				<h1 className="text-4xl font-bold mb-2">Menu Status Management</h1>
				<div className="text-gray-400">
					{formatDateRange(
						publishedWeeklyMenu.week_from,
						publishedWeeklyMenu.week_to
					)}
				</div>
			</div>

			{/* Menu Columns */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
				{/* Today Column */}
				<div className="rounded-3xl p-6 border-2 border-gray-600">
					<div className="text-center mb-6">
						<h2 className="text-2xl font-bold mb-2">
							Today ({todayInfo.name})
						</h2>
						<p className="text-gray-400">{todayInfo.date}</p>
					</div>

					<div className="space-y-4">
						{todayItems.length === 0 ? (
							<div className="text-center py-8 text-gray-400">
								No menu items for today
							</div>
						) : (
							todayItems.map((item) => (
								<div
									key={item.id}
									className="flex justify-between items-center p-4 bg-gray-700 rounded-xl">
									<div className="flex-1">
										<div className="font-semibold text-lg">
											{item.menu_items.name_burmese}
										</div>
										<div className="text-gray-300 text-sm">
											{item.menu_items.category}
										</div>
									</div>

									<div className="relative">
										<select
											className={`select select-bordered bg-gray-800 border-gray-600 ${getStatusColor(
												item.status
											)} min-w-[140px]`}
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
												<span className="loading loading-spinner loading-sm"></span>
											</div>
										)}
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Tomorrow Column */}
				<div className="rounded-3xl p-6 border-2 border-gray-600">
					<div className="text-center mb-6">
						<h2 className="text-2xl font-bold mb-2">
							Tomorrow ({tomorrowInfo.name})
						</h2>
						<p className="text-gray-400">{tomorrowInfo.date}</p>
					</div>

					<div className="space-y-4">
						{tomorrowItems.length === 0 ? (
							<div className="text-center py-8 text-gray-400">
								No menu items for tomorrow
							</div>
						) : (
							tomorrowItems.map((item) => (
								<div
									key={item.id}
									className="flex justify-between items-center p-4 bg-gray-700 rounded-xl">
									<div className="flex-1">
										<div className="font-semibold text-lg">
											{item.menu_items.name_burmese}
										</div>
										<div className="text-gray-300 text-sm">
											{item.menu_items.category}
										</div>
									</div>

									<div className="relative">
										<select
											className={`select select-bordered bg-gray-800 border-gray-600 ${getStatusColor(
												item.status
											)} min-w-[140px]`}
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
												<span className="loading loading-spinner loading-sm"></span>
											</div>
										)}
									</div>
								</div>
							))
						)}
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
