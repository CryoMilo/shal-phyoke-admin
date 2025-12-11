export const getTomorrowDate = () => {
	const tomorrow = new Date();
	// Set the date to tomorrow (handles month/year rollover)
	tomorrow.setDate(tomorrow.getDate() + 1);

	// Use Intl.DateTimeFormat for the specific format: "numeric day", "short month", "numeric year"
	const options = {
		day: "numeric",
		month: "short", // 'Dec'
		year: "numeric", // '2025'
	};

	// Format the date for the default locale (you can specify a locale like 'en-US')
	return new Intl.DateTimeFormat(undefined, options).format(tomorrow);
};
