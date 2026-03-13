// src/components/ProtectedRoute.jsx - Simplified version for debugging
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "./common/Loading";

const ProtectedRoute = ({ children }) => {
	const { user, profile, loading } = useAuth();

	console.log("ProtectedRoute - user:", user);
	console.log("ProtectedRoute - profile:", profile);
	console.log("ProtectedRoute - loading:", loading);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loading />
			</div>
		);
	}

	// If no user, redirect to login
	if (!user) {
		console.log("No user, redirecting to login");
		return <Navigate to="/login" />;
	}

	// If we get here, render the children
	return children;
};

export default ProtectedRoute;
