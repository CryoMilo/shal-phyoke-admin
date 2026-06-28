import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
	format,
	addMonths,
	subMonths,
	startOfMonth,
	endOfMonth,
	eachDayOfInterval,
	isSameDay,
	isSameMonth,
	startOfWeek,
	endOfWeek,
	addDays,
	isAfter,
	isBefore,
	parse,
} from "date-fns";

const ShalPhyokeDatePicker = ({
	value,
	onChange,
	maxDate,
	minDate,
	mode = "date", // "date" or "month"
	placeholder = "Select date",
	className = "",
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [currentMonth, setCurrentMonth] = useState(value || new Date());
	const containerRef = useRef(null);
	const buttonRef = useRef(null);
	const [coords, setCoords] = useState({ top: 0, left: 0 });

	// Sync current month view when value changes
	useEffect(() => {
		if (value) {
			setCurrentMonth(value);
		}
	}, [value]);

	// Close on click outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				containerRef.current && 
				!containerRef.current.contains(event.target) &&
				!event.target.closest(".datepicker-portal-content")
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const updateCoords = () => {
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setCoords({
				top: rect.bottom + window.scrollY + 4,
				left: rect.left + window.scrollX,
			});
		}
	};

	const toggleOpen = () => {
		if (!isOpen) {
			updateCoords();
		}
		setIsOpen(!isOpen);
	};

	useEffect(() => {
		if (isOpen) {
			updateCoords();
			window.addEventListener("scroll", updateCoords, true);
			window.addEventListener("resize", updateCoords);
		}
		return () => {
			window.removeEventListener("scroll", updateCoords, true);
			window.removeEventListener("resize", updateCoords);
		};
	}, [isOpen]);

	const handlePrevMonth = () => {
		setCurrentMonth(subMonths(currentMonth, 1));
	};

	const handleNextMonth = () => {
		setCurrentMonth(addMonths(currentMonth, 1));
	};

	const handleDateSelect = (date) => {
		if (maxDate && isAfter(startOfDay(date), startOfDay(maxDate))) return;
		if (minDate && isBefore(startOfDay(date), startOfDay(minDate))) return;
		onChange(date);
		setIsOpen(false);
	};

	const handleMonthSelect = (monthIdx) => {
		const newDate = new Date(currentMonth.getFullYear(), monthIdx, 1);
		if (maxDate && isAfter(startOfMonth(newDate), startOfMonth(maxDate))) return;
		if (minDate && isBefore(startOfMonth(newDate), startOfMonth(minDate))) return;
		onChange(newDate);
		setIsOpen(false);
	};

	const startOfDay = (d) => {
		const newD = new Date(d);
		newD.setHours(0, 0, 0, 0);
		return newD;
	};

	// Generate day list for date grid
	const days = useMemo(() => {
		if (mode !== "date") return [];
		const monthStart = startOfMonth(currentMonth);
		const monthEnd = endOfMonth(monthStart);
		const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
		const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
		return eachDayOfInterval({ start: startDate, end: endDate });
	}, [currentMonth, mode]);

	const months = [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
	];

	const displayValue = useMemo(() => {
		if (!value) return placeholder;
		return mode === "month"
			? format(value, "MMMM yyyy")
			: format(value, "MMM d, yyyy");
	}, [value, mode, placeholder]);

	const isDateDisabled = (date) => {
		if (maxDate && isAfter(startOfDay(date), startOfDay(maxDate))) return true;
		if (minDate && isBefore(startOfDay(date), startOfDay(minDate))) return true;
		return false;
	};

	const isMonthDisabled = (monthIdx) => {
		const firstOfTargetMonth = new Date(currentMonth.getFullYear(), monthIdx, 1);
		if (maxDate && isAfter(startOfMonth(firstOfTargetMonth), startOfMonth(maxDate))) return true;
		if (minDate && isBefore(startOfMonth(firstOfTargetMonth), startOfMonth(minDate))) return true;
		return false;
	};

	return (
		<div className={`relative inline-block text-left ${className}`} ref={containerRef}>
			<button
				ref={buttonRef}
				type="button"
				onClick={toggleOpen}
				className="btn btn-outline border-base-300 hover:border-primary/50 bg-base-100 font-medium justify-between px-3 min-h-10 h-10 w-full gap-2 text-base-content hover:bg-base-200/50">
				<span className="flex items-center gap-2">
					<Calendar className="w-4 h-4 text-primary shrink-0" />
					<span className="truncate text-sm">{displayValue}</span>
				</span>
			</button>

			{isOpen && createPortal(
				<div 
					style={{
						position: "absolute",
						top: `${coords.top}px`,
						left: `${coords.left}px`,
						zIndex: 99999,
					}}
					className="datepicker-portal-content p-4 w-72 rounded-2xl bg-base-100 border border-base-200 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
					{/* Mode: Date Calendar */}
					{mode === "date" && (
						<div>
							<div className="flex justify-between items-center mb-4">
								<button
									type="button"
									onClick={handlePrevMonth}
									className="btn btn-ghost btn-xs btn-square">
									<ChevronLeft className="w-4 h-4" />
								</button>
								<span className="font-bold text-sm text-base-content">
									{format(currentMonth, "MMMM yyyy")}
								</span>
								<button
									type="button"
									onClick={handleNextMonth}
									className="btn btn-ghost btn-xs btn-square">
									<ChevronRight className="w-4 h-4" />
								</button>
							</div>

							{/* Weekday headers */}
							<div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-base-content/40 mb-2">
								{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
									<div key={day} className="h-6 flex items-center justify-center">
										{day}
									</div>
								))}
							</div>

							{/* Days Grid */}
							<div className="grid grid-cols-7 gap-1">
								{days.map((date, idx) => {
									const isCurrentMonthDay = date.getMonth() === currentMonth.getMonth();
									const isSelected = value && isSameDay(date, value);
									const isDisabled = isDateDisabled(date);
									
									return (
										<button
											key={idx}
											type="button"
											disabled={isDisabled}
											onClick={() => handleDateSelect(date)}
											className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
												isSelected
													? "bg-primary text-white scale-110 shadow-md"
													: isDisabled
													? "opacity-25 cursor-not-allowed"
													: isCurrentMonthDay
													? "text-base-content hover:bg-primary/10 hover:text-primary"
													: "text-base-content/30 hover:bg-base-200"
											}`}>
											{date.getDate()}
										</button>
									);
								})}
							</div>
						</div>
					)}

					{/* Mode: Month Picker */}
					{mode === "month" && (
						<div>
							<div className="flex justify-between items-center mb-4 border-b border-base-200 pb-2">
								<button
									type="button"
									onClick={() => setCurrentMonth(subMonths(currentMonth, 12))}
									className="btn btn-ghost btn-xs btn-square">
									<ChevronLeft className="w-4 h-4" />
								</button>
								<span className="font-bold text-sm text-base-content">
									{currentMonth.getFullYear()}
								</span>
								<button
									type="button"
									onClick={() => setCurrentMonth(addMonths(currentMonth, 12))}
									className="btn btn-ghost btn-xs btn-square">
									<ChevronRight className="w-4 h-4" />
								</button>
							</div>

							<div className="grid grid-cols-3 gap-2">
								{months.map((month, idx) => {
									const isSelected = value && isSameMonth(new Date(currentMonth.getFullYear(), idx, 1), value);
									const isDisabled = isMonthDisabled(idx);
									
									return (
										<button
											key={month}
											type="button"
											disabled={isDisabled}
											onClick={() => handleMonthSelect(idx)}
											className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
												isSelected
													? "bg-primary text-white shadow-md"
													: isDisabled
													? "opacity-25 cursor-not-allowed"
													: "text-base-content hover:bg-primary/10 hover:text-primary"
											}`}>
											{month}
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>,
				document.body
			)}
		</div>
	);
};

export default ShalPhyokeDatePicker;
