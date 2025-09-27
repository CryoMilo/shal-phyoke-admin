import { useState } from "react";
import { useWeeklyMenuStore } from "../stores/weeklyMenuStore";

export const WeeklyMenuPublishControl = () => {
	const { currentWeeklyMenu, updateWeeklyMenuStatus } = useWeeklyMenuStore();
	const [status, setStatus] = useState(currentWeeklyMenu.status);
	const [loading, setLoading] = useState(false);

	const handleChange = async (e) => {
		const newStatus = e.target.value;
		const previous = status;

		setStatus(newStatus); // ✅ optimistic
		setLoading(true);
		try {
			await updateWeeklyMenuStatus(currentWeeklyMenu.id, newStatus);
		} catch (err) {
			console.error(err);
			setStatus(previous); // ❌ revert on failure
		} finally {
			setLoading(false);
		}
	};

	return (
		<select
			className="select select-bordered w-40"
			disabled={loading}
			value={status}
			onChange={handleChange}>
			<option value="Draft">Draft</option>
			<option value="Published">Published</option>
			<option value="Archived">Archived</option>
		</select>
	);
};
