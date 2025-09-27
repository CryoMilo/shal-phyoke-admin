import { useState } from "react";
import { useWeeklyMenuStore } from "../stores/weeklyMenuStore"; // <-- adjust import if needed

export const WeeklyMenuPublishControl = ({ weeklyMenu }) => {
	const { updateWeeklyMenuStatus } = useWeeklyMenuStore();
	const [status, setStatus] = useState(weeklyMenu.status);
	const [loading, setLoading] = useState(false);

	const toggleStatus = async () => {
		const newStatus = status === "Published" ? "Draft" : "Published";
		setStatus(newStatus); // ✅ Optimistic UI
		setLoading(true);
		try {
			await updateWeeklyMenuStatus(weeklyMenu.id, newStatus);
		} catch (err) {
			// ❌ Revert if API fails
			console.error(err);
			setStatus(status);
		} finally {
			setLoading(false);
		}
	};

	return (
		<button className="btn btn-error" disabled={loading} onClick={toggleStatus}>
			{status === "Published" ? "Make Draft" : "Publish"}
		</button>
	);
};
