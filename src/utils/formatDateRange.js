export const formatDateRange = (weekFrom, weekTo) => {
	const from = new Date(weekFrom).toLocaleDateString();
	const to = new Date(weekTo).toLocaleDateString();
	return `${from} to ${to}`;
};
