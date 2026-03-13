import { Outlet, useLocation } from "@tanstack/react-router";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./contexts/AuthContext";
import { Loading } from "./components/common/Loading";

function App() {
	const { user, loading } = useAuth();
	const location = useLocation();
	const isLoginPage = location.pathname === "/login";

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-base-100">
				<Loading message="Initializing application..." />
			</div>
		);
	}

	// If it's the login page, just render the outlet (the Login component)
	if (isLoginPage) {
		return <Outlet />;
	}

	// For all other pages, if no user, the ProtectedRoute will handle redirect.
	// Here we just provide the layout (Sidebar + Content)
	return (
		<div className="min-h-screen bg-base-100">
			{user ? (
				<Sidebar />
			) : (
				<Outlet />
			)}
		</div>
	);
}

export default App;
