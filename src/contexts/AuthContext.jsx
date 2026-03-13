// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
			setLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
			setLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	const signIn = async (email, password) => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (data?.user) {
			setUser(data.user);
		}
		return { data, error };
	};

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (!error) {
			setUser(null);
		}
		return { error };
	};

	// Role is read directly from JWT metadata — no DB call needed
	const role = user?.user_metadata?.role ?? null;

	const value = {
		user,
		// Keep profile shape for any components still referencing profile.full_name / profile.email
		profile: user
			? {
					id: user.id,
					email: user.email,
					full_name: user.user_metadata?.full_name ?? null,
					role,
			  }
			: null,
		loading,
		signIn,
		signOut,
		isAdmin: role === "admin",
		isStaff: role === "staff",
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
