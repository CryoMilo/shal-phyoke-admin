// src/components/kitchenLogs/KitchenLogsCalendar.jsx
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
	format,
	addMonths,
	subMonths,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	isSameMonth,
	isSameDay,
	addDays,
} from "date-fns";

const KitchenLogsCalendar = ({ logs, selectedDate, onSelectDate }) => {
	const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || Date.now()));

	const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
	const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
	const goToToday = () => {
		const today = new Date();
		setCurrentMonth(today);
		onSelectDate(format(today, "yyyy-MM-dd"));
	};

	// Group logs by date
	const logsByDate = {};
	logs.forEach((log) => {
		const d = log.log_date;
		if (!logsByDate[d]) {
			logsByDate[d] = { preps: 0, spoilages: 0, wasteQty: 0 };
		}
		if (log.log_type === "spoilage" || Number(log.waste_quantity) > 0) {
			logsByDate[d].spoilages += 1;
			logsByDate[d].wasteQty += Number(log.waste_quantity) || 0;
		}
		if ((log.log_type || "prep") === "prep" && (Number(log.batches_produced) > 0 || Number(log.quantity_produced) > 0)) {
			logsByDate[d].preps += 1;
		}
	});

	// Build calendar grid days
	const monthStart = startOfMonth(currentMonth);
	const monthEnd = endOfMonth(monthStart);
	const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
	const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

	const rows = [];
	let days = [];
	let day = startDate;

	while (day <= endDate) {
		for (let i = 0; i < 7; i++) {
			days.push(day);
			day = addDays(day, 1);
		}
		rows.push(days);
		days = [];
	}

	const selectedDateObj = new Date(selectedDate);

	return (
		<div className="bg-base-100 rounded-2xl border border-base-200 overflow-hidden shadow-sm p-4 space-y-3">
			{/* Calendar Header Navigation */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<CalendarIcon className="w-5 h-5 text-primary" />
					<h3 className="font-bold text-base text-base-content">
						{format(currentMonth, "MMMM yyyy")}
					</h3>
				</div>

				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={goToToday}
						className="btn btn-ghost btn-xs font-semibold">
						Today
					</button>
					<button
						type="button"
						onClick={prevMonth}
						className="btn btn-ghost btn-xs btn-square"
						title="Previous Month">
						<ChevronLeft className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={nextMonth}
						className="btn btn-ghost btn-xs btn-square"
						title="Next Month">
						<ChevronRight className="w-4 h-4" />
					</button>
				</div>
			</div>

			{/* Days of Week Header */}
			<div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-base-content/60 pb-1 border-b border-base-200">
				<span>Mon</span>
				<span>Tue</span>
				<span>Wed</span>
				<span>Thu</span>
				<span>Fri</span>
				<span>Sat</span>
				<span>Sun</span>
			</div>

			{/* Calendar Grid Cells */}
			<div className="space-y-1">
				{rows.map((row, rowIdx) => (
					<div key={rowIdx} className="grid grid-cols-7 gap-1">
						{row.map((d, dIdx) => {
							const dateStr = format(d, "yyyy-MM-dd");
							const isCurrentMonth = isSameMonth(d, monthStart);
							const isSelected = isSameDay(d, selectedDateObj);
							const dayStats = logsByDate[dateStr];

							return (
								<button
									key={dIdx}
									type="button"
									onClick={() => onSelectDate(dateStr)}
									className={`min-h-[68px] sm:min-h-[78px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all group ${
										isSelected
											? "border-primary bg-primary/10 shadow-sm"
											: isCurrentMonth
											? "border-base-200 hover:border-base-300 bg-base-100"
											: "border-transparent text-base-content/30 bg-base-200/30"
									}`}>
									<span
										className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
											isSameDay(d, new Date())
												? "bg-primary text-primary-content"
												: isSelected
												? "text-primary font-black"
												: ""
										}`}>
										{format(d, "d")}
									</span>

									{/* Badges */}
									<div className="flex flex-col gap-1 w-full mt-1">
										{dayStats?.preps > 0 && (
											<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 truncate">
												🟢 {dayStats.preps} Preps
											</span>
										)}
										{dayStats?.spoilages > 0 && (
											<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 truncate">
												🔴 {dayStats.spoilages} Waste
											</span>
										)}
									</div>
								</button>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
};

export default KitchenLogsCalendar;
