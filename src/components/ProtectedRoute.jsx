// src/components/ProtectedRoute.jsx - Simplified version for debugging
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "./common/Loading";

const ProtectedRoute = ({ children }) => {
	const { user, loading } = useAuth();

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

	// If we get here, render the children
	return children;
};

export default ProtectedRoute;
