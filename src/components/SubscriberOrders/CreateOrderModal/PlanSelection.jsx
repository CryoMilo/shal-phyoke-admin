// components/SubscriberOrders/PlanSelection.js
export const PlanSelection = ({
	register,
	errors,
	hasMultipleActivePlans,
	availablePlans,
	selectedSubscriberPlan,
	availableSelections,
	onPlanChange,
	watchSubscriberId,
	watchSubscriberPlanId,
}) => {
	if (!watchSubscriberId) return null;

	if (hasMultipleActivePlans) {
		return (
			<div className="form-control w-full">
				<label className="label">
					<span className="label-text">Select Plan</span>
					<span className="label-text-alt text-warning">
						Required - subscriber has multiple plans
					</span>
				</label>
				<select
					{...register("subscriber_plan_id", {
						required: "Please select a plan",
					})}
					className={`select select-bordered w-full ${
						errors.subscriber_plan_id ? "select-error" : ""
					}`}
					onChange={(e) => onPlanChange(e.target.value)}
					value={watchSubscriberPlanId}>
					<option value="">Choose a plan</option>
					{availablePlans.map((plan) => (
						<option key={plan.id} value={plan.id}>
							{plan.subscription_plans?.plan_name} - {plan.remaining_points}{" "}
							points - {plan.serve_type}
						</option>
					))}
				</select>
				{errors.subscriber_plan_id && (
					<label className="label">
						<span className="label-text-alt text-error">
							{errors.subscriber_plan_id.message}
						</span>
					</label>
				)}
			</div>
		);
	}

	if (selectedSubscriberPlan) {
		return (
			<div className="alert alert-info">
				<div>
					<h4 className="font-semibold">Selected Plan</h4>
					<p className="text-sm">
						{selectedSubscriberPlan.subscription_plans?.plan_name} -{" "}
						{selectedSubscriberPlan.remaining_points} points -{" "}
						{selectedSubscriberPlan.serve_type}
					</p>
					<p className="text-xs mt-1">
						Main: {availableSelections.main_dish} | Side:{" "}
						{availableSelections.side_dish}
					</p>
				</div>
			</div>
		);
	}

	return null;
};
