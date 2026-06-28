import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toBangkokDateString } from "../../utils/dateUtils";
import ShalPhyokeDatePicker from "./ShalPhyokeDatePicker";

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

	return (
		<div
			className={`flex items-center justify-between gap-1 bg-base-200 rounded-xl p-1.5 border border-base-300 ${className}`}>
			<button
				type="button"
				className="btn btn-circle btn-ghost btn-xs shrink-0 hover:bg-base-300"
				onClick={() => handleOffset(-1)}
				aria-label="Previous day">
				<ChevronLeft className="w-4 h-4" />
			</button>

			<ShalPhyokeDatePicker
				mode="date"
				value={value}
				maxDate={maxDate}
				onChange={onChange}
				className="w-36 shrink-0"
			/>

			<button
				type="button"
				className="btn btn-circle btn-ghost btn-xs shrink-0 hover:bg-base-300"
				onClick={() => handleOffset(1)}
				disabled={isAtMax}
				aria-label="Next day">
				<ChevronRight className="w-4 h-4" />
			</button>
		</div>
	);
};

export default BangkokDatePicker;
