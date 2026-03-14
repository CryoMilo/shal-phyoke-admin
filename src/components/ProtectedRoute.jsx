// src/components/ProtectedRoute.jsx
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "./common/Loading";

const ProtectedRoute = ({ children, requiredRole }) => {
	const { user, loading, isAdmin } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loading />
			</div>
		);
	}

	// If no user, redirect to login
	if (!user) {
		return <Navigate to="/login" />;
	}

	// If requiredRole is specified, check access
	if (requiredRole === "admin" && !isAdmin) {
		// Staff trying to access admin-only page
		return <Navigate to="/orders" />;
	}

	// If we get here, render the children
	return children;
};

export default ProtectedRoute;
