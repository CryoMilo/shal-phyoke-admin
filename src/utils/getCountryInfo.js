const countriesData = {
	Thailand: {
		language: "Thai",
		emoji: "🇹🇭",
		people: "Thai",
	},
	Japan: {
		language: "Japanese",
		emoji: "🇯🇵",
		people: "Japanese",
	},
	France: {
		language: "French",
		emoji: "🇫🇷",
		people: "French",
	},
	Myanmar: {
		language: "Burmese",
		emoji: "🇲🇲",
		people: "Burmese",
	},
	Australia: {
		language: "English",
		emoji: "🇦🇺",
		people: "Australian",
	},
};

export const getCountryInfo = (country) => {
	const data = countriesData[country];
	if (!data) {
		return {
			language: "Unknown",
			emoji: "🏳️",
			people: "Unknown",
		};
	}
	return data;
};
