import { useEffect, useState } from "react";
import useSubscribersStore from "../stores/useSubscriberStore";
import useSubscriptionPlansStore from "../stores/useSubscriptionPlanStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscriberSchema } from "../validations/subscriberSchema";
import { Calendar, Edit, Eye, Plus, Trash2, X } from "lucide-react";
import { avatar_placeholder } from "../constants";
import Loading from "../components/common/Loading";
// Subscribers Component (Table Format)
export const SubscribersPage = () => {
	const {
		subscribers,
		loading,
		fetchSubscribers,
		createSubscriber,
		updateSubscriberById,
		deleteSubscriberById,
	} = useSubscribersStore();

	const { plans } = useSubscriptionPlansStore();

	const [showModal, setShowModal] = useState(false);
	const [showDetailsModal, setShowDetailsModal] = useState(false);
	const [editingSubscriber, setEditingSubscriber] = useState(null);
	const [selectedSubscriber, setSelectedSubscriber] = useState(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
		setValue,
	} = useForm({
		resolver: zodResolver(subscriberSchema),
	});

	useEffect(() => {
		fetchSubscribers();
	}, []);

	const openCreateModal = () => {
		setEditingSubscriber(null);
		reset({
			name: "",
			line_id: "",
			subscription_plan_id: "",
			remaining_points: 0,
			subscription_start_date: "",
			subscription_end_date: "",
			delivery_address: "",
			phone_number: "",
			special_instructions: "",
			is_active: true,
		});
		setShowModal(true);
	};

	const openEditModal = (subscriber) => {
		setEditingSubscriber(subscriber);
		setValue("name", subscriber.name);
		setValue("line_id", subscriber.line_id || "");
		setValue("subscription_plan_id", subscriber.subscription_plan_id);
		setValue("remaining_points", subscriber.remaining_points);
		setValue("subscription_start_date", subscriber.subscription_start_date);
		setValue("subscription_end_date", subscriber.subscription_end_date);
		setValue("delivery_address", subscriber.delivery_address);
		setValue("phone_number", subscriber.phone_number);
		setValue("special_instructions", subscriber.special_instructions || "");
		setValue("is_active", subscriber.is_active);
		setShowModal(true);
	};

	const onSubmit = async (data) => {
		try {
			let result;
			if (editingSubscriber) {
				result = await updateSubscriberById(editingSubscriber.id, data);
			} else {
				result = await createSubscriber(data);
			}

			if (result.error) {
				throw result.error;
			}

			setShowModal(false);
			reset();
		} catch (error) {
			console.error("Error saving subscriber:", error);
			alert("Error saving subscriber");
		}
	};

	const handleDelete = async (id) => {
		if (confirm("Are you sure you want to delete this subscriber?")) {
			try {
				const result = await deleteSubscriberById(id);
				if (result.error) {
					throw result.error;
				}
			} catch (error) {
				console.error("Error deleting subscriber:", error);
				alert("Error deleting subscriber");
			}
		}
	};

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

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="table table-zebra w-full">
					<thead>
						<tr>
							<th>Customer</th>
							<th>Plan</th>
							<th>Points</th>
							<th>Subscription Period</th>
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
												/>
											</div>
										</div>
										<div>
											<div className="font-bold">{subscriber.name}</div>
											<div className="text-sm opacity-50">
												{subscriber.line_id}
											</div>
										</div>
									</div>
								</td>
								<td>
									<span className="badge badge-outline">
										{subscriber?.subscription_plan?.plan_name || "Unknown Plan"}
									</span>
								</td>
								<td>
									<span className="font-mono">
										{subscriber.remaining_points}
									</span>
								</td>
								<td>
									<div className="text-sm">
										<div>
											{new Date(
												subscriber.subscription_start_date
											).toLocaleDateString()}
										</div>
										<div className="text-gray-500">
											to{" "}
											{new Date(
												subscriber.subscription_end_date
											).toLocaleDateString()}
										</div>
									</div>
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
											onClick={() => {
												setSelectedSubscriber(subscriber);
												setShowDetailsModal(true);
											}}>
											<Eye className="w-4 h-4" />
										</button>
										<button
											className="btn btn-sm btn-ghost"
											onClick={() => openEditModal(subscriber)}>
											<Edit className="w-4 h-4" />
										</button>
										<button
											className="btn btn-sm btn-ghost text-red-600"
											onClick={() => handleDelete(subscriber.id)}>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{subscribers.length === 0 && (
				<div className="text-center py-12">
					<p className="text-gray-500 text-lg">No subscribers found</p>
					<button className="btn btn-primary mt-4" onClick={openCreateModal}>
						Add Your First Subscriber
					</button>
				</div>
			)}

			{/* Create/Edit Modal */}
			{showModal && (
				<div className="modal modal-open">
					<div className="modal-box w-11/12 max-w-2xl">
						<h3 className="font-bold text-lg mb-4">
							{editingSubscriber ? "Edit Subscriber" : "Add New Subscriber"}
						</h3>

						<div className="space-y-4">
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
									{errors.line_id && (
										<span className="text-red-500 text-sm">
											{errors.line_id.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Subscription Plan *</span>
									</label>
									<select
										{...register("subscription_plan_id")}
										className="select select-bordered">
										<option value="">Select a plan</option>
										{plans.map((plan) => (
											<option key={plan.id} value={plan.id}>
												{plan.plan_name} - ฿{plan.price_thb}
											</option>
										))}
									</select>
									{errors.subscription_plan_id && (
										<span className="text-red-500 text-sm">
											{errors.subscription_plan_id.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Remaining Points *</span>
									</label>
									<input
										{...register("remaining_points", { valueAsNumber: true })}
										type="number"
										className="input input-bordered"
										placeholder="0"
									/>
									{errors.remaining_points && (
										<span className="text-red-500 text-sm">
											{errors.remaining_points.message}
										</span>
									)}
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
									<label className="label">
										<span className="label-text">Start Date *</span>
									</label>
									<input
										{...register("subscription_start_date")}
										type="date"
										className="input input-bordered"
									/>
									{errors.subscription_start_date && (
										<span className="text-red-500 text-sm">
											{errors.subscription_start_date.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">End Date *</span>
									</label>
									<input
										{...register("subscription_end_date")}
										type="date"
										className="input input-bordered"
									/>
									{errors.subscription_end_date && (
										<span className="text-red-500 text-sm">
											{errors.subscription_end_date.message}
										</span>
									)}
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
									rows="2"></textarea>
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
									rows="2"></textarea>
							</div>

							<div className="form-control">
								<label className="label cursor-pointer">
									<span className="label-text">Active Subscription</span>
									<input
										{...register("is_active")}
										type="checkbox"
										className="toggle toggle-primary"
									/>
								</label>
							</div>

							<div className="modal-action">
								<button
									type="button"
									className="btn btn-ghost"
									onClick={() => setShowModal(false)}>
									Cancel
								</button>
								<button
									onClick={handleSubmit(onSubmit)}
									className="btn btn-primary">
									{editingSubscriber ? "Update" : "Add"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Details Modal */}
			{showDetailsModal && selectedSubscriber && (
				<div className="modal modal-open">
					<div className="modal-box w-11/12 max-w-lg">
						<div className="flex justify-between items-start mb-4">
							<h3 className="font-bold text-lg">Subscriber Details</h3>
							<button
								className="btn btn-sm btn-ghost"
								onClick={() => setShowDetailsModal(false)}>
								<X className="w-4 h-4" />
							</button>
						</div>

						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="avatar placeholder">
									<div className="bg-primary text-primary-content rounded-full w-12">
										<span>{selectedSubscriber.name?.charAt(0) || "U"}</span>
									</div>
								</div>
								<div>
									<div className="font-bold text-lg">
										{selectedSubscriber.name}
									</div>
									<div className="text-sm text-gray-500">
										{selectedSubscriber.line_id || "No LINE ID"}
									</div>
								</div>
							</div>

							<div className="divider"></div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<strong>Plan:</strong>
									<div className="badge badge-outline ml-2">
										{selectedSubscriber.plan_name}
									</div>
								</div>
								<div>
									<strong>Points:</strong>
									<span className="font-mono ml-2">
										{selectedSubscriber.remaining_points}
									</span>
								</div>
							</div>

							<div>
								<strong>Subscription Period:</strong>
								<div className="flex items-center gap-2 mt-1">
									<Calendar className="w-4 h-4" />
									<span>
										{new Date(
											selectedSubscriber.subscription_start_date
										).toLocaleDateString()}
									</span>
									<span>to</span>
									<span>
										{new Date(
											selectedSubscriber.subscription_end_date
										).toLocaleDateString()}
									</span>
								</div>
							</div>

							<div>
								<strong>Phone:</strong>
								<div className="mt-1">{selectedSubscriber.phone_number}</div>
							</div>

							<div>
								<strong>Delivery Address:</strong>
								<div className="mt-1 p-2 bg-gray-50 rounded">
									{selectedSubscriber.delivery_address}
								</div>
							</div>

							{selectedSubscriber.special_instructions && (
								<div>
									<strong>Special Instructions:</strong>
									<div className="mt-1 p-2 bg-yellow-50 rounded">
										{selectedSubscriber.special_instructions}
									</div>
								</div>
							)}

							<div>
								<strong>Status:</strong>
								<span
									className={`badge ${
										selectedSubscriber.is_active
											? "badge-success"
											: "badge-error"
									} ml-2`}>
									{selectedSubscriber.is_active ? "Active" : "Inactive"}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
