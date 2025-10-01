import { useState } from "react";
import { avatar_placeholder } from "../../constants";
import { Calendar, X } from "lucide-react";

// Extracted Details Modal Component
export const DetailsModal = ({ subscriber, onClose }) => {
	const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);

	const currentPlan = subscriber.active_plans?.[selectedPlanIndex];
	const planDetails = currentPlan?.subscription_plans;

	return (
		<div className="modal modal-open">
			<div className="modal-box w-11/12 max-w-lg">
				<div className="flex justify-between items-start mb-4">
					<h3 className="font-bold text-lg">Subscriber Details</h3>
					<button className="btn btn-sm btn-ghost" onClick={onClose}>
						<X className="w-4 h-4" />
					</button>
				</div>

				<div className="space-y-4">
					<div className="flex items-center gap-4">
						<div className="avatar">
							<div className="w-16 rounded-full">
								<img
									src={subscriber?.image_url || avatar_placeholder}
									alt={subscriber.name}
								/>
							</div>
						</div>
						<div>
							<div className="font-bold text-lg">{subscriber.name}</div>
							<div className="text-sm text-gray-500">
								{subscriber.line_id || "No LINE ID"}
							</div>
						</div>
					</div>

					<div className="divider"></div>

					{/* Plan Selector if multiple plans */}
					{subscriber.active_plans?.length > 1 && (
						<div className="form-control">
							<label className="label">
								<span className="label-text font-semibold">
									Select Plan to View:
								</span>
							</label>
							<select
								className="select select-bordered"
								value={selectedPlanIndex}
								onChange={(e) =>
									setSelectedPlanIndex(parseInt(e.target.value))
								}>
								{subscriber.active_plans.map((plan, index) => (
									<option key={plan.id} value={index}>
										{plan.subscription_plans?.plan_name} (
										{plan.remaining_points} points)
									</option>
								))}
							</select>
						</div>
					)}

					{/* Plan Details */}
					{currentPlan ? (
						<>
							<div className="card bg-base-200">
								<div className="card-body p-4">
									<h4 className="font-semibold mb-2">Plan Details</h4>
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div>
											<span className="text-gray-500">Plan Name:</span>
											<div className="font-semibold">
												{planDetails?.plan_name}
											</div>
										</div>
										<div>
											<span className="text-gray-500">Points:</span>
											<div className="font-mono font-semibold">
												{currentPlan.remaining_points}
											</div>
										</div>
										<div>
											<span className="text-gray-500">Serve Type:</span>
											<div className="badge badge-ghost">
												{currentPlan.serve_type}
											</div>
										</div>
										<div>
											<span className="text-gray-500">Main Dishes:</span>
											<div className="font-semibold">
												{planDetails?.main_dish_choice}
											</div>
										</div>
										<div>
											<span className="text-gray-500">Side Dishes:</span>
											<div className="font-semibold">
												{planDetails?.side_dish_choice}
											</div>
										</div>
										<div>
											<span className="text-gray-500">Price:</span>
											<div className="font-semibold">฿{planDetails?.price}</div>
										</div>
									</div>
								</div>
							</div>

							<div>
								<strong>Subscription Period:</strong>
								<div className="flex items-center gap-2 mt-1 text-sm">
									<Calendar className="w-4 h-4" />
									<span>
										{new Date(
											currentPlan.subscription_start_date
										).toLocaleDateString()}
									</span>
									<span>to</span>
									<span>
										{new Date(
											currentPlan.subscription_end_date
										).toLocaleDateString()}
									</span>
								</div>
							</div>
						</>
					) : (
						<div className="alert alert-warning">
							<span>No active subscription plans</span>
						</div>
					)}

					<div className="divider"></div>

					<div>
						<strong>Phone:</strong>
						<div className="mt-1">{subscriber.phone_number}</div>
					</div>

					<div>
						<strong>Delivery Address:</strong>
						<div className="mt-1 p-2 bg-gray-50 rounded">
							{subscriber.delivery_address}
						</div>
					</div>

					{subscriber.special_instructions && (
						<div>
							<strong>Special Instructions:</strong>
							<div className="mt-1 p-2 bg-yellow-50 rounded">
								{subscriber.special_instructions}
							</div>
						</div>
					)}

					<div>
						<strong>Status:</strong>
						<span
							className={`badge ${
								subscriber.is_active ? "badge-success" : "badge-error"
							} ml-2`}>
							{subscriber.is_active ? "Active" : "Inactive"}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};
