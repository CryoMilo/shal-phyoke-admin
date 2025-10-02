// components/SubscriberOrders/CreateOrderModal.js
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubscriberSelection } from "./SubscriberSelection";
import { PlanSelection } from "./PlanSelection";
import { DaySelection } from "./DaySelection";
import { MenuSelection } from "./MenuSelection";
import { OrderOptions } from "./OrderOptions";
import { subscriberOrderSchema } from "../../../validations/subscriberOrderSchema";
import { useOrderCreationStore } from "../../../stores/subscriberOrderStore";
import useSubscribersStore from "../../../stores/useSubscriberStore";

export const CreateOrderModal = ({ showModal, onClose, onOrderCreated }) => {
	const {
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
		isValidSelection,
		resetSelections,
		createOrder,
		hasMultipleActivePlans,
		getAvailablePlans,
		todayMenuItems,
		tomorrowMenuItems,
	} = useOrderCreationStore();

	const { subscribers } = useSubscribersStore();

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

	const watchSubscriberId = watch("subscriber_id");
	const watchSubscriberPlanId = watch("subscriber_plan_id");
	const activeSubscribers = subscribers.filter((sub) => sub.is_active);
	const availablePlans = getAvailablePlans();

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

	const onSubmit = async () => {
		if (!isValidSelection()) {
			alert("Please complete your selection");
			return;
		}

		try {
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
			<div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-xl font-bold">Create Subscriber Order</h3>
					<button
						onClick={closeModal}
						className="btn btn-sm btn-circle btn-ghost">
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<SubscriberSelection
						register={register}
						errors={errors}
						activeSubscribers={activeSubscribers}
						onSubscriberChange={handleSubscriberChange}
						watchSubscriberId={watchSubscriberId}
					/>

					<PlanSelection
						register={register}
						errors={errors}
						hasMultipleActivePlans={hasMultipleActivePlans()}
						availablePlans={availablePlans}
						selectedSubscriberPlan={selectedSubscriberPlan}
						availableSelections={availableSelections}
						onPlanChange={handlePlanChange}
						watchSubscriberId={watchSubscriberId}
						watchSubscriberPlanId={watchSubscriberPlanId}
					/>

					<DaySelection
						selectedDay={selectedDay}
						isAfter10AM={isAfter10AM}
						onDayChange={handleDayChange}
						watchSubscriberPlanId={watchSubscriberPlanId}
						selectedSubscriberPlan={selectedSubscriberPlan}
						hasMultipleActivePlans={hasMultipleActivePlans()}
					/>

					<MenuSelection
						selectedDay={selectedDay}
						todayMenuItems={todayMenuItems}
						tomorrowMenuItems={tomorrowMenuItems}
						selectedMenuItems={selectedMenuItems}
						usedSelections={usedSelections}
						availableSelections={availableSelections}
						onMenuItemToggle={toggleMenuItemSelectionSmart}
						errors={errors}
					/>

					<OrderOptions register={register} selectedDay={selectedDay} />

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

			<form method="dialog" className="modal-backdrop">
				<button onClick={closeModal}>close</button>
			</form>
		</dialog>
	);
};
