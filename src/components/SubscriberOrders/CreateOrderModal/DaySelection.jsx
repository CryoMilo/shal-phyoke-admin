// components/SubscriberOrders/CreateOrderModal/DaySelection.js
export const DaySelection = ({
	selectedDay,
	isAfter10AM,
	onDayChange,
	selectedSubscriberPlan,
	todayMenuItems,
	tomorrowMenuItems,
}) => {
	if (!selectedSubscriberPlan) return null;

	const isTodayMenuAvailable = todayMenuItems && todayMenuItems.length > 0;
	const isTomorrowMenuAvailable =
		tomorrowMenuItems && tomorrowMenuItems.length > 0;

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
					} ${isAfter10AM || !isTodayMenuAvailable ? "btn-disabled" : ""}`}
					onClick={() =>
						!isAfter10AM && isTodayMenuAvailable && onDayChange("today")
					}
					disabled={isAfter10AM || !isTodayMenuAvailable}>
					Today
					{isAfter10AM && (
						<span className="badge badge-sm badge-ghost ml-2">
							Unavailable after 10AM
						</span>
					)}
					{!isTodayMenuAvailable && (
						<span className="badge badge-sm badge-error ml-2">No Menu</span>
					)}
				</button>
				<button
					type="button"
					className={`join-item btn flex-1 ${
						selectedDay === "tomorrow" ? "btn-primary" : "btn-outline"
					} ${!isTomorrowMenuAvailable ? "btn-disabled" : ""}`}
					onClick={() => isTomorrowMenuAvailable && onDayChange("tomorrow")}
					disabled={!isTomorrowMenuAvailable}>
					Tomorrow
					{!isTomorrowMenuAvailable && (
						<span className="badge badge-sm badge-error ml-2">No Menu</span>
					)}
				</button>
			</div>

			{/* Show menu items immediately after subscriber selection */}
			{!selectedDay &&
				(isTodayMenuAvailable || isTomorrowMenuAvailable) && (
					<div className="mt-4 alert alert-warning">
						<div>
							<span className="text-sm">
								📋 Please select a day to view menu items
							</span>
						</div>
					</div>
				)}

			{/* Show message if no menus are available at all */}
			{!isTodayMenuAvailable && !isTomorrowMenuAvailable && (
				<div className="mt-4 alert alert-error">
					<div>
						<span className="text-sm">
							No menus published for today or tomorrow.
						</span>
					</div>
				</div>
			)}
		</div>
	);
};
