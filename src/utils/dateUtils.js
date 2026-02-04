// utils/dateUtils.js

/**
 * Returns a YYYY-MM-DD string for Bangkok time.
 */
export const toBangkokDateString = (date = new Date()) => {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Bangkok",
	}).format(new Date(date));
};

/**
 * Returns the exact UTC ISO strings for the start and end of a Bangkok day.
 * Essential for Supabase/Database queries.
 */
export const getBangkokDayRange = (date = new Date()) => {
	const dateStr = toBangkokDateString(date);

	// We create dates by specifying the Bangkok offset (+07:00)
	// to ensure JS parses them exactly as intended.
	const start = new Date(`${dateStr}T00:00:00+07:00`);
	const end = new Date(`${dateStr}T23:59:59.999+07:00`);

	return {
		start: start.toISOString(),
		end: end.toISOString(),
		dateStr: dateStr,
	};
};

/**
 * Format date for UI display (e.g., Thu, Feb 5, 2026)
 */
export const formatDisplayDate = (date) => {
	return new Intl.DateTimeFormat("en-US", {
		timeZone: "Asia/Bangkok",
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(new Date(date));
};
