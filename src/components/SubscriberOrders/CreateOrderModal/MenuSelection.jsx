// components/SubscriberOrders/MenuSelection.js
export const MenuSelection = ({
	selectedDay,
	todayMenuItems,
	tomorrowMenuItems,
	selectedMenuItems,
	usedSelections,
	availableSelections,
	onMenuItemToggle,
	errors,
}) => {
	if (!selectedDay) return null;

	const menuItems =
		selectedDay === "today" ? todayMenuItems : tomorrowMenuItems;

	return (
		<div className="form-control">
			<label className="label">
				<span className="label-text">
					Select Menu Items ({usedSelections.main_dish}/
					{availableSelections.main_dish} Main, {usedSelections.side_dish}/
					{availableSelections.side_dish} Side)
				</span>
			</label>
			<div className="space-y-2 max-h-96 overflow-y-auto p-2 border rounded-lg">
				{menuItems.map((item) => {
					const chosen = selectedMenuItems.find(
						(sel) => sel.id === item.menu_items.id
					);
					const isMainDish = chosen?.type === "main_dish";
					const isSideDish = chosen?.type === "side_dish";

					return (
						<MenuItem
							key={item.id}
							item={item}
							chosen={chosen}
							isMainDish={isMainDish}
							isSideDish={isSideDish}
							usedSelections={usedSelections}
							availableSelections={availableSelections}
							onToggle={onMenuItemToggle}
						/>
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
	);
};

const MenuItem = ({
	item,
	chosen,
	isMainDish,
	isSideDish,
	usedSelections,
	availableSelections,
	onToggle,
}) => (
	<div
		onClick={() => onToggle(item.menu_items)}
		className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
			isMainDish
				? "border-primary bg-primary/10"
				: isSideDish
				? "border-secondary bg-secondary/10"
				: "border-base-300 hover:border-base-400"
		} ${
			!chosen && usedSelections.total >= availableSelections.total
				? "opacity-50 cursor-not-allowed"
				: ""
		}`}>
		<div className="flex justify-between items-center">
			<div className="flex-1">
				<p className="font-semibold">{item.menu_items.name_burmese}</p>
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
