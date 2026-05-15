import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastContainer } from "./components/common/ToastContainer";
import "./index.css";

// Standalone Detection
if (window.navigator.standalone === true) {
	document.body.classList.add("standalone-mode");
	console.log("App is running in standalone mode");
}

// Touch Event Overrides to prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener("touchend", (e) => {
	const now = Date.now();
	if (now - lastTouchEnd <= 300) {
		e.preventDefault();
	}
	lastTouchEnd = now;
}, { passive: false });

// Suppress long-press menus
document.addEventListener("contextmenu", (e) => {
	e.preventDefault();
}, false);

// Prevent text selection
document.addEventListener("selectstart", (e) => {
	e.preventDefault();
}, false);

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<AuthProvider>
			<RouterProvider router={router} />
			<ToastContainer />
		</AuthProvider>
	</React.StrictMode>
);
