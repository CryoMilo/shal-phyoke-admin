// components/WeeklyMenu/WeeklyMenuPublishControl.jsx
import { useState, useEffect } from "react";
import { useWeeklyMenuStore } from "../../stores/weeklyMenuStore";
import { showToast } from "../../utils/toastUtils";

export const WeeklyMenuPublishControl = ({ currentWeeklyMenu }) => {
	const { updateWeeklyMenuStatus, weeklyMenus } = useWeeklyMenuStore();
	const [status, setStatus] = useState(currentWeeklyMenu?.status || "Draft");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (currentWeeklyMenu?.status) {
			setStatus(currentWeeklyMenu.status);
		}
	}, [currentWeeklyMenu?.status]);

	const handleChange = async (e) => {
		const newStatus = e.target.value;
		const previous = status;

		// 🔎 Validation: only one Published allowed
		if (
			newStatus === "Published" &&
			weeklyMenus.some(
				(menu) =>
					menu.id !== currentWeeklyMenu?.id && menu.status === "Published"
			)
		) {
			showToast.warning("Only one Weekly Menu can be Published at a time.");
			return;
		}

		setStatus(newStatus);
		setLoading(true);
		try {
			if (currentWeeklyMenu?.id) {
				await updateWeeklyMenuStatus(currentWeeklyMenu.id, newStatus);
			} else {
				showToast.warning("No weekly menu selected to update.");
				setStatus(previous);
			}
		} catch (err) {
			console.error(err);
			setStatus(previous);
		} finally {
			setLoading(false);
		}
	};

	// If no current weekly menu, show disabled state
	if (!currentWeeklyMenu) {
		return (
			<div className="flex flex-col gap-2">
				<select
					className="select select-bordered w-40 opacity-50"
					disabled={true}
					value="Draft">
					<option value="Draft">No Menu</option>
				</select>
				<p className="text-xs text-gray-500">Create a weekly menu first</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<select
				className="select select-bordered w-40"
				disabled={loading}
				value={status}
				onChange={handleChange}>
				<option value="Draft">Draft</option>
				<option value="Published">Published</option>
				<option value="Archived">Archived</option>
			</select>
			{loading && <div className="text-xs text-gray-500">Updating...</div>}
		</div>
	);
};
