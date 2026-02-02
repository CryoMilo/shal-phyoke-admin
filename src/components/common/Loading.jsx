export const Loading = ({ message = "Loading..." }) => {
	return (
		<div className="min-h-screen bg-base-100 flex items-center justify-center">
			<div className="text-center">
				<span className="loading loading-spinner loading-lg text-primary"></span>
				<p className="mt-4 text-base-content/70">{message}</p>
			</div>
		</div>
	);
};
