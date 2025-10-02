// components/SubscriberOrders/DaySelection.js
export const DaySelection = ({
	selectedDay,
	isAfter10AM,
	onDayChange,
	watchSubscriberPlanId,
	selectedSubscriberPlan,
	hasMultipleActivePlans,
}) => {
	const showDaySelection =
		watchSubscriberPlanId ||
		(!hasMultipleActivePlans && selectedSubscriberPlan);

	if (!showDaySelection) return null;

	return (
		<div className="form-control">
			<label className="label">
				<span className="label-text">Select Day</span>
			</label>
			<div className="join w-full">
				<button
					type="button"
					className={`join-item btn flex-1 ${
						selectedDay === "today" ? "btn-primary" : "btn-outline"
					} ${isAfter10AM ? "btn-disabled" : ""}`}
					onClick={() => !isAfter10AM && onDayChange("today")}
					disabled={isAfter10AM}>
					Today
					{isAfter10AM && (
						<span className="badge badge-sm badge-ghost ml-2">
							Unavailable after 10AM
						</span>
					)}
				</button>
				<button
					type="button"
					className={`join-item btn flex-1 ${
						selectedDay === "tomorrow" ? "btn-primary" : "btn-outline"
					}`}
					onClick={() => onDayChange("tomorrow")}>
					Tomorrow
				</button>
			</div>
		</div>
	);
};
