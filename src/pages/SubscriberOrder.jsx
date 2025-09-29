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
		isAfter6PM,
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
		formState: { errors },
		setValue,
		reset,
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

	// ---------- INIT ----------
	useEffect(() => {
		fetchAvailableMenuItems();
		checkTimeRestriction();
		fetchActiveSubscribers();
		fetchSubscriberOrders(); // ⬅️ pull existing orders
		const interval = setInterval(checkTimeRestriction, 60000);
		return () => clearInterval(interval);
	}, []);

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

	/**
	 * Smart toggler:
	 *  - If clicked item is already selected -> deselect.
	 *  - Else assign next available tag: main_dish first until quota filled,
	 *    then side_dish if allowed.
	 */
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
			{showCreateModal && (
				<div className="modal modal-open">
					<div className="modal-box w-full max-w-md bg-black text-white rounded-2xl p-6 border border-gray-700">
						<h3 className="text-xl font-bold text-center mb-6">
							Create Subscriber Order
						</h3>

						{/* Subscriber Dropdown */}
						<div className="mb-4">
							<select
								{...register("subscriber_id")}
								className="w-full bg-transparent border border-gray-500 rounded-lg p-3"
								onChange={(e) => handleSubscriberChange(e.target.value)}>
								<option value="">Choose Subscriber</option>
								{activeSubscribers.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name} – {s.subscription_plans?.plan_name}
									</option>
								))}
							</select>
							{errors.subscriber_id && (
								<p className="text-red-400 text-sm mt-1">
									{errors.subscriber_id.message}
								</p>
							)}
						</div>

						{/* Day Toggle */}
						<div className="flex justify-center gap-4 mb-6">
							<button
								type="button"
								className={`px-4 py-2 rounded-lg border ${
									selectedDay === "today"
										? "bg-white text-black"
										: "border-gray-500"
								}`}
								onClick={() => !isAfter6PM && handleDayChange("today")}>
								Today
							</button>
							<button
								type="button"
								className={`px-4 py-2 rounded-lg border ${
									selectedDay === "tomorrow"
										? "bg-white text-black"
										: "border-gray-500"
								}`}
								onClick={() => handleDayChange("tomorrow")}>
								Tomorrow
							</button>
						</div>

						{/* Menu List */}
						{selectedDay && (
							<div className="space-y-3 mb-6">
								{(selectedDay === "today"
									? todayMenuItems
									: tomorrowMenuItems
								).map((item) => {
									const chosen = selectedMenuItems.find(
										(sel) => sel.id === item.menu_items.id
									);
									const border = chosen
										? chosen.type === "main_dish"
											? "border-red-400"
											: "border-blue-400"
										: "border-gray-600";
									const tagText = chosen
										? chosen.type === "main_dish"
											? "Main"
											: "Side"
										: "";

									return (
										<div
											key={item.id}
											onClick={() =>
												toggleMenuItemSelectionSmart(item.menu_items)
											}
											className={`border-2 rounded-xl p-4 flex justify-between items-center cursor-pointer ${border}`}>
											<div>
												<p className="font-semibold">
													{item.menu_items.name_burmese}
												</p>
												<p className="text-sm text-gray-400">
													{item.menu_items.name_english}
												</p>
											</div>
											{tagText && (
												<span
													className={`text-xs px-2 py-1 rounded-full border ${
														tagText === "Main"
															? "border-red-400 text-red-300"
															: "border-blue-400 text-blue-300"
													}`}>
													{tagText}
												</span>
											)}
										</div>
									);
								})}
								{errors.menu_selections && (
									<p className="text-red-400 text-sm">
										{errors.menu_selections.message}
									</p>
								)}
							</div>
						)}

						{/* Delivery / Dine-In */}
						{selectedDay && (
							<div className="flex items-center gap-3 mb-4">
								<label className="flex items-center gap-2 cursor-pointer">
									<input type="checkbox" {...register("eat_in")} />
									Dine-In (uncheck = Delivery)
								</label>
							</div>
						)}

						{/* Notes */}
						{selectedDay && (
							<textarea
								{...register("note")}
								className="w-full bg-transparent border border-gray-500 rounded-lg p-3 mb-6"
								rows={3}
								placeholder="Notes"
							/>
						)}

						<button
							onClick={handleSubmit(onSubmit)}
							disabled={!isValidSelection()}
							className="w-full py-3 rounded-lg bg-white text-black font-semibold disabled:opacity-40">
							Submit
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
