import { useEffect, useState, useCallback } from "react";
import useSubscribersStore from "../stores/useSubscriberStore";
import useSubscriptionPlansStore from "../stores/useSubscriptionPlanStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Edit, Eye, Plus, Trash2, X } from "lucide-react";
import { avatar_placeholder } from "../constants";
import Loading from "../components/common/Loading";

// Schema validation
const subscriberSchema = z.object({
	name: z.string().min(1, "Name is required"),
	line_id: z.string().optional(),
	phone_number: z.string().min(1, "Phone number is required"),
	delivery_address: z.string().min(1, "Delivery address is required"),
	special_instructions: z.string().optional(),
	is_active: z.boolean().default(true),
});

export const SubscribersPage = () => {
	const {
		subscribers,
		loading,
		fetchSubscribers,
		createSubscriber,
		updateSubscriberById,
		deleteSubscriberById,
		createSubscriberPlan,
		updateSubscriberPlan,
	} = useSubscribersStore();

	const { plans, fetchPlans } = useSubscriptionPlansStore();

	const [showModal, setShowModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [editingSubscriber, setEditingSubscriber] = useState(null);
	const [selectedSubscriber, setSelectedSubscriber] = useState(null);
	const [selectedPlanInstances, setSelectedPlanInstances] = useState([]);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
		setValue,
	} = useForm({
		resolver: zodResolver(subscriberSchema),
	});

	// Fetch data
	useEffect(() => {
		fetchSubscribers();
		fetchPlans();
	}, [fetchSubscribers, fetchPlans]);

	// Reset form when modal closes
	useEffect(() => {
		if (!showModal) {
			resetForm();
		}
	}, [showModal]);

	const resetForm = useCallback(() => {
		reset({
			name: "",
			line_id: "",
			delivery_address: "",
			phone_number: "",
			special_instructions: "",
			is_active: true,
		});
		setSelectedPlanInstances([]);
		setEditingSubscriber(null);
	}, [reset]);

	const openCreateModal = () => {
		setEditingSubscriber(null);
		resetForm();
		setShowModal(true);
	};

	const openEditModal = useCallback(
		(subscriber) => {
			setEditingSubscriber(subscriber);
			setValue("name", subscriber.name);
			setValue("line_id", subscriber.line_id || "");
			setValue("delivery_address", subscriber.delivery_address || "");
			setValue("phone_number", subscriber.phone_number || "");
			setValue("special_instructions", subscriber.special_instructions || "");
			setValue("is_active", subscriber.is_active);

			// Set existing plan instances
			const instances =
				subscriber.active_plans?.map((plan) => ({
					instanceId: `existing-${plan.id}`,
					planId: plan.subscription_plan_id,
					subscriberPlanId: plan.id,
					remaining_points: plan.remaining_points,
					serve_type: plan.serve_type,
					subscription_start_date: plan.subscription_start_date,
				})) || [];

			setSelectedPlanInstances(instances);
			setShowModal(true);
		},
		[setValue]
	);

	const addPlanInstance = useCallback(
		(planId) => {
			const plan = plans.find((p) => p.id === planId);
			if (!plan) return;

			const newInstance = {
				instanceId: `new-${Date.now()}-${Math.random()}`,
				planId: planId,
				remaining_points: plan.points_included || 0,
				serve_type: "Delivery",
				subscription_start_date: new Date().toISOString().split("T")[0],
			};

			setSelectedPlanInstances((prev) => [...prev, newInstance]);
		},
		[plans]
	);

	const removePlanInstance = useCallback((instanceId) => {
		setSelectedPlanInstances((prev) =>
			prev.filter((instance) => instance.instanceId !== instanceId)
		);
	}, []);

	const updatePlanInstance = useCallback((instanceId, field, value) => {
		setSelectedPlanInstances((prev) =>
			prev.map((instance) =>
				instance.instanceId === instanceId
					? { ...instance, [field]: value }
					: instance
			)
		);
	}, []);

	const handlePlanUpdates = useCallback(
		async (subscriberId) => {
			if (!editingSubscriber) return;

			// Get existing subscriber plan IDs
			const existingSubscriberPlanIds =
				editingSubscriber.active_plans?.map((p) => p.id) || [];
			const currentInstanceSubscriberPlanIds = selectedPlanInstances
				.filter((i) => i.subscriberPlanId)
				.map((i) => i.subscriberPlanId);

			// Deactivate removed plans
			const removedPlanIds = existingSubscriberPlanIds.filter(
				(id) => !currentInstanceSubscriberPlanIds.includes(id)
			);

			for (const subscriberPlanId of removedPlanIds) {
				await updateSubscriberPlan(subscriberPlanId, { is_active: false });
			}

			// Update or create plan instances
			for (const instance of selectedPlanInstances) {
				if (instance.subscriberPlanId) {
					// Update existing plan
					await updateSubscriberPlan(instance.subscriberPlanId, {
						remaining_points: instance.remaining_points,
						serve_type: instance.serve_type,
						subscription_start_date: instance.subscription_start_date,
					});
				} else {
					// Create new plan instance
					await createSubscriberPlan({
						subscriber_id: subscriberId,
						subscription_plan_id: instance.planId,
						serve_type: instance.serve_type,
						remaining_points: instance.remaining_points,
						subscription_start_date: instance.subscription_start_date,
						is_active: true,
					});
				}
			}
		},
		[
			editingSubscriber,
			selectedPlanInstances,
			updateSubscriberPlan,
			createSubscriberPlan,
		]
	);

	const onSubmit = async (data) => {
		try {
			// Validate at least one plan is selected
			if (selectedPlanInstances.length === 0) {
				alert("Please add at least one subscription plan");
				return;
			}

			const subscriberData = {
				name: data.name,
				line_id: data.line_id,
				delivery_address: data.delivery_address,
				phone_number: data.phone_number,
				special_instructions: data.special_instructions,
				is_active: data.is_active,
			};

			let result;

			if (editingSubscriber) {
				// Update subscriber info
				result = await updateSubscriberById(
					editingSubscriber.id,
					subscriberData
				);

				if (result.error) throw result.error;

				// Handle plan updates
				await handlePlanUpdates(editingSubscriber.id);
			} else {
				// Create new subscriber
				result = await createSubscriber(subscriberData);

				if (result.error) throw result.error;

				// Create all plan instances
				for (const instance of selectedPlanInstances) {
					await createSubscriberPlan({
						subscriber_id: result.data.id,
						subscription_plan_id: instance.planId,
						serve_type: instance.serve_type,
						remaining_points: instance.remaining_points,
						subscription_start_date: instance.subscription_start_date,
						is_active: true,
					});
				}
			}

			setShowModal(false);
			await fetchSubscribers();
		} catch (error) {
			console.error("Error saving subscriber:", error);
			alert("Error saving subscriber: " + (error.message || "Unknown error"));
		}
	};

	const handleDelete = async (id) => {
		if (
			!confirm(
				"Are you sure you want to delete this subscriber? This will also delete all their subscription plans."
			)
		) {
			return;
		}

		try {
			const result = await deleteSubscriberById(id);
			if (result.error) {
				throw result.error;
			}
		} catch (error) {
			console.error("Error deleting subscriber:", error);
			alert("Error deleting subscriber");
		}
	};

	const openDetailsModal = useCallback((subscriber) => {
		setSelectedSubscriber(subscriber);
		setShowDetailsModal(true);
	}, []);

	const closeModals = useCallback(() => {
		setShowModal(false);
		setShowDetailsModal(false);
	}, []);

	if (loading) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">Subscribers</h1>
					<p className="text-gray-600">Manage subscription customers</p>
				</div>
				<button className="btn btn-primary" onClick={openCreateModal}>
					<Plus className="w-4 h-4 mr-2" />
					Add Subscriber
				</button>
			</div>

			{/* Subscribers Table */}
			<SubscribersTable
				subscribers={subscribers}
				onView={openDetailsModal}
				onEdit={openEditModal}
				onDelete={handleDelete}
			/>

			{/* Create/Edit Modal */}
			{showModal && (
				<SubscriberModal
					editingSubscriber={editingSubscriber}
					showModal={showModal}
					onClose={closeModals}
					onSubmit={handleSubmit(onSubmit)}
					register={register}
					errors={errors}
					plans={plans}
					selectedPlanInstances={selectedPlanInstances}
					onAddPlan={addPlanInstance}
					onRemovePlan={removePlanInstance}
					onUpdatePlan={updatePlanInstance}
				/>
			)}

			{/* Details Modal */}
			{showDetailsModal && selectedSubscriber && (
				<DetailsModal subscriber={selectedSubscriber} onClose={closeModals} />
			)}
		</div>
	);
};

