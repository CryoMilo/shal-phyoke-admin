// src/utils/dateUtils.js

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

/**
 * Returns a full ISO string anchored to Bangkok time (UTC+7).
 * Use this when inserting timestamps that must reflect Bangkok local time.
 */
export const getBangkokISOString = (date = new Date()) => {
	const dateStr = toBangkokDateString(date); // reuse existing util
	const timeStr = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Asia/Bangkok",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).format(new Date(date));

	return `${dateStr}T${timeStr}+07:00`;
};

/**
 * Format a date range (e.g., "M/D/YYYY to M/D/YYYY")
 */
export const formatDateRange = (weekFrom, weekTo) => {
	const from = new Date(weekFrom).toLocaleDateString();
	const to = new Date(weekTo).toLocaleDateString();
	return `${from} to ${to}`;
};

/**
 * Get day name and formatted date string with an optional day offset.
 */
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

/**
 * Get tomorrow's date formatted (e.g., "Feb 5, 2026")
 */
export const getTomorrowDate = () => {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	return new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(tomorrow);
};
