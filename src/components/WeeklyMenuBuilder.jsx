import { useEffect, useState } from "react";
import {
	useMenuItemsStore,
	useWeeklyMenuStore,
} from "../stores/weeklyMenuStore";
import { supabase } from "../services/supabase";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

export const WeeklyMenuBuilder = ({ weeklyMenu, onBack }) => {
	const { menuItems, fetchMenuItems } = useMenuItemsStore();
	const { createWeeklyMenu, fetchWeeklyMenuWithItems } = useWeeklyMenuStore();

	const [selectedDay, setSelectedDay] = useState("Monday");
	const [selectedCategory, setSelectedCategory] = useState("");
	const [weeklyMenuData, setWeeklyMenuData] = useState({
		week_from: "",
		week_to: "",
		items: {
			Monday: [],
			Tuesday: [],
			Wednesday: [],
			Thursday: [],
			Friday: [],
			Saturday: [],
		},
	});
	const [loading, setLoading] = useState(false);

	const days = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const categories = [
		"All",
		"Chicken",
		"Pork",
		"Beef",
		"Vegetarian",
		"Salad",
		"Seafood",
		"Special",
	];

	useEffect(() => {
		fetchMenuItems();

		// Load existing weekly menu data if editing
		if (weeklyMenu) {
			setWeeklyMenuData((prev) => ({
				...prev,
				week_from: weeklyMenu.week_from,
				week_to: weeklyMenu.week_to,
			}));

			fetchWeeklyMenuWithItems(weeklyMenu.id).then((result) => {
				if (result.data) {
					const itemsByDay = {};
					days.forEach((day) => {
						itemsByDay[day] = result.data.weekly_menu_items
							.filter((item) => item.weekday === day)
							.map((item) => item.menu_items);
					});

					setWeeklyMenuData((prev) => ({
						...prev,
						items: itemsByDay,
					}));
				}
			});
		}
	}, [weeklyMenu]);

	const filteredMenuItems = menuItems.filter(
		(item) =>
			selectedCategory === "" ||
			selectedCategory === "All" ||
			item.category === selectedCategory
	);

	const addItemToDay = (item) => {
		setWeeklyMenuData((prev) => ({
			...prev,
			items: {
				...prev.items,
				[selectedDay]: [...prev.items[selectedDay], item],
			},
		}));
	};

	const removeItemFromDay = (itemId) => {
		setWeeklyMenuData((prev) => ({
			...prev,
			items: {
				...prev.items,
				[selectedDay]: prev.items[selectedDay].filter(
					(item) => item.id !== itemId
				),
			},
		}));
	};

	const handleSave = async () => {
		if (!weeklyMenuData.week_from || !weeklyMenuData.week_to) {
			alert("Please set week from and to dates");
			return;
		}

		setLoading(true);
		try {
			// Create or update weekly menu
			const { data: weekMenu, error: weekError } = await supabase
				.from("weekly_menu")
				.upsert({
					id: weeklyMenu?.id,
					week_from: weeklyMenuData.week_from,
					week_to: weeklyMenuData.week_to,
				})
				.select()
				.single();

			if (weekError) throw weekError;

			// Delete existing items if editing
			if (weeklyMenu) {
				await supabase
					.from("weekly_menu_items")
					.delete()
					.eq("weekly_menu_id", weekMenu.id);
			}

			// Insert new items
			const itemsToInsert = [];
			Object.entries(weeklyMenuData.items).forEach(([day, items]) => {
				items.forEach((item) => {
					itemsToInsert.push({
						weekly_menu_id: weekMenu.id,
						weekday: day,
						menu_item_id: item.id,
					});
				});
			});

			if (itemsToInsert.length > 0) {
				const { error: itemsError } = await supabase
					.from("weekly_menu_items")
					.insert(itemsToInsert);

				if (itemsError) throw itemsError;
			}

			alert("Weekly menu saved successfully!");
			onBack();
		} catch (error) {
			console.error("Error saving weekly menu:", error);
			alert("Error saving weekly menu");
		}
		setLoading(false);
	};

	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<button className="btn btn-ghost" onClick={onBack}>
						<ChevronLeft className="w-4 h-4" />
						Back
					</button>
					<div>
						<h1 className="text-3xl font-bold">Menu Builder</h1>
						<p className="text-gray-600">{selectedDay} Menu</p>
					</div>
				</div>
				<button
					className="btn btn-success"
					onClick={handleSave}
					disabled={loading}>
					{loading ? "Saving..." : "Save Menu"}
				</button>
			</div>

			{/* Week Date Inputs */}
			<div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
				<div className="form-control">
					<label className="label">
						<span className="label-text">Week From</span>
					</label>
					<input
						type="date"
						className="input input-bordered"
						value={weeklyMenuData.week_from}
						onChange={(e) =>
							setWeeklyMenuData((prev) => ({
								...prev,
								week_from: e.target.value,
							}))
						}
					/>
				</div>
				<div className="form-control">
					<label className="label">
						<span className="label-text">Week To</span>
					</label>
					<input
						type="date"
						className="input input-bordered"
						value={weeklyMenuData.week_to}
						onChange={(e) =>
							setWeeklyMenuData((prev) => ({
								...prev,
								week_to: e.target.value,
							}))
						}
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left Side - Menu Selection */}
				<div className="bg-base-200 rounded-lg p-6">
					<div className="flex justify-between items-center mb-4">
						<div className="flex items-center gap-4">
							<div className="flex gap-1">
								<ChevronLeft className="w-4 h-4" />
								<ChevronRight className="w-4 h-4" />
							</div>
							<h2 className="text-xl font-bold">{selectedDay} Menu</h2>
						</div>
					</div>

					{/* Day Selector */}
					<div className="flex gap-2 mb-4 overflow-x-auto">
						{days.map((day) => (
							<button
								key={day}
								className={`btn btn-sm ${
									selectedDay === day ? "btn-primary" : "btn-outline"
								}`}
								onClick={() => setSelectedDay(day)}>
								{day.slice(0, 3)}
							</button>
						))}
					</div>

					{/* Category Filter */}
					<div className="mb-4">
						<div className="flex items-center gap-2 mb-2">
							<span className="text-sm">Showing results of</span>
							<select
								className="select select-bordered select-sm"
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}>
								{categories.map((category) => (
									<option
										key={category}
										value={category === "All" ? "" : category}>
										{category}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Available Items */}
					<div className="space-y-2 max-h-96 overflow-y-auto">
						{filteredMenuItems.map((item) => (
							<div
								key={item.id}
								className="flex items-center justify-between p-2 bg-base-100 rounded">
								<div className="flex-1">
									<div className="font-medium">{item.name_burmese}</div>
									<div className="text-sm text-gray-600">
										{item.name_english}
									</div>
									<div className="text-xs text-gray-500">
										{item.category} • ฿{item.price}
									</div>
								</div>
								<button
									className="btn btn-sm btn-primary"
									onClick={() => addItemToDay(item)}>
									<Plus className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
				</div>

				{/* Right Side - Selected Items */}
				<div className="bg-base-100 rounded-lg border-2 border-gray-300 p-6">
					<h3 className="text-lg font-bold mb-4">
						{selectedDay} Selected Items
					</h3>
					<div className="space-y-2 min-h-[400px]">
						{weeklyMenuData.items[selectedDay]?.map((item) => (
							<div
								key={item.id}
								className="flex items-center justify-between p-2 bg-gray-50 rounded">
								<div className="flex-1">
									<div className="font-medium">{item.name_burmese}</div>
									<div className="text-sm text-gray-600">
										{item.name_english}
									</div>
									<div className="text-xs">
										<span className="badge badge-outline badge-sm mr-1">
											{item.category}
										</span>
										฿{item.price}
									</div>
								</div>
								<button
									className="btn btn-sm btn-error btn-outline"
									onClick={() => removeItemFromDay(item.id)}>
									<X className="w-4 h-4" />
								</button>
							</div>
						))}
						{weeklyMenuData.items[selectedDay]?.length === 0 && (
							<div className="text-center text-gray-500 py-8">
								No items selected for {selectedDay}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
