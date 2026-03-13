// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/common/Loading";

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

		const { error } = await signIn(email, password);

		if (error) {
			setError(error.message);
			setLoading(false);
		} else {
			navigate({ to: "/" });
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-base-200">
			<div className="card w-96 bg-base-100 shadow-xl">
				<div className="card-body">
					<h2 className="card-title text-2xl font-bold text-center mb-4">
						Shal Phyoke Admin
					</h2>

					{error && (
						<div className="alert alert-error">
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmit}>
						<div className="form-control">
							<label className="label">
								<span className="label-text">Email</span>
							</label>
							<input
								type="email"
								placeholder="email@example.com"
								className="input input-bordered"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>

						<div className="form-control mt-4">
							<label className="label">
								<span className="label-text">Password</span>
							</label>
							<input
								type="password"
								placeholder="••••••••"
								className="input input-bordered"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>

						<div className="form-control mt-6">
							<button
								type="submit"
								className="btn btn-primary"
								disabled={loading}>
								{loading ? <Loading /> : "Sign In"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Login;
