import { useState } from "react";
import { WeeklyMenuBuilder } from "../components/WeeklyMenuBuilder";
import { WeeklyMenuOverview } from "../components/WeeklyMenuOverview";

const WeeklyMenu = () => {
	const [currentView, setCurrentView] = useState("overview"); // 'overview' or 'builder'
	const [selectedWeekForEdit, setSelectedWeekForEdit] = useState(null);

	const handleEditWeek = (weeklyMenu) => {
		setSelectedWeekForEdit(weeklyMenu);
		setCurrentView("builder");
	};

	const handleBackToOverview = () => {
		setCurrentView("overview");
		setSelectedWeekForEdit(null);
	};

	if (currentView === "builder") {
		return (
			<WeeklyMenuBuilder
				weeklyMenu={selectedWeekForEdit}
				onBack={handleBackToOverview}
			/>
		);
	}

	return <WeeklyMenuOverview onEditWeek={handleEditWeek} />;
};

export default WeeklyMenu;
