// src/contexts/AuthContext.jsx - Add console logs for debugging
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);

	console.log("AuthProvider - initial render");

	useEffect(() => {
		console.log("AuthProvider - useEffect started");

		// Check active sessions
		supabase.auth.getSession().then(({ data: { session } }) => {
			console.log("AuthProvider - session:", session);
			setUser(session?.user ?? null);
			if (session?.user) {
				fetchUserProfile(session.user.id);
			} else {
				setLoading(false);
			}
		});

		// Listen for changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			console.log("AuthProvider - auth state changed:", _event, session);
			setUser(session?.user ?? null);
			if (session?.user) {
				fetchUserProfile(session.user.id);
			} else {
				setProfile(null);
				setLoading(false);
			}
		});

		return () => subscription.unsubscribe();
	}, []);

	const fetchUserProfile = async (userId) => {
		console.log("AuthProvider - fetching profile for:", userId);
		try {
			const { data, error } = await supabase
				.from("user_profiles")
				.select("*")
				.eq("id", userId)
				.single();

			if (error) throw error;
			console.log("AuthProvider - profile fetched:", data);
			setProfile(data);
		} catch (error) {
			console.error("Error fetching user profile:", error);
		} finally {
			setLoading(false);
		}
	};

	const signIn = async (email, password) => {
		console.log("AuthProvider - sign in attempt");
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		
		if (data?.user) {
			setUser(data.user);
			await fetchUserProfile(data.user.id);
		}
		
		return { data, error };
	};

	const signOut = async () => {
		console.log("AuthProvider - sign out");
		const { error } = await supabase.auth.signOut();
		if (!error) {
			setUser(null);
			setProfile(null);
		}
		return { error };
	};

	const value = {
		user,
		profile,
		loading,
		signIn,
		signOut,
		isAdmin: profile?.role === "admin",
		isStaff: profile?.role === "staff",
	};

	console.log("AuthProvider - rendering with value:", {
		user,
		profile,
		loading,
	});

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