// Extracted Table Component
const SubscribersTable = ({ subscribers, onView, onEdit, onDelete }) => {
	if (subscribers.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500 text-lg">No subscribers found</p>
				<button className="btn btn-primary mt-4" onClick={() => onEdit(null)}>
					Add Your First Subscriber
				</button>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="table table-zebra w-full">
				<thead>
					<tr>
						<th>Customer</th>
						<th>Current Plan</th>
						<th>Points</th>
						<th>Serve Type</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{subscribers.map((subscriber) => (
						<tr key={subscriber.id}>
							<td>
								<div className="flex items-center gap-3">
									<div className="avatar">
										<div className="w-16 rounded-full">
											<img
												src={subscriber?.image_url || avatar_placeholder}
												alt={subscriber.name}
											/>
										</div>
									</div>
									<div>
										<div className="font-bold">{subscriber.name}</div>
										<div className="text-sm opacity-50">
											{subscriber.line_id || "No LINE ID"}
										</div>
									</div>
								</div>
							</td>
							<td>
								<div className="flex flex-col gap-1">
									<span className="badge badge-outline">
										{subscriber.plan_name}
									</span>
									{subscriber.active_plans?.length > 1 && (
										<span className="text-xs text-gray-500">
											+{subscriber.active_plans.length - 1} more plan(s)
										</span>
									)}
								</div>
							</td>
							<td>
								<span className="font-mono font-semibold">
									{subscriber.remaining_points}
								</span>
							</td>
							<td>
								<span className="badge badge-ghost">
									{subscriber.serve_type || "N/A"}
								</span>
							</td>
							<td>
								<span
									className={`badge ${
										subscriber.is_active ? "badge-success" : "badge-error"
									}`}>
									{subscriber.is_active ? "Active" : "Inactive"}
								</span>
							</td>
							<td>
								<div className="flex gap-2">
									<button
										className="btn btn-sm btn-ghost"
										onClick={() => onView(subscriber)}>
										<Eye className="w-4 h-4" />
									</button>
									<button
										className="btn btn-sm btn-ghost"
										onClick={() => onEdit(subscriber)}>
										<Edit className="w-4 h-4" />
									</button>
									<button
										className="btn btn-sm btn-ghost text-red-600"
										onClick={() => onDelete(subscriber.id)}>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

// Extracted Modal Component
const SubscriberModal = ({
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

// Extracted Details Modal Component
const DetailsModal = ({ subscriber, onClose }) => {
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
