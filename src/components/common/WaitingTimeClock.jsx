import React, { useEffect } from "react";
import { Clock } from "lucide-react";
import useWaitingTimeStore from "../../stores/waitingTimeStore";

const WaitingTimeClock = ({
	showDishCount = true,
	compact = false,
	className = "",
}) => {
	const {
		timeWindow,
		dishCount,
		textColor,
		bgColor,
		fetchWaitingTime,
	} = useWaitingTimeStore();

	useEffect(() => {
		fetchWaitingTime();
	}, [fetchWaitingTime]);

	if (compact) {
		return (
			<div
				className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${bgColor} ${className}`}
				title={`Kitchen queue: ${dishCount} cooking dishes`}>
				<Clock className={`w-3.5 h-3.5 ${textColor} shrink-0`} />
				<span className="text-xs font-semibold opacity-70">Wait:</span>
				<span className={`text-xs font-black ${textColor}`}>{timeWindow}</span>
			</div>
		);
	}

	return (
		<div
			className={`flex items-center gap-2.5 py-2 px-3.5 rounded-2xl border transition-all ${bgColor} ${className}`}
			title={`Kitchen queue: ${dishCount} active cooking dishes in the last 25 mins`}>
			<div
				className={`w-7 h-7 rounded-xl bg-base-100/90 ${textColor} shadow-xs flex items-center justify-center shrink-0`}>
				<Clock className="w-4 h-4" />
			</div>
			<div className="flex flex-col text-left leading-tight">
				<span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
					Est. Wait Time
				</span>
				<div className="flex items-center gap-1.5">
					<span className={`text-sm font-black ${textColor}`}>
						{timeWindow}
					</span>
					{showDishCount && (
						<span className="text-[10px] font-semibold opacity-50">
							({dishCount} {dishCount === 1 ? "dish" : "dishes"})
						</span>
					)}
				</div>
			</div>
		</div>
	);
};

export default WaitingTimeClock;
