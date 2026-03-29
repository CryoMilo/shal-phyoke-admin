import React, { useState, useEffect } from "react";
import { Plus, Edit, Image } from "lucide-react";
import { useWeeklyMenuStore } from "../../stores/weeklyMenuStore";
import { formatDateRange } from "../../utils/dateUtils";
import { Loading } from "../common/Loading";
import { WeeklyMenuPublishControl } from "./WeeklyMenuPublishControl";
import { PageHeader } from "../common/PageHeader";
import DailyMenuImageModal from "./DailyMenuImageModal";
import { showToast } from "../../utils/toastUtils";

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
			<PageHeader
				title="Menu of the Week"
				description="Weekly menu overview"
				buttons={[
					{
						type: "button",
						label: "Create Weekly Menu",
						shortlabel: "Create Menu",
						icon: Plus,
						onClick: () => onEditWeek(null),
						variant: "primary",
					},
				]}
			/>
			{/* Week Selection Dropdown */}
			{weeklyMenus.length > 0 && (
				<div className="mb-6">
					<select
						className="select select-bordered w-full max-w-md"
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
	const [selectedDay, setSelectedDay] = useState(null);
	const [showEditorModal, setShowEditorModal] = useState(false);

	useEffect(() => {
		if (weeklyMenu?.id) {
			fetchWeeklyMenuWithItems(weeklyMenu.id).then((result) => {
				if (result.data) {
					setMenuData(result.data);
				} else if (result.error) {
					showToast.error("Failed to load weekly menu items");
				}
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
		"Sunday",
	];

	const getItemsForDay = (day) =>
		menuData?.weekly_menu_items
			?.filter((item) => item.weekday === day)
			.map((item) => item.menu_items) || [];

	const handleOpenEditor = (day) => {
		setSelectedDay(day);
		setShowEditorModal(true);
	};

	return (
		<div className="bg-base-200 rounded-lg p-6">
			<PageHeader
				buttons={[
					{
						type: "custom",
						component: (
							<WeeklyMenuPublishControl
								currentWeeklyMenu={currentWeeklyMenu || weeklyMenu}
							/>
						),
					},
					{
						type: "button",
						label: "Edit Menu",
						shortlabel: "Edit",
						icon: Edit,
						onClick: onEdit,
						variant: "primary",
					},
				]}
				titleSize="clamp(1.5rem, 4vw, 2rem)"
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{days.map((day) => (
					<div
						key={day}
						className="bg-base-100 rounded-lg p-4 border-2 border-gray-300 relative">
						{/* Mini Image Editor Button */}
						<button
							className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost hover:bg-base-300"
							title="Create Menu Image"
							onClick={() => handleOpenEditor(day)}>
							<Image className="w-4 h-4" />
						</button>

						<h3 className="font-bold text-lg mb-3 text-center pr-8">{day}</h3>
						<div className="space-y-2 min-h-[200px]">
							{getItemsForDay(day).map((item) => (
								<div key={item.id} className="text-sm p-2 rounded">
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

			{/* Day Menu Editor Modal */}
			{showEditorModal && selectedDay && (
				<DailyMenuImageModal
					day={selectedDay}
					menuItems={getItemsForDay(selectedDay)}
					weekRange={`${formatDateRange(
						weeklyMenu.week_from,
						weeklyMenu.week_to
					)}`}
					isOpen={showEditorModal}
					onClose={() => setShowEditorModal(false)}
				/>
			)}
		</div>
	);
};
