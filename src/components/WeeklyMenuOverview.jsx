import React, { useState, useEffect } from "react";
import { Plus, Edit } from "lucide-react";
import { useWeeklyMenuStore } from "../stores/weeklyMenuStore";
import { formatDateRange } from "../utils/formatDateRange";
import { WeeklyMenuPublishControl } from "./WeeklyMenuPublishControl";
import Loading from "./common/Loading";

export const WeeklyMenuOverview = ({ currentWeeklyMenu, onEditWeek }) => {
	const { weeklyMenus, weeklyMenusLoading, fetchWeeklyMenus } =
		useWeeklyMenuStore();

	const [selectedWeek, setSelectedWeek] = useState(currentWeeklyMenu);

	// Fetch list on mount
	useEffect(() => {
		fetchWeeklyMenus();
	}, [fetchWeeklyMenus]);

	// Keep selected week in sync with the latest menu passed from parent
	useEffect(() => {
		if (currentWeeklyMenu) {
			setSelectedWeek(currentWeeklyMenu);
		}
	}, [currentWeeklyMenu]);

	if (weeklyMenusLoading) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-6">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">Menu of the Week</h1>
					<p className="text-gray-600">Weekly menu overview</p>
				</div>
				<button className="btn btn-primary" onClick={() => onEditWeek(null)}>
					<Plus className="w-4 h-4 mr-2" />
					Create Weekly Menu
				</button>
			</div>

			{/* Week Selection Dropdown */}
			{weeklyMenus.length > 0 && (
				<div className="mb-6">
					<select
						className="select select-bordered w-full max-w-xs"
						value={selectedWeek?.id || ""}
						onChange={(e) => {
							const menu = weeklyMenus.find((m) => m.id === e.target.value);
							setSelectedWeek(menu || null);
						}}>
						<option value="">Select a week</option>
						{weeklyMenus.map((menu) => (
							<option key={menu.id} value={menu.id}>
								{formatDateRange(menu.week_from, menu.week_to)}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Weekly Menu Grid */}
			{selectedWeek ? (
				<WeeklyMenuGrid
					currentWeeklyMenu={currentWeeklyMenu}
					weeklyMenu={selectedWeek}
					onEdit={() => onEditWeek(selectedWeek)}
				/>
			) : (
				<div className="text-center py-12">
					<p className="text-gray-500 text-lg">
						{weeklyMenus.length === 0
							? "No weekly menus found"
							: "Select a week to view menu"}
					</p>
					<button
						className="btn btn-primary mt-4"
						onClick={() => onEditWeek(null)}>
						Create Your First Weekly Menu
					</button>
				</div>
			)}
		</div>
	);
};

// ==============================
// Weekly Menu Grid Display
// ==============================
const WeeklyMenuGrid = ({ currentWeeklyMenu, weeklyMenu, onEdit }) => {
	const { fetchWeeklyMenuWithItems } = useWeeklyMenuStore();
	const [menuData, setMenuData] = useState(null);

	useEffect(() => {
		if (weeklyMenu?.id) {
			fetchWeeklyMenuWithItems(weeklyMenu.id).then((result) => {
				if (result.data) setMenuData(result.data);
			});
		}
	}, [weeklyMenu?.id, fetchWeeklyMenuWithItems]);

	const days = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];

	const getItemsForDay = (day) =>
		menuData?.weekly_menu_items
			?.filter((item) => item.weekday === day)
			.map((item) => item.menu_items) || [];

	return (
		<div className="bg-base-200 rounded-lg p-6">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h2 className="text-2xl font-bold">Menu of the Week</h2>
					<p className="text-gray-600">
						{new Date(weeklyMenu.week_from).toLocaleDateString()} to{" "}
						{new Date(weeklyMenu.week_to).toLocaleDateString()}
					</p>
				</div>

				<div className="flex items-center gap-3">
					<WeeklyMenuPublishControl currentWeeklyMenu={currentWeeklyMenu} />
					<button className="btn btn-primary" onClick={onEdit}>
						<Edit className="w-4 h-4 mr-2" />
						Edit Menu
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{days.map((day) => (
					<div
						key={day}
						className="bg-base-100 rounded-lg p-4 border-2 border-gray-300">
						<h3 className="font-bold text-lg mb-3 text-center">{day}</h3>
						<div className="space-y-2 min-h-[200px]">
							{getItemsForDay(day).map((item) => (
								<div key={item.id} className="text-sm p-2 bg-gray-50 rounded">
									<div className="font-medium">{item.name_burmese}</div>
									<div className="text-gray-600 text-xs">
										{item.name_english}
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
