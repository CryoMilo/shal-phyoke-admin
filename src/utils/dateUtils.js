// utils/dateUtils.js
export const toBangkokDate = (date) => {
	// Convert any date to Bangkok time (UTC+7)
	const bangkokDate = new Date(date);
	bangkokDate.setHours(bangkokDate.getHours() + 7);
	return bangkokDate;
};

export const toBangkokDateString = (date) => {
	// Create date in Bangkok timezone
	const bangkokDate = new Date(
		date.toLocaleString("en-US", {
			timeZone: "Asia/Bangkok",
		})
	);

	// Format as YYYY-MM-DD
	const year = bangkokDate.getFullYear();
	const month = String(bangkokDate.getMonth() + 1).padStart(2, "0");
	const day = String(bangkokDate.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
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
