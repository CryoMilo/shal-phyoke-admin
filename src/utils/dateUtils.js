// utils/dateUtils.js
export const toBangkokDate = (date) => {
	// Convert any date to Bangkok time (UTC+7)
	const bangkokDate = new Date(date);
	bangkokDate.setHours(bangkokDate.getHours() + 7);
	return bangkokDate;
};

export const toBangkokDateString = (date) => {
	return toBangkokDate(date).toISOString().split("T")[0];
};

export const getBangkokDateRange = (date) => {
	const bangkokDate = toBangkokDate(date);

	// Start of day in Bangkok
	const startOfDay = new Date(bangkokDate);
	startOfDay.setHours(0, 0, 0, 0);

	// End of day in Bangkok
	const endOfDay = new Date(bangkokDate);
	endOfDay.setHours(23, 59, 59, 999);

	return {
		start: startOfDay.toISOString(),
		end: endOfDay.toISOString(),
		dateStr: bangkokDate.toISOString().split("T")[0],
	};
};
