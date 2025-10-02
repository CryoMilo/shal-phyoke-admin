import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { subscriberOrderSchema } from "../validations/subscriberOrderSchema";
import { useOrderCreationStore } from "../stores/subscriberOrderStore";
import useSubscribersStore from "../stores/useSubscriberStore";
import { SubscriberOrderCard } from "../components/SubscriberOrders/SubscriberOrderCard";

export const SubscriberOrder = () => {
	const {
		todayMenuItems,
		tomorrowMenuItems,
		selectedSubscriberPlan,
		selectedDay,
		selectedMenuItems,
		availableSelections,
		usedSelections,
		isAfter10AM,
		setSelectedSubscriber,
		setSelectedSubscriberPlan,
		setSelectedDay,
		toggleMenuItemSelection,
		fetchAvailableMenuItems,
		checkTimeRestriction,
		isValidSelection,
		resetSelections,
		orders,
		loadingOrders,
		fetchSubscriberOrders,
		createOrder,
		hasMultipleActivePlans,
		getAvailablePlans,
	} = useOrderCreationStore();

	const { subscribers, fetchSubscribers, loading } = useSubscribersStore(); // CHANGED: Use subscribers instead of activeSubscribers

	const [showCreateModal, setShowCreateModal] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
		reset,
		watch,
	} = useForm({
		resolver: zodResolver(subscriberOrderSchema),
		defaultValues: {
			subscriber_id: "",
			subscriber_plan_id: "",
			day_selection: "",
			menu_selections: [],
			eat_in: false,
			note: "",
		},
	});

	// Watch form values for real-time validation
	const watchSubscriberId = watch("subscriber_id");
	const watchSubscriberPlanId = watch("subscriber_plan_id");

	// Get active subscribers from the full subscribers list
	const activeSubscribers = subscribers.filter((sub) => sub.is_active); // CHANGED: Filter active subscribers

	// ---------- INIT ----------
	useEffect(() => {
		fetchAvailableMenuItems();
		checkTimeRestriction();
		fetchSubscribers(); // CHANGED: Use fetchSubscribers instead of fetchActiveSubscribers
		fetchSubscriberOrders();
		const interval = setInterval(checkTimeRestriction, 60000);
		return () => clearInterval(interval);
	}, []);

	// Reset form when modal closes
	useEffect(() => {
		if (!showCreateModal) {
			reset();
			resetSelections();
		}
	}, [showCreateModal, reset, resetSelections]);

	// ---------- Handlers ----------
	const handleSubscriberChange = (subscriberId) => {
		const subscriber = activeSubscribers.find((s) => s.id === subscriberId);
		if (!subscriber) return;

		setSelectedSubscriber(subscriber);
		setValue("subscriber_id", subscriberId);
		setValue("subscriber_plan_id", "");
		setValue("day_selection", "");
		setValue("menu_selections", []);
	};

	const handlePlanChange = (planId) => {
		setSelectedSubscriberPlan(planId);
		setValue("subscriber_plan_id", planId);
		setValue("menu_selections", []);
	};

	const handleDayChange = (day) => {
		setSelectedDay(day);
		setValue("day_selection", day);
		setValue("menu_selections", []);
	};

	const toggleMenuItemSelectionSmart = (menuItem) => {
		if (!selectedSubscriberPlan) return;

		const isSelected = selectedMenuItems.some((s) => s.id === menuItem.id);
		if (isSelected) {
			toggleMenuItemSelection(menuItem);
		} else {
			if (usedSelections.main_dish < availableSelections.main_dish) {
				toggleMenuItemSelection(menuItem);
			} else if (usedSelections.side_dish < availableSelections.side_dish) {
				toggleMenuItemSelection(menuItem);
			}
		}
		const currentIds = selectedMenuItems.map((i) => i.id);
		setValue("menu_selections", currentIds);
	};

	const onSubmit = async (data) => {
		if (!isValidSelection()) {
			alert("Please complete your selection");
			return;
		}

		try {
			await createOrder();
			await fetchSubscriberOrders();
			resetSelections();
			reset();
			setShowCreateModal(false);
			alert("Order created successfully!");
		} catch (err) {
			console.error("Error creating order:", err);
			alert("Error creating order: " + (err.message || "Unknown error"));
		}
	};

	const closeModal = () => {
		setShowCreateModal(false);
		reset();
		resetSelections();
	};

	// Get available plans for current subscriber
	const availablePlans = getAvailablePlans();

	// ---------- UI ----------
	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">Subscription Orders</h1>
					<p className="text-gray-600">Manage customer orders</p>
				</div>
				<button
					className="btn btn-primary"
					onClick={() => setShowCreateModal(true)}>
					<Plus className="w-4 h-4 mr-2" /> Create Order
				</button>
			</div>

			{/* Orders Grid */}
			{loadingOrders ? (
				<div className="text-center py-12 text-gray-500">Loading orders…</div>
			) : orders.length === 0 ? (
				<div className="text-center py-12 text-gray-500">No orders yet</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{orders.map((o) => (
						<SubscriberOrderCard key={o.id} order={o} />
					))}
				</div>
			)}

			{/* Create Modal */}
			<dialog
				className={`modal ${showCreateModal ? "modal-open" : ""}`}
				id="create-order-modal">
				<div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
					{/* Header */}
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-xl font-bold">Create Subscriber Order</h3>
						<button
							onClick={closeModal}
							className="btn btn-sm btn-circle btn-ghost">
							✕
						</button>
					</div>

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						{/* Subscriber Selection */}
						<div className="form-control w-full">
							<label className="label">
								<span className="label-text">Select Subscriber</span>
							</label>
							<select
								{...register("subscriber_id")}
								className={`select select-bordered w-full ${
									errors.subscriber_id ? "select-error" : ""
								}`}
								onChange={(e) => handleSubscriberChange(e.target.value)}
								value={watchSubscriberId}>
								<option value="">Choose a subscriber</option>
								{activeSubscribers.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name} – {s.active_plans?.length || 0} active plan(s)
									</option>
								))}
							</select>
							{errors.subscriber_id && (
								<label className="label">
									<span className="label-text-alt text-error">
										{errors.subscriber_id.message}
									</span>
								</label>
							)}
						</div>

						{/* Plan Selection - Show only if subscriber has multiple plans */}
						{watchSubscriberId && hasMultipleActivePlans() && (
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
									onChange={(e) => handlePlanChange(e.target.value)}
									value={watchSubscriberPlanId}>
									<option value="">Choose a plan</option>
									{availablePlans.map((plan) => (
										<option key={plan.id} value={plan.id}>
											{plan.subscription_plans?.plan_name} -
											{plan.remaining_points} points -{plan.serve_type}
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
						)}

						{/* Show plan info if only one plan exists */}
						{watchSubscriberId &&
							!hasMultipleActivePlans() &&
							selectedSubscriberPlan && (
								<div className="alert alert-info">
									<div>
										<h4 className="font-semibold">Selected Plan</h4>
										<p className="text-sm">
											{selectedSubscriberPlan.subscription_plans?.plan_name} -
											{selectedSubscriberPlan.remaining_points} points -
											{selectedSubscriberPlan.serve_type}
										</p>
										<p className="text-xs mt-1">
											Main: {availableSelections.main_dish} | Side:{" "}
											{availableSelections.side_dish}
										</p>
									</div>
								</div>
							)}

						{/* Day Selection - Show only when plan is selected */}
						{(watchSubscriberPlanId ||
							(!hasMultipleActivePlans() && selectedSubscriberPlan)) && (
							<div className="form-control">
								<label className="label">
									<span className="label-text">Select Day</span>
								</label>
								<div className="join w-full">
									<button
										type="button"
										className={`join-item btn flex-1 ${
											selectedDay === "today" ? "btn-primary" : "btn-outline"
										} ${isAfter10AM ? "btn-disabled" : ""}`}
										onClick={() => !isAfter10AM && handleDayChange("today")}
										disabled={isAfter10AM}>
										Today
										{isAfter10AM && (
											<span className="badge badge-sm badge-ghost ml-2">
												Unavailable after 10AM
											</span>
										)}
									</button>
									<button
										type="button"
										className={`join-item btn flex-1 ${
											selectedDay === "tomorrow" ? "btn-primary" : "btn-outline"
										}`}
										onClick={() => handleDayChange("tomorrow")}>
										Tomorrow
									</button>
								</div>
							</div>
						)}

						{/* Menu Selection */}
						{selectedDay && (
							<div className="form-control">
								<label className="label">
									<span className="label-text">
										Select Menu Items ({usedSelections.main_dish}/
										{availableSelections.main_dish} Main,{" "}
										{usedSelections.side_dish}/{availableSelections.side_dish}{" "}
										Side)
									</span>
								</label>
								<div className="space-y-2 max-h-96 overflow-y-auto p-2 border rounded-lg">
									{(selectedDay === "today"
										? todayMenuItems
										: tomorrowMenuItems
									).map((item) => {
										const chosen = selectedMenuItems.find(
											(sel) => sel.id === item.menu_items.id
										);
										const isMainDish = chosen?.type === "main_dish";
										const isSideDish = chosen?.type === "side_dish";

										return (
											<div
												key={item.id}
												onClick={() =>
													toggleMenuItemSelectionSmart(item.menu_items)
												}
												className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
													isMainDish
														? "border-primary bg-primary/10"
														: isSideDish
														? "border-secondary bg-secondary/10"
														: "border-base-300 hover:border-base-400"
												} ${
													!chosen &&
													usedSelections.total >= availableSelections.total
														? "opacity-50 cursor-not-allowed"
														: ""
												}`}>
												<div className="flex justify-between items-center">
													<div className="flex-1">
														<p className="font-semibold">
															{item.menu_items.name_burmese}
														</p>
														<p className="text-sm text-base-content/70">
															{item.menu_items.name_english}
														</p>
														<p className="text-xs text-base-content/50">
															{item.menu_items.category}
														</p>
													</div>
													{chosen && (
														<span
															className={`badge ${
																isMainDish ? "badge-primary" : "badge-secondary"
															}`}>
															{isMainDish ? "Main" : "Side"}
														</span>
													)}
												</div>
											</div>
										);
									})}
								</div>
								{errors.menu_selections && (
									<label className="label">
										<span className="label-text-alt text-error">
											{errors.menu_selections.message}
										</span>
									</label>
								)}
							</div>
						)}

						{/* Dine-in Option */}
						{selectedDay && (
							<div className="form-control">
								<label className="label cursor-pointer justify-start gap-3">
									<input
										type="checkbox"
										{...register("eat_in")}
										className="checkbox"
									/>
									<span className="label-text">
										Dine-In (unchecked = Delivery)
									</span>
								</label>
							</div>
						)}

						{/* Notes */}
						{selectedDay && (
							<div className="form-control">
								<label className="label">
									<span className="label-text">Additional Notes</span>
								</label>
								<textarea
									{...register("note")}
									className="textarea textarea-bordered h-20"
									placeholder="Any special instructions or notes..."
								/>
							</div>
						)}

						{/* Action Buttons */}
						<div className="modal-action">
							<button
								type="button"
								onClick={closeModal}
								className="btn btn-ghost">
								Cancel
							</button>
							<button
								type="submit"
								disabled={!isValidSelection() || isSubmitting}
								className="btn btn-primary">
								{isSubmitting ? (
									<>
										<span className="loading loading-spinner loading-sm"></span>
										Creating...
									</>
								) : (
									"Create Order"
								)}
							</button>
						</div>
					</form>
				</div>

				{/* Backdrop */}
				<form method="dialog" className="modal-backdrop">
					<button onClick={closeModal}>close</button>
				</form>
			</dialog>
		</div>
	);
};
