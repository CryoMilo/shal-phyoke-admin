import { Navigate } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";

const RootIndex = () => {
	const { isAdmin, user } = useAuth();

	if (!user) {
		return <Navigate to="/login" />;
	}

	return <Navigate to={isAdmin ? "/dashboard" : "/orders"} />;
};

export default RootIndex;
