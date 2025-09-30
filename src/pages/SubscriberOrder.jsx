import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { subscriberOrderSchema } from "../validations/subscriberOrderSchema";
import { useOrderCreationStore } from "../stores/subscriberOrderStore";
import useSubscribersStore from "../stores/useSubscriberStore";
import { SubscriberOrderCard } from "../components/SubscriberOrders/SubscriberOrderCard";
import { supabase } from "../services/supabase";

export const SubscriberOrder = () => {
	const {
		todayMenuItems,
		tomorrowMenuItems,
		selectedSubscriber,
		selectedDay,
		selectedMenuItems,
		availableSelections,
		usedSelections,
		isAfter10AM,
		setSelectedSubscriber,
		setSelectedDay,
		toggleMenuItemSelection,
		fetchAvailableMenuItems,
		checkTimeRestriction,
		isValidSelection,
		resetSelections,
		orders,
		loadingOrders,
		fetchSubscriberOrders,
	} = useOrderCreationStore();

	const { activeSubscribers, fetchActiveSubscribers } = useSubscribersStore();

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
			day_selection: "",
			menu_selections: [],
			eat_in: false,
			note: "",
		},
	});

	// Watch form values for real-time validation
	const watchSubscriberId = watch("subscriber_id");
	// const watchDaySelection = watch("day_selection");

	// ---------- INIT ----------
	useEffect(() => {
		fetchAvailableMenuItems();
		checkTimeRestriction();
		fetchActiveSubscribers();
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
		setSelectedSubscriber(subscriber);
		setValue("subscriber_id", subscriberId);
		setValue("day_selection", "");
		setValue("menu_selections", []);
	};

	const handleDayChange = (day) => {
		setSelectedDay(day);
		setValue("day_selection", day);
		setValue("menu_selections", []);
	};

	const toggleMenuItemSelectionSmart = (menuItem) => {
		const plan = selectedSubscriber?.subscription_plans;
		if (!plan) return;

		const isSelected = selectedMenuItems.some((s) => s.id === menuItem.id);
		if (isSelected) {
			const type = selectedMenuItems.find((s) => s.id === menuItem.id)?.type;
			toggleMenuItemSelection(menuItem, type);
		} else {
			if (usedSelections.main_dish < availableSelections.main_dish) {
				toggleMenuItemSelection(menuItem, "main_dish");
			} else if (usedSelections.side_dish < availableSelections.side_dish) {
				toggleMenuItemSelection(menuItem, "side_dish");
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

		if (!selectedSubscriber || !selectedDay || selectedMenuItems.length === 0) {
			alert("Invalid order data");
			return;
		}

		const completeOrderData = {
			subscriber_id: selectedSubscriber.id,
			menu_items: selectedMenuItems.map((i) => i.id),
			order_date:
				selectedDay === "today"
					? new Date().toISOString().split("T")[0]
					: new Date(Date.now() + 86400000).toISOString().split("T")[0],
			point_use: 1,
			status: "Cooking",
			eat_in: data.eat_in,
			note: data.note || null,
		};

		try {
			const { error } = await supabase
				.from("subscription_orders")
				.insert([completeOrderData]);

			if (error) throw error;

			await fetchSubscriberOrders();
			resetSelections();
			reset();
			setShowCreateModal(false);
			alert("Order created successfully!");
		} catch (err) {
			console.error("Error creating order:", err);
			alert("Error creating order");
		}
	};

	const closeModal = () => {
		setShowCreateModal(false);
		reset();
		resetSelections();
	};

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

			{/* Create Modal - DaisyUI Style */}
			<dialog
				className={`modal ${showCreateModal ? "modal-open" : ""}`}
				id="create-order-modal">
				<div className="modal-box max-w-2xl">
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
										{s.name} – {s.subscription_plans?.plan_name}
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
						{/* Day Selection */}
						{watchSubscriberId && (
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
												}`}>
												<div className="flex justify-between items-center">
													<div className="flex-1">
														<p className="font-semibold">
															{item.menu_items.name_burmese}
														</p>
														<p className="text-sm text-base-content/70">
															{item.menu_items.name_english}
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
