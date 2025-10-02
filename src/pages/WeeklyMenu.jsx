import { useEffect, useState } from "react";
import { useWeeklyMenuStore } from "../stores/weeklyMenuStore";
import { WeeklyMenuBuilder } from "../components/WeeklyMenu/WeeklyMenuBuilder";
import { WeeklyMenuOverview } from "../components/WeeklyMenu/WeeklyMenuOverview";

const WeeklyMenu = () => {
	const [currentView, setCurrentView] = useState("overview");
	const [selectedWeekForEdit, setSelectedWeekForEdit] = useState(null);

	const {
		weeklyMenus,
		currentWeeklyMenu,
		weeklyMenusLoading,
		currentWeeklyMenuLoading,
		fetchWeeklyMenus,
		fetchLatestWeeklyMenu,
	} = useWeeklyMenuStore();

	useEffect(() => {
		fetchWeeklyMenus();
		fetchLatestWeeklyMenu();
	}, [fetchWeeklyMenus, fetchLatestWeeklyMenu]);

	const handleEditWeek = (weeklyMenu) => {
		setSelectedWeekForEdit(weeklyMenu);
		setCurrentView("builder");
	};

	const handleBackToOverview = () => setCurrentView("overview");

	if (currentView === "builder") {
		return (
			<WeeklyMenuBuilder
				weeklyMenu={selectedWeekForEdit}
				onBack={handleBackToOverview}
			/>
		);
	}

	return (
		<WeeklyMenuOverview
			currentWeeklyMenu={currentWeeklyMenu}
			weeklyMenus={weeklyMenus}
			loading={weeklyMenusLoading || currentWeeklyMenuLoading}
			onEditWeek={handleEditWeek}
		/>
	);
};

export default WeeklyMenu;
