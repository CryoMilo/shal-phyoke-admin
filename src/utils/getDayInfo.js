export const getDayInfo = (offset = 0) => {
	const date = new Date();
	date.setDate(date.getDate() + offset);
	const dayNames = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	return {
		name: dayNames[date.getDay()],
		date: date.toLocaleDateString("en-US", {
			month: "numeric",
			day: "numeric",
			year: "numeric",
		}),
	};
};
