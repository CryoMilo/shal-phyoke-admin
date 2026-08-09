import React, { useEffect } from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./contexts/AuthContext";
import { Loading } from "./components/common/Loading";

function App() {
	const { user, loading } = useAuth();
	const location = useLocation();
	const isLoginPage = location.pathname === "/login";

	useEffect(() => {
		const isNight = localStorage.getItem("pos_night_mode") === "true";
		const theme = isNight ? "dim" : "bumblebee";
		document.documentElement.setAttribute("data-theme", theme);
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-base-100">
				<Loading message="Initializing application..." />
			</div>
		);
	}

	if (isLoginPage) {
		return <Outlet />;
	}

	return (
		<div className="min-h-screen bg-base-100">
			{user ? <Sidebar /> : <Outlet />}
		</div>
	);
}

export default App;
