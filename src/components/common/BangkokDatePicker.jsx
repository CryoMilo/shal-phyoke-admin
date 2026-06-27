import { useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toBangkokDateString } from "../../utils/dateUtils";

const parseBangkokDate = (dateStr) => new Date(`${dateStr}T12:00:00+07:00`);

const BangkokDatePicker = ({
	value,
	onChange,
	maxDate = new Date(),
	className = "",
}) => {
	const isAtMax = useMemo(
		() => toBangkokDateString(value) === toBangkokDateString(maxDate),
		[value, maxDate]
	);

	const handleOffset = (offset) => {
		const newDate = new Date(value);
		newDate.setDate(newDate.getDate() + offset);
		if (toBangkokDateString(newDate) > toBangkokDateString(maxDate)) return;
		onChange(newDate);
	};

	const handleInputChange = (dateStr) => {
		if (!dateStr) return;
		if (dateStr > toBangkokDateString(maxDate)) return;
		onChange(parseBangkokDate(dateStr));
	};

	return (
		<div
			className={`flex items-center justify-between gap-2 bg-base-200 rounded-lg p-2 ${className}`}>
			<button
				type="button"
				className="btn btn-circle btn-ghost btn-xs shrink-0"
				onClick={() => handleOffset(-1)}
				aria-label="Previous day">
				<ChevronLeft className="w-4 h-4" />
			</button>

			<div className="flex items-center gap-2 flex-1 justify-center min-w-0">
				<Calendar className="w-4 h-4 text-primary shrink-0" />
				<input
					type="date"
					className="input input-ghost input-sm font-bold w-full max-w-[10.5rem] focus:bg-transparent px-1"
					value={toBangkokDateString(value)}
					max={toBangkokDateString(maxDate)}
					onChange={(e) => handleInputChange(e.target.value)}
				/>
			</div>

			<button
				type="button"
				className="btn btn-circle btn-ghost btn-xs shrink-0"
				onClick={() => handleOffset(1)}
				disabled={isAtMax}
				aria-label="Next day">
				<ChevronRight className="w-4 h-4" />
			</button>
		</div>
	);
};

export default BangkokDatePicker;
