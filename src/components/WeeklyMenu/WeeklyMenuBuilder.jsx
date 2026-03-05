// components/WeeklyMenu/WeeklyMenuBuilder.jsx
import { useEffect, useState } from "react";
import {
	useMenuItemsStore,
	useWeeklyMenuStore,
} from "../../stores/weeklyMenuStore";
import { supabase } from "../../services/supabase";
import { ChevronLeft, Plus, Save, X } from "lucide-react";
import { PageHeader } from "../common/PageHeader";

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
		"Sunday",
	];

	// Define regular categories to exclude
	const REGULAR_CATEGORIES = ["Regular", "Regular_Drinks", "Regular_Extras"];

	// Get unique rotating categories from available menu items
	const [availableCategories, setAvailableCategories] = useState([]);
	const [rotatingMenuItems, setRotatingMenuItems] = useState([]);

	useEffect(() => {
		// Fetch menu items when component mounts
		fetchMenuItems();
	}, [fetchMenuItems]);

	// Filter out regular categories and extract unique rotating categories
	useEffect(() => {
		if (menuItems.length > 0) {
			// Filter out regular menu items (only show rotating items)
			const filteredItems = menuItems.filter((item) => !item.is_regular);

			setRotatingMenuItems(filteredItems);

			// Get unique rotating categories
			const categories = [
				...new Set(filteredItems.map((item) => item.category)),
			];
			setAvailableCategories(categories.sort());
		}
	}, [menuItems]);

	// Build empty structure for each day -> each category
	const buildEmptyDayStructure = () => {
		const structure = {};
		availableCategories.forEach((category) => {
			structure[category] = [];
		});
		return structure;
	};

	const buildInitialItems = () => {
		const initial = {};
		days.forEach((day) => {
			initial[day] = buildEmptyDayStructure();
		});
		return initial;
	};

	const [selectedDay, setSelectedDay] = useState("Monday");
	const [selectedCategory, setSelectedCategory] = useState("");
	const [loading, setLoading] = useState(false);

	const [weeklyMenuData, setWeeklyMenuData] = useState({
		week_from: "",
		week_to: "",
		items: buildInitialItems(),
	});

	// --- Load Existing Data
	useEffect(() => {
		if (weeklyMenu) {
			setWeeklyMenuData((prev) => ({
				...prev,
				week_from: weeklyMenu.week_from,
				week_to: weeklyMenu.week_to,
			}));

			fetchWeeklyMenuWithItems(weeklyMenu.id).then((result) => {
				if (result.data) {
					// Create new structure based on current categories
					const newItems = buildInitialItems();

					result.data.weekly_menu_items.forEach((w) => {
						if (w.menu_items && w.menu_items.category) {
							const cat = w.menu_items.category;
							const day = w.weekday;

							// Only add if it's a rotating category (not regular)
							if (
								!REGULAR_CATEGORIES.includes(cat) &&
								newItems[day] &&
								newItems[day][cat]
							) {
								newItems[day][cat].push(w.menu_items);
							}
						}
					});

					setWeeklyMenuData((prev) => ({ ...prev, items: newItems }));
				}
			});
		}
	}, [weeklyMenu, availableCategories]);

	// --- Filter left list (only rotating items) based on selected category
	const filteredMenuItems = rotatingMenuItems.filter(
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
					[cat]: [...(prev.items[selectedDay][cat] || []), item],
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
					[cat]: (prev.items[selectedDay][cat] || []).filter(
						(i) => i.id !== itemId
					),
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
			// Create or update weekly menu
			const menuData = {
				week_from: weeklyMenuData.week_from,
				week_to: weeklyMenuData.week_to,
				status: "Draft",
			};

			if (weeklyMenu?.id) {
				menuData.id = weeklyMenu.id;
			}

			const { data: weekMenu, error: weekError } = await supabase
				.from("weekly_menu")
				.upsert(menuData)
				.select()
				.single();

			if (weekError) throw weekError;

			// Delete existing items if editing
			if (weeklyMenu?.id) {
				await supabase
					.from("weekly_menu_items")
					.delete()
					.eq("weekly_menu_id", weekMenu.id);
			}

			// Insert new items (only rotating items)
			const itemsToInsert = [];
			Object.entries(weeklyMenuData.items).forEach(([day, cats]) => {
				// eslint-disable-next-line no-unused-vars
				Object.entries(cats).forEach(([cat, items]) => {
					items.forEach((item) => {
						// Double-check we're not saving regular items
						if (!REGULAR_CATEGORIES.includes(item.category)) {
							itemsToInsert.push({
								weekly_menu_id: weekMenu.id,
								weekday: day,
								menu_item_id: item.id,
							});
						}
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
		} catch (err) {
			console.error("Error saving weekly menu:", err);
			alert("Error saving weekly menu: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	// Clear category filter
	const clearCategoryFilter = () => {
		setSelectedCategory("");
	};

	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<PageHeader
				title="Weekly Menu Builder"
				description="Build your rotating weekly menu"
				buttons={[
					{
						type: "button",
						label: "Back",
						shortlabel: "Back",
						icon: ChevronLeft,
						onClick: onBack,
						variant: "ghost",
					},
					{
						type: "button",
						label: loading ? "Saving..." : "Save Weekly Menu",
						shortlabel: loading ? "Saving..." : "Save",
						icon: loading ? null : Save,
						onClick: handleSave,
						variant: "success",
						disabled: loading,
					},
				]}
			/>

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

			{/* Day Selector */}
			<div className="flex gap-2 mb-6 overflow-x-auto">
				{days.map((day) => (
					<button
						key={day}
						className={`btn btn-sm ${
							selectedDay === day ? "btn-primary" : "btn-outline"
						}`}
						onClick={() => setSelectedDay(day)}>
						{day}
					</button>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left – Available Rotating Items */}
				<div className="bg-base-200 rounded-lg p-6">
					<div className="flex justify-between items-center mb-4">
						<div className="flex items-center gap-4">
							<h2 className="text-xl font-bold">
								{selectedCategory
									? `${selectedCategory} Items`
									: "All Rotating Items"}
							</h2>
							<span className="badge badge-outline">
								{filteredMenuItems.length} items
							</span>
						</div>
						{selectedCategory && (
							<button
								className="btn btn-xs btn-ghost"
								onClick={clearCategoryFilter}>
								Show All
							</button>
						)}
					</div>

					{/* Filtered List */}
					<div className="space-y-2 max-h-96 overflow-y-auto">
						{filteredMenuItems.length > 0 ? (
							filteredMenuItems.map((item) => (
								<div
									key={item.id}
									className="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:bg-base-300 transition-colors border border-base-300">
									<div className="flex-1">
										<div className="font-semibold">{item.name_burmese}</div>
										{item.name_english && (
											<div className="text-sm text-gray-600">
												{item.name_english}
											</div>
										)}
										<div className="flex items-center gap-3 mt-1">
											<span className="badge badge-neutral badge-sm">
												{item.category}
											</span>
											<span className="text-sm font-medium text-primary">
												฿{item.price}
											</span>
										</div>
									</div>
									<button
										className="btn btn-sm btn-primary ml-2"
										onClick={() => addItemToDay(item)}
										title={`Add to ${selectedDay}`}>
										<Plus className="w-4 h-4" />
									</button>
								</div>
							))
						) : (
							<div className="text-center py-8 text-gray-500 bg-base-100 rounded-lg">
								{selectedCategory ? (
									<>
										<p className="mb-2">No {selectedCategory} items found.</p>
										<button
											className="btn btn-xs btn-outline mt-2"
											onClick={clearCategoryFilter}>
											Show all items
										</button>
									</>
								) : (
									<>
										<p className="mb-2">No rotating menu items found.</p>
										<p className="text-sm">
											Make sure you have rotating menu items created and active.
										</p>
									</>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Right – Selected Day's Items (with clickable category headers) */}
				<div className="bg-base-100 rounded-lg border-2 border-gray-300 p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-xl font-bold">{selectedDay} Menu</h3>
						<span className="badge badge-primary">
							{Object.values(weeklyMenuData.items[selectedDay] || {}).reduce(
								(total, cat) => total + cat.length,
								0
							)}{" "}
							items
						</span>
					</div>

					{availableCategories.length > 0 ? (
						<div className="space-y-4">
							{availableCategories.map((cat) => {
								const itemsInCategory =
									weeklyMenuData.items[selectedDay]?.[cat] || [];
								return (
									<div
										key={cat}
										className="border border-base-300 rounded-lg p-3">
										{/* Clickable Category Header */}
										<div
											className={`flex justify-between items-center mb-2 cursor-pointer p-2 rounded ${
												selectedCategory === cat
													? "bg-primary/10"
													: "hover:bg-base-200"
											}`}
											onClick={() => setSelectedCategory(cat)}>
											<h4 className="font-bold text-lg">{cat}</h4>
											<div className="flex items-center gap-2">
												<span className="badge badge-outline">
													{itemsInCategory.length} items
												</span>
											</div>
										</div>

										{/* Items in this category */}
										<div className="space-y-2">
											{itemsInCategory.length > 0 ? (
												itemsInCategory.map((item) => (
													<div
														key={item.id}
														className="flex justify-between items-center p-2 bg-base-200 rounded">
														<div className="flex-1">
															<span className="font-medium">
																{item.name_burmese}
															</span>
															{item.name_english && (
																<div className="text-xs text-gray-600">
																	{item.name_english}
																</div>
															)}
														</div>
														<button
															className="btn btn-xs btn-error btn-outline ml-2"
															onClick={() => removeItemFromDay(item.id, cat)}
															title="Remove">
															<X className="w-3 h-3" />
														</button>
													</div>
												))
											) : (
												<div className="text-center py-2 text-sm text-gray-400 italic bg-base-200 rounded">
													No {cat} items added
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="text-center py-8 text-gray-500">
							<p className="mb-2">No rotating categories available.</p>
							<p className="text-sm">Add some rotating menu items first.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
