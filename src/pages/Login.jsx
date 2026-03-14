// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.png";
import { AlertCircleIcon } from "lucide-react";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const { signIn } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const { data, error } = await signIn(email, password);

		if (error) {
			setError(error.message);
			setLoading(false);
		} else {
			// Check role for redirection
			const role = data.user?.user_metadata?.role;
			if (role === "admin") {
				navigate({ to: "/dashboard" });
			} else {
				navigate({ to: "/orders" });
			}
		}
	};

	return (
		<div
			className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
			style={{
				backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/splash_bg.jpg')`,
			}}>
			<div className="card w-full max-w-md bg-base-100/95 backdrop-blur-sm shadow-2xl mx-4">
				<div className="card-body p-8">
					<div className="flex flex-col items-center">
						<div className="avatar mb-4">
							<div className="w-24 rounded-full shadow-lg bg-white p-2">
								<img src={logo} alt="Shal Phyoke Logo" />
							</div>
						</div>
						<h2 className="text-3xl font-extrabold text-center text-primary">
							Shal Phyoke
						</h2>
						<p className="text-base-content/60 text-sm mt-1">
							Admin & Staff Portal
						</p>
					</div>

					{error && (
						<div className="alert alert-error mb-2 py-2 shadow-sm">
							<AlertCircleIcon className="w-5 h-5" />
							<span className="text-sm font-medium">{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-2">
						<div className="form-control">
							<label className="label pb-1">
								<span className="label-text font-bold">Email Address</span>
							</label>
							<input
								type="email"
								placeholder="admin@shalphyoke.com"
								className="input input-bordered focus:input-primary transition-all w-full"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>

						<div className="form-control">
							<label className="label pb-1">
								<span className="label-text font-bold">Password</span>
							</label>
							<input
								type="password"
								placeholder="••••••••"
								className="input input-bordered focus:input-primary transition-all w-full"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>

						<div className="form-control mt-8">
							<button
								type="submit"
								className={`btn btn-primary btn-block text-lg h-12`}
								disabled={loading}>
								{loading ? "Loading" : "Sign In"}
							</button>
						</div>
					</form>

					<div className="mt-8 text-center border-t border-base-200">
						<p className="text-xs text-base-content/40">
							&copy; {new Date().getFullYear()} Shal Phyoke
							<br />
							Written and Maintained by Oak
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
