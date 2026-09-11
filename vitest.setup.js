const storage = {};

const localStorageMock = {
	getItem: (key) => storage[key] ?? null,
	setItem: (key, value) => {
		storage[key] = String(value);
	},
	removeItem: (key) => {
		delete storage[key];
	},
	clear: () => {
		Object.keys(storage).forEach((key) => delete storage[key]);
	},
	length: 0,
	key: (index) => Object.keys(storage)[index] || null,
};

globalThis.localStorage = localStorageMock;
if (typeof window !== "undefined") {
	window.localStorage = localStorageMock;
}
