import React, { useState, useEffect } from "react";
import {
	Plus,
	Edit,
	Trash2,
	X,
	CreditCard,
	User,
	Utensils,
	Image,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { planSchema } from "../validations/subscriberSchema";
import useSubscriptionPlansStore from "../stores/useSubscriptionPlanStore";
import { Loading } from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";

const SubscriptionPlansPage = () => {
	const {
		plans,
		loading,
		fetchPlans,
		createPlan,
		updatePlanById,
		deletePlanById,
	} = useSubscriptionPlansStore();

	const [showModal, setShowModal] = useState(false);
	const [editingPlan, setEditingPlan] = useState(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
		setValue,
		watch,
	} = useForm({
		resolver: zodResolver(planSchema),
	});

	const watchImageUrl = watch("image_url");

	useEffect(() => {
		fetchPlans();
	}, []);

	const openCreateModal = () => {
		setEditingPlan(null);
		reset({
			plan_name: "",
			main_dish_choice: 1,
			side_dish_choice: 0,
			price: 0,
			points_included: 0,
			image_url: "",
			is_active: true,
		});
		setShowModal(true);
	};

	const openEditModal = (plan) => {
		setEditingPlan(plan);
		setValue("plan_name", plan.plan_name);
		setValue("main_dish_choice", plan.main_dish_choice);
		setValue("side_dish_choice", plan.side_dish_choice);
		setValue("price", plan.price);
		setValue("points_included", plan.points_included);
		setValue("image_url", plan.image_url || "");
		setValue("is_active", plan.is_active);
		setShowModal(true);
	};

	const onSubmit = async (data) => {
		try {
			let result;
			if (editingPlan) {
				result = await updatePlanById(editingPlan.id, data);
			} else {
				result = await createPlan(data);
			}

			if (result.error) {
				throw result.error;
			}

			setShowModal(false);
			reset();
		} catch (error) {
			console.error("Error saving plan:", error);
			alert("Error saving subscription plan");
		}
	};

	const handleDelete = async (id) => {
		if (confirm("Are you sure you want to delete this subscription plan?")) {
			try {
				const result = await deletePlanById(id);
				if (result.error) {
					throw result.error;
				}
			} catch (error) {
				console.error("Error deleting plan:", error);
				alert("Error deleting subscription plan");
			}
		}
	};

	if (loading) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<PageHeader
				title="Subscription Plans"
				description="Manage meal subscription plans"
				buttons={[
					{
						type: "button",
						label: "Add Plan",
						shortlabel: "Add",
						icon: Plus,
						onClick: () => openCreateModal(true),
						variant: "primary",
					},
				]}
			/>

			{/* Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{plans.map((plan) => (
					<div key={plan.id} className="card bg-base-100 shadow-xl">
						{/* Plan Image */}
						{plan.image_url ? (
							<figure>
								<img
									src={plan.image_url}
									alt={plan.plan_name}
									className="w-full h-48 object-cover"
								/>
							</figure>
						) : (
							<div className="h-48 bg-gray-200 flex items-center justify-center">
								<Image className="w-12 h-12 text-gray-400" />
							</div>
						)}

						<div className="card-body">
							<div className="flex justify-between items-start mb-2">
								<h2 className="card-title text-xl">{plan.plan_name}</h2>
								<span
									className={`badge ${
										plan.is_active ? "badge-success" : "badge-error"
									}`}>
									{plan.is_active ? "Active" : "Inactive"}
								</span>
							</div>

							{/* Price */}
							<div className="mb-4">
								<div className="text-3xl font-bold text-primary">
									฿{plan.price}
								</div>
								<div className="text-sm text-gray-500">
									{plan.points_included} points included
								</div>
							</div>

							{/* Features */}
							<div className="space-y-2 mb-4">
								<div className="flex items-center gap-2">
									<Utensils className="w-4 h-4 text-gray-400" />
									<span className="text-sm">
										{plan.main_dish_choice} Main Dish Choice
										{plan.main_dish_choice > 1 ? "s" : ""}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Utensils className="w-4 h-4 text-gray-400" />
									<span className="text-sm">
										{plan.side_dish_choice} Side Dish Choice
										{plan.side_dish_choice > 1 ? "s" : ""}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<CreditCard className="w-4 h-4 text-gray-400" />
									<span className="text-sm">Points-based system</span>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="card-actions justify-end">
								<button
									className="btn btn-sm btn-ghost"
									onClick={() => openEditModal(plan)}>
									<Edit className="w-4 h-4" />
								</button>
								<button
									className="btn btn-sm btn-ghost text-red-600"
									onClick={() => handleDelete(plan.id)}>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{plans.length === 0 && (
				<div className="text-center py-12">
					<p className="text-gray-500 text-lg">No subscription plans found</p>
					<button className="btn btn-primary mt-4" onClick={openCreateModal}>
						Create Your First Plan
					</button>
				</div>
			)}

			{/* Create/Edit Modal */}
			{showModal && (
				<div className="modal modal-open">
					<div className="modal-box w-11/12 max-w-2xl">
						<h3 className="font-bold text-lg mb-4">
							{editingPlan ? "Edit Plan" : "Create New Plan"}
						</h3>

						<div className="space-y-4">
							{/* Image Preview */}
							{watchImageUrl && (
								<div className="form-control">
									<label className="label">
										<span className="label-text">Image Preview</span>
									</label>
									<div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
										<img
											src={watchImageUrl}
											alt="Plan preview"
											className="w-full h-full object-cover"
											onError={(e) => {
												e.target.style.display = "none";
											}}
										/>
									</div>
								</div>
							)}

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="form-control">
									<label className="label">
										<span className="label-text">Plan Name *</span>
									</label>
									<input
										{...register("plan_name")}
										className="input input-bordered"
										placeholder="e.g., Premium Plan"
									/>
									{errors.plan_name && (
										<span className="text-red-500 text-sm">
											{errors.plan_name.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Price (THB) *</span>
									</label>
									<input
										{...register("price", { valueAsNumber: true })}
										type="number"
										step="0.01"
										className="input input-bordered"
										placeholder="0.00"
									/>
									{errors.price && (
										<span className="text-red-500 text-sm">
											{errors.price.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Main Dish Choices *</span>
									</label>
									<input
										{...register("main_dish_choice", { valueAsNumber: true })}
										type="number"
										min="0"
										className="input input-bordered"
										placeholder="1"
									/>
									{errors.main_dish_choice && (
										<span className="text-red-500 text-sm">
											{errors.main_dish_choice.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Side Dish Choices *</span>
									</label>
									<input
										{...register("side_dish_choice", { valueAsNumber: true })}
										type="number"
										min="0"
										className="input input-bordered"
										placeholder="0"
									/>
									{errors.side_dish_choice && (
										<span className="text-red-500 text-sm">
											{errors.side_dish_choice.message}
										</span>
									)}
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Points Included *</span>
									</label>
									<input
										{...register("points_included", { valueAsNumber: true })}
										type="number"
										min="0"
										className="input input-bordered"
										placeholder="0"
									/>
									{errors.points_included && (
										<span className="text-red-500 text-sm">
											{errors.points_included.message}
										</span>
									)}
								</div>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Image URL</span>
								</label>
								<input
									{...register("image_url")}
									className="input input-bordered"
									placeholder="https://example.com/image.jpg"
								/>
								{errors.image_url && (
									<span className="text-red-500 text-sm">
										{errors.image_url.message}
									</span>
								)}
							</div>

							<div className="form-control">
								<label className="label cursor-pointer">
									<span className="label-text">Active Plan</span>
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
									{editingPlan ? "Update" : "Create"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SubscriptionPlansPage;
