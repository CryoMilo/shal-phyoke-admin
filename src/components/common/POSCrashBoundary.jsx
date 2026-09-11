import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import useOrderStore from "../../stores/orderStore";

class POSCrashBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null, errorInfo: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("POS Component Crash caught by ErrorBoundary:", error, errorInfo);
		this.setState({ errorInfo });
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: null, errorInfo: null });
	};

	handleResetCart = () => {
		try {
			useOrderStore.getState().clearCart();
		} catch (e) {
			console.error("Failed to clear cart during boundary reset:", e);
		}
		this.handleRetry();
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className="p-6 max-w-2xl mx-auto my-8">
					<div className="card bg-base-100 border border-base-300 shadow-lg overflow-hidden">
						<div className="p-6 space-y-4">
							<div className="flex items-start gap-3">
								<div className="p-2.5 rounded-xl bg-warning/10 text-warning shrink-0 mt-0.5">
									<AlertTriangle className="w-6 h-6" />
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="font-bold text-lg text-base-content">
										{this.props.title || "This screen encountered an issue"}
									</h3>
									<p className="text-sm text-base-content/70 mt-1">
										An unexpected error occurred in this view. Other tabs and functions
										remain operational.
									</p>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-3 pt-2">
								<button
									type="button"
									onClick={this.handleRetry}
									className="btn btn-primary btn-sm gap-2">
									<RotateCcw className="w-4 h-4" />
									Reload View
								</button>
								{this.props.allowResetCart && (
									<button
										type="button"
										onClick={this.handleResetCart}
										className="btn btn-outline border-base-300 hover:border-base-400 btn-sm">
										Clear Active Cart & Retry
									</button>
								)}
							</div>

							{this.state.error && (
								<div className="collapse collapse-arrow bg-base-200 rounded-lg text-xs mt-3">
									<input type="checkbox" />
									<div className="collapse-title font-medium opacity-60">
										View technical details
									</div>
									<div className="collapse-content overflow-x-auto">
										<pre className="text-error font-mono text-xs whitespace-pre-wrap">
											{this.state.error?.toString()}
										</pre>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default POSCrashBoundary;
