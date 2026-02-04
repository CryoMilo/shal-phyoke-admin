import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	optimizeDeps: {
		include: ["react-is"], // Forces Vite to pre-bundle this
	},
	build: {
		commonjsOptions: {
			include: [/react-is/, /node_modules/], // Ensures CommonJS modules are converted
		},
	},
});
