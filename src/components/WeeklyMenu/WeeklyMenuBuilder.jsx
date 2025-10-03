import { useEffect, useState } from "react";
import {
	useMenuItemsStore,
	useWeeklyMenuStore,
} from "../../stores/weeklyMenuStore";
import { supabase } from "../../services/supabase";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

export const WeeklyMenuBuilder = ({ weeklyMenu, onBack }) => {
	const { menuItems, fetchMenuItems } = useMenuItemsStore();
	const { fetchWeeklyMenuWithItems } = useWeeklyMenuStore();

	const days = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const baseCategories = [
		"Beef",
		"Chicken",
		"Pork",
		"Seafood",
		"Salad",
		"Vege",
		"Special",
		"Soup",
	];

	// build empty structure for each day -> each category
	const emptyDay = Object.fromEntries(baseCategories.map((c) => [c, []]));
	const initialItems = Object.fromEntries(
		days.map((d) => [d, { ...emptyDay }])
	);

	const [selectedDay, setSelectedDay] = useState("Monday");
	const [selectedCategory, setSelectedCategory] = useState("");
	const [loading, setLoading] = useState(false);

	const [weeklyMenuData, setWeeklyMenuData] = useState({
		week_from: "",
		week_to: "",
		items: initialItems,
	});

	// --- Load Menu Items & Existing Data
	useEffect(() => {
		fetchMenuItems();
		if (weeklyMenu) {
			setWeeklyMenuData((prev) => ({
				...prev,
				week_from: weeklyMenu.week_from,
				week_to: weeklyMenu.week_to,
			}));

			fetchWeeklyMenuWithItems(weeklyMenu.id).then((result) => {
				if (result.data) {
					const newItems = JSON.parse(JSON.stringify(initialItems));
					result.data.weekly_menu_items.forEach((w) => {
						const cat = w.menu_items.category;
						if (newItems[w.weekday] && newItems[w.weekday][cat]) {
							newItems[w.weekday][cat].push(w.menu_items);
						}
					});
					setWeeklyMenuData((prev) => ({ ...prev, items: newItems }));
				}
			});
		}
	}, [weeklyMenu]);

	// --- Filter left list
	const filteredMenuItems = menuItems.filter(
		(item) => selectedCategory === "" || item.category === selectedCategory
	);

	// --- Add & Remove
	const addItemToDay = (item) => {
		const cat = item.category;
		setWeeklyMenuData((prev) => ({
			...prev,
			items: {
				...prev.items,
				[selectedDay]: {
					...prev.items[selectedDay],
					[cat]: [...prev.items[selectedDay][cat], item],
				},
			},
		}));
	};

	const removeItemFromDay = (itemId, cat) => {
		setWeeklyMenuData((prev) => ({
			...prev,
			items: {
				...prev.items,
				[selectedDay]: {
					...prev.items[selectedDay],
					[cat]: prev.items[selectedDay][cat].filter((i) => i.id !== itemId),
				},
			},
		}));
	};

	// --- Save
	const handleSave = async () => {
		if (!weeklyMenuData.week_from || !weeklyMenuData.week_to) {
			alert("Please set week from and to dates");
			return;
		}

		setLoading(true);
		try {
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

			if (weeklyMenu) {
				await supabase
					.from("weekly_menu_items")
					.delete()
					.eq("weekly_menu_id", weekMenu.id);
			}

			const itemsToInsert = [];
			Object.entries(weeklyMenuData.items).forEach(([day, cats]) => {
				// eslint-disable-next-line no-unused-vars
				Object.entries(cats).forEach(([cat, items]) => {
					items.forEach((item) => {
						itemsToInsert.push({
							weekly_menu_id: weekMenu.id,
							weekday: day,
							menu_item_id: item.id,
						});
					});
				});
			});

			if (itemsToInsert.length) {
				const { error: itemsError } = await supabase
					.from("weekly_menu_items")
					.insert(itemsToInsert);
				if (itemsError) throw itemsError;
			}

			alert("Weekly menu saved successfully!");
			onBack();
		} catch (err) {
			console.error("Error saving weekly menu:", err);
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

			{/* Date Inputs */}
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
				{/* Left – Available Items */}
				<div className="bg-base-200 rounded-lg p-6">
					<div className="flex justify-between items-center mb-4">
						<div className="flex items-center gap-4">
							<div className="flex gap-1">
								<ChevronLeft className="w-4 h-4" />
								<ChevronRight className="w-4 h-4" />
							</div>
							<h2 className="text-xl font-bold">{selectedDay} Items</h2>
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

					{/* Filtered List */}
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

				{/* Right – Category Slots */}
				<div className="bg-base-100 rounded-lg border-2 border-gray-300 p-6">
					<h3 className="text-lg font-bold mb-4">{selectedDay} Slots</h3>
					{baseCategories.map((cat) => (
						<div key={cat} className="mb-4 border-b pb-2">
							<div
								className={`flex justify-between items-center cursor-pointer p-1 rounded
                  ${selectedCategory === cat ? "bg-primary/10" : ""}`}
								onClick={() => setSelectedCategory(cat)}>
								<h4 className="font-bold">{cat}</h4>
								<span className="badge badge-outline">
									{weeklyMenuData.items[selectedDay][cat].length}
								</span>
							</div>

							<div className="mt-2 space-y-1">
								{weeklyMenuData.items[selectedDay][cat].map((item) => (
									<div
										key={item.id}
										className="flex justify-between p-2 rounded">
										<span>{item.name_burmese}</span>
										<button
											className="btn btn-xs btn-error btn-outline"
											onClick={() => removeItemFromDay(item.id, cat)}>
											<X className="w-4 h-4" />
										</button>
									</div>
								))}
								{weeklyMenuData.items[selectedDay][cat].length === 0 && (
									<div className="text-xs text-gray-400">No {cat} yet</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
