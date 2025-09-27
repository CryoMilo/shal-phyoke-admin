import { useState, useEffect } from "react";
import { useWeeklyMenuStore } from "../stores/weeklyMenuStore";

export const WeeklyMenuPublishControl = ({ currentWeeklyMenu }) => {
	const { updateWeeklyMenuStatus, weeklyMenus } = useWeeklyMenuStore();
	const [status, setStatus] = useState(currentWeeklyMenu.status);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setStatus(currentWeeklyMenu.status);
	}, [currentWeeklyMenu.status]);

	const handleChange = async (e) => {
		const newStatus = e.target.value;
		const previous = status;

		// 🔎 Validation: only one Published allowed
		if (
			newStatus === "Published" &&
			weeklyMenus.some(
				(menu) =>
					menu.id !== currentWeeklyMenu.id && menu.status === "Published"
			)
		) {
			alert("Only one Weekly Menu can be Published at a time.");
			return;
		}

		setStatus(newStatus);
		setLoading(true);
		try {
			await updateWeeklyMenuStatus(currentWeeklyMenu.id, newStatus);
		} catch (err) {
			console.error(err);
			setStatus(previous);
		} finally {
			setLoading(false);
		}
	};

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
		</div>
	);
};
