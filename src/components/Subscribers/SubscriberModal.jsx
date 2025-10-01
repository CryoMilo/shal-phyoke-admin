import { Plus, Trash2 } from "lucide-react";

// Extracted Modal Component
export const SubscriberModal = ({
	editingSubscriber,
	showModal,
	onClose,
	onSubmit,
	register,
	errors,
	plans,
	selectedPlanInstances,
	onAddPlan,
	onRemovePlan,
	onUpdatePlan,
}) => {
	if (!showModal) return null;

	return (
		<div className="modal modal-open">
			<div className="modal-box w-11/12 max-w-3xl max-h-[90vh] overflow-y-auto">
				<h3 className="font-bold text-lg mb-4">
					{editingSubscriber ? "Edit Subscriber" : "Add New Subscriber"}
				</h3>

				<form onSubmit={onSubmit} className="space-y-4">
					{/* Basic Information */}
					<div className="card bg-base-200">
						<div className="card-body p-4">
							<h4 className="font-semibold mb-2">Basic Information</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="form-control">
									<label className="label">
										<span className="label-text">Name *</span>
									</label>
									<input
										{...register("name")}
										className="input input-bordered"
										placeholder="Enter customer name"
									/>
									{errors.name && (
										<span className="text-red-500 text-sm">
											{errors.name.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">LINE ID</span>
									</label>
									<input
										{...register("line_id")}
										className="input input-bordered"
										placeholder="LINE user ID (optional)"
									/>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Phone Number *</span>
									</label>
									<input
										{...register("phone_number")}
										className="input input-bordered"
										placeholder="+66-xxx-xxx-xxx"
									/>
									{errors.phone_number && (
										<span className="text-red-500 text-sm">
											{errors.phone_number.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label cursor-pointer justify-start gap-2">
										<input
											{...register("is_active")}
											type="checkbox"
											className="toggle toggle-primary"
										/>
										<span className="label-text">Active Subscription</span>
									</label>
								</div>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Delivery Address *</span>
								</label>
								<textarea
									{...register("delivery_address")}
									className="textarea textarea-bordered"
									placeholder="Enter delivery address"
									rows="2"
								/>
								{errors.delivery_address && (
									<span className="text-red-500 text-sm">
										{errors.delivery_address.message}
									</span>
								)}
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Special Instructions</span>
								</label>
								<textarea
									{...register("special_instructions")}
									className="textarea textarea-bordered"
									placeholder="Any special dietary requirements or instructions"
									rows="2"
								/>
							</div>
						</div>
					</div>

					{/* Subscription Plans */}
					<PlanManagementSection
						plans={plans}
						selectedPlanInstances={selectedPlanInstances}
						onAddPlan={onAddPlan}
						onRemovePlan={onRemovePlan}
						onUpdatePlan={onUpdatePlan}
					/>

					<div className="modal-action">
						<button type="button" className="btn btn-ghost" onClick={onClose}>
							Cancel
						</button>
						<button type="submit" className="btn btn-primary">
							{editingSubscriber ? "Update" : "Add"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

// Extracted Plan Management Component
const PlanManagementSection = ({
	plans,
	selectedPlanInstances,
	onAddPlan,
	onRemovePlan,
	onUpdatePlan,
}) => {
	return (
		<div className="card bg-base-200">
			<div className="card-body p-4">
				<div className="flex justify-between items-center mb-3">
					<h4 className="font-semibold">Subscription Plans *</h4>
					<div className="dropdown dropdown-end">
						<label tabIndex={0} className="btn btn-sm btn-primary">
							<Plus className="w-4 h-4 mr-1" />
							Add Plan
						</label>
						<ul
							tabIndex={0}
							className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 max-h-60 overflow-y-auto">
							{plans.map((plan) => (
								<li key={plan.id}>
									<a onClick={() => onAddPlan(plan.id)}>
										<div>
											<div className="font-semibold">{plan.plan_name}</div>
											<div className="text-xs text-gray-500">
												฿{plan.price} | {plan.points_included} points
											</div>
										</div>
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="space-y-3">
					{selectedPlanInstances.map((instance, index) => (
						<PlanInstanceCard
							key={instance.instanceId}
							instance={instance}
							index={index}
							plans={plans}
							onRemove={onRemovePlan}
							onUpdate={onUpdatePlan}
						/>
					))}
				</div>

				{selectedPlanInstances.length === 0 && (
					<div className="alert alert-warning mt-2">
						<span>
							Please add at least one plan using the "Add Plan" button
						</span>
					</div>
				)}
			</div>
		</div>
	);
};

// Extracted Plan Instance Component
const PlanInstanceCard = ({ instance, index, plans, onRemove, onUpdate }) => {
	const plan = plans.find((p) => p.id === instance.planId);

	return (
		<div className="border rounded-lg p-4 bg-base-100">
			<div className="flex items-start gap-3">
				<div className="flex-1">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<span className="badge badge-neutral">#{index + 1}</span>
							<span className="font-semibold">{plan?.plan_name}</span>
							<span className="badge badge-primary">฿{plan?.price}</span>
						</div>
						<button
							type="button"
							className="btn btn-ghost btn-sm text-red-600"
							onClick={() => onRemove(instance.instanceId)}>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
					<div className="text-sm text-gray-600 mb-3">
						Main: {plan?.main_dish_choice} | Side: {plan?.side_dish_choice}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
						<div className="form-control">
							<label className="label py-1">
								<span className="label-text text-xs">Points</span>
							</label>
							<input
								type="number"
								className="input input-bordered input-sm"
								value={instance.remaining_points || 0}
								onChange={(e) =>
									onUpdate(
										instance.instanceId,
										"remaining_points",
										parseInt(e.target.value) || 0
									)
								}
							/>
						</div>
						<div className="form-control">
							<label className="label py-1">
								<span className="label-text text-xs">Serve Type</span>
							</label>
							<select
								className="select select-bordered select-sm"
								value={instance.serve_type || "Delivery"}
								onChange={(e) =>
									onUpdate(instance.instanceId, "serve_type", e.target.value)
								}>
								<option value="Delivery">Delivery</option>
								<option value="Pickup">Pickup</option>
							</select>
						</div>
						<div className="form-control">
							<label className="label py-1">
								<span className="label-text text-xs">Start Date</span>
							</label>
							<input
								type="date"
								className="input input-bordered input-sm"
								value={instance.subscription_start_date || ""}
								onChange={(e) =>
									onUpdate(
										instance.instanceId,
										"subscription_start_date",
										e.target.value
									)
								}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
