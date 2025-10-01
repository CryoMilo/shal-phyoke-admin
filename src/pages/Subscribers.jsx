import { useEffect, useState, useCallback } from "react";
import useSubscribersStore from "../stores/useSubscriberStore";
import useSubscriptionPlansStore from "../stores/useSubscriptionPlanStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import Loading from "../components/common/Loading";
import { SubscribersTable } from "../components/Subscribers/SubscribersTable";
import { SubscriberModal } from "../components/Subscribers/SubscriberModal";
import { subscriberSchema } from "../validations/subscriberSchema";
import { DetailsModal } from "../components/Subscribers/DetailsModal";

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
		deactivateSubscriberPlan,
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

			// Set existing plan instances from the store
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

	// Handle plan updates using the improved store methods
	const handlePlanUpdates = useCallback(
		async (subscriberId) => {
			if (!editingSubscriber) return;

			try {
				// Get existing subscriber plan IDs from the store
				const existingSubscriberPlanIds =
					editingSubscriber.active_plans?.map((p) => p.id) || [];
				const currentInstanceSubscriberPlanIds = selectedPlanInstances
					.filter((i) => i.subscriberPlanId)
					.map((i) => i.subscriberPlanId);

				// Deactivate removed plans using the store method
				const removedPlanIds = existingSubscriberPlanIds.filter(
					(id) => !currentInstanceSubscriberPlanIds.includes(id)
				);

				for (const subscriberPlanId of removedPlanIds) {
					await deactivateSubscriberPlan(subscriberPlanId);
				}

				// Update or create plan instances
				for (const instance of selectedPlanInstances) {
					const planData = {
						remaining_points: instance.remaining_points,
						serve_type: instance.serve_type,
						subscription_start_date: instance.subscription_start_date,
					};

					if (instance.subscriberPlanId) {
						// Update existing plan using store method
						await updateSubscriberPlan(instance.subscriberPlanId, planData);
					} else {
						// Create new plan instance using store method
						await createSubscriberPlan({
							subscriber_id: subscriberId,
							subscription_plan_id: instance.planId,
							...planData,
							is_active: true,
						});
					}
				}
			} catch (error) {
				console.error("Error updating plans:", error);
				throw error;
			}
		},
		[
			editingSubscriber,
			selectedPlanInstances,
			deactivateSubscriberPlan,
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

			if (editingSubscriber) {
				// Update subscriber info
				const result = await updateSubscriberById(
					editingSubscriber.id,
					subscriberData
				);

				if (result.error) throw result.error;

				// Handle plan updates - store will update UI automatically
				await handlePlanUpdates(editingSubscriber.id);
			} else {
				// Create new subscriber
				const result = await createSubscriber(subscriberData);

				if (result.error) throw result.error;

				// Create all plan instances - store will update UI automatically
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
