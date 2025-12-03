import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubscriberSelection } from "./SubscriberSelection";
import { PlanSelection } from "./PlanSelection";
import { DaySelection } from "./DaySelection";
import { MenuSelection } from "./MenuSelection";
import { OrderOptions } from "./OrderOptions";
import { AddOnsStep } from "./AddOnsStep";
import { subscriberOrderSchema } from "../../../validations/subscriberOrderSchema";
import { useOrderCreationStore } from "../../../stores/subscriberOrderStore";
import useSubscribersStore from "../../../stores/useSubscriberStore";
import { useRegularMenuStore } from "../../../stores/regularMenuStore";

export const CreateOrderModal = ({ showModal, onClose, onOrderCreated }) => {
	const {
		selectedSubscriberPlan,
		selectedDay,
		selectedMenuItems,
		selectedAddOns,
		addOnStep,
		availableSelections,
		usedSelections,
		isAfter10AM,
		setSelectedSubscriber,
		setSelectedSubscriberPlan,
		setSelectedDay,
		setAddOnStep,
		toggleMenuItemSelection,
		updateAddOnQuantity,
		toggleAllAddOnsPaid, // Make sure this exists in your store
		getAllAddOnsPaidStatus, // Make sure this exists in your store
		isValidSelection,
		resetSelections,
		createOrder,
		hasMultipleActivePlans,
		getAvailablePlans,
		updateMenuItemQuantity,
		todayMenuItems,
		tomorrowMenuItems,
		fetchAvailableMenuItems,
		checkTimeRestriction,
	} = useOrderCreationStore();

	const { subscribers } = useSubscribersStore();
	const { getAllRegularItems } = useRegularMenuStore();

	// Fetch menu items when modal opens
	React.useEffect(() => {
		if (showModal) {
			fetchAvailableMenuItems();
			checkTimeRestriction();
		}
	}, [showModal, fetchAvailableMenuItems, checkTimeRestriction]);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setValue,
		reset,
		watch,
		trigger,
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
		mode: "onChange",
	});

	const watchSubscriberId = watch("subscriber_id");
	const watchSubscriberPlanId = watch("subscriber_plan_id");
	const activeSubscribers = subscribers.filter((sub) => sub.is_active);
	const availablePlans = getAvailablePlans?.() || [];
	const allAddOnsPaid = getAllAddOnsPaidStatus?.() || false; // Get the current paid status

	// Add this function to get available add-on items
	const getAvailableAddOnItems = () => {
		if (!selectedDay) return [];

		// Get rotating menu items for selected day
		const rotatingMenuItems = (
			selectedDay === "today" ? todayMenuItems : tomorrowMenuItems
		)
			.map((item) => item.menu_items)
			.filter(Boolean);

		// Get regular menu items (all three categories)
		const regularMenuItems = getAllRegularItems?.() || [];

		// Combine and remove duplicates
		const allItems = [...rotatingMenuItems, ...regularMenuItems];
		const uniqueItems = allItems.filter(
			(item, index, self) => index === self.findIndex((i) => i.id === item.id)
		);

		return uniqueItems;
	};

	// Add this function to handle the paid status toggle
	const handleAllAddOnsPaidChange = (paidStatus) => {
		toggleAllAddOnsPaid(paidStatus);
	};

	const handleSubscriberChange = async (subscriberId) => {
		const subscriber = activeSubscribers.find((s) => s.id === subscriberId);
		if (!subscriber) return;

		await setSelectedSubscriber(subscriber);
		setValue("subscriber_id", subscriberId, { shouldValidate: true });
		setValue("subscriber_plan_id", "", { shouldValidate: true });
		setValue("day_selection", "", { shouldValidate: true });
		setValue("menu_selections", [], { shouldValidate: true });
		setAddOnStep(false); // Reset add-on step
		await trigger();
	};

	// Add this function for plan selection
	const handlePlanSelect = async (planId) => {
		await setSelectedSubscriberPlan(planId);
		setValue("subscriber_plan_id", planId, { shouldValidate: true });
		setValue("menu_selections", [], { shouldValidate: true });
		setAddOnStep(false); // Reset add-on step
		await trigger();
	};

	const handleDayChange = async (day) => {
		await setSelectedDay(day);
		setValue("day_selection", day, { shouldValidate: true });
		setValue("menu_selections", [], { shouldValidate: true });
		setAddOnStep(false); // Reset add-on step
		await trigger();
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
		setValue("menu_selections", currentIds, { shouldValidate: true });
		trigger("menu_selections");
	};

	const onSubmit = async () => {
		if (!isValidSelection()) {
			alert("Please complete your selection");
			return;
		}

		try {
			// Ensure all form values are set correctly
			setValue("subscriber_plan_id", selectedSubscriberPlan?.id, {
				shouldValidate: true,
			});
			setValue(
				"menu_selections",
				selectedMenuItems.map((item) => item.id),
				{ shouldValidate: true }
			);

			// Final validation check
			const isValid = await trigger();
			if (!isValid) {
				alert("Please fix the validation errors before submitting");
				return;
			}

			await createOrder();
			await onOrderCreated();
			resetSelections();
			reset();
			onClose();
			alert("Order created successfully!");
		} catch (err) {
			console.error("Error creating order:", err);
			alert("Error creating order: " + (err.message || "Unknown error"));
		}
	};

	const closeModal = () => {
		onClose();
		reset();
		resetSelections();
	};

	if (!showModal) return null;

	return (
		<dialog
			className={`modal ${showModal ? "modal-open" : ""}`}
			id="create-order-modal">
			<div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-xl font-bold">Create Subscriber Order</h3>
					<button
						type="button"
						onClick={closeModal}
						className="btn btn-sm btn-circle btn-ghost">
						✕
					</button>
				</div>

				{!addOnStep ? (
					// Main Order Creation Form
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<SubscriberSelection
							register={register}
							errors={errors}
							activeSubscribers={activeSubscribers}
							onSubscriberChange={handleSubscriberChange}
							watchSubscriberId={watchSubscriberId}
						/>

						{/* Plan Selection - Show when subscriber is selected */}
						{watchSubscriberId && availablePlans.length > 0 && (
							<PlanSelection
								selectedSubscriberPlan={selectedSubscriberPlan}
								availablePlans={availablePlans}
								onPlanSelect={handlePlanSelect}
								selectedDay={selectedDay}
							/>
						)}

						{/* Show warning if no active plans */}
						{watchSubscriberId && availablePlans.length === 0 && (
							<div className="alert alert-error">
								<div>
									<h4 className="font-semibold">No Active Plans</h4>
									<p className="text-sm">
										This subscriber doesn't have any active subscription plans.
									</p>
								</div>
							</div>
						)}

						{/* Show selected plan details */}
						{selectedSubscriberPlan && (
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

						<DaySelection
							selectedDay={selectedDay}
							isAfter10AM={isAfter10AM}
							onDayChange={handleDayChange}
							watchSubscriberPlanId={watchSubscriberPlanId}
							selectedSubscriberPlan={selectedSubscriberPlan}
							hasMultipleActivePlans={hasMultipleActivePlans?.()}
							todayMenuItems={todayMenuItems}
							tomorrowMenuItems={tomorrowMenuItems}
						/>

						<MenuSelection
							selectedDay={selectedDay}
							todayMenuItems={todayMenuItems}
							tomorrowMenuItems={tomorrowMenuItems}
							selectedMenuItems={selectedMenuItems}
							usedSelections={usedSelections}
							availableSelections={availableSelections}
							onMenuItemToggle={toggleMenuItemSelectionSmart}
							onQuantityChange={updateMenuItemQuantity}
							errors={errors}
						/>

						<OrderOptions
							register={register}
							selectedDay={selectedDay}
							errors={errors}
						/>

						{/* Show "Add Add-Ons" button after menu selection */}
						{selectedMenuItems.length > 0 && (
							<div className="text-center border-t pt-4">
								<button
									type="button"
									onClick={() => setAddOnStep(true)}
									className="btn btn-outline btn-lg">
									Add Extra Items +
								</button>
								<p className="text-sm text-gray-600 mt-2">
									Optional: Add drinks, extras, or additional menu items
								</p>
							</div>
						)}

						<div className="modal-action">
							<button
								type="button"
								onClick={closeModal}
								className="btn btn-ghost">
								Cancel
							</button>
							<button
								type="submit"
								disabled={
									!isValidSelection() || isSubmitting || !selectedSubscriberPlan
								}
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
				) : (
					// Add-Ons Step - Updated with paid status props
					<AddOnsStep
						availableAddOnItems={getAvailableAddOnItems()}
						selectedAddOns={selectedAddOns}
						onAddOnQuantityChange={updateAddOnQuantity}
						onAllAddOnsPaidChange={handleAllAddOnsPaidChange}
						allAddOnsPaid={allAddOnsPaid}
						onBack={() => setAddOnStep(false)}
						onSubmit={handleSubmit(onSubmit)}
						isSubmitting={isSubmitting}
					/>
				)}
			</div>

			<div className="modal-backdrop">
				<button type="button" onClick={closeModal}>
					close
				</button>
			</div>
		</dialog>
	);
};
