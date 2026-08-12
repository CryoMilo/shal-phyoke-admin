import React from "react";
import { isBaseItemAvailable } from "../../utils/menuAvailabilityUtils";
import { getSafeImageUrl } from "../../utils/imageUtils";

const MenuItemCard = ({ item, allMenuItems, onClick }) => {
	const masterItem =
		allMenuItems.find((m) => String(m.id) === String(item.id)) || item;
	const fullItem = {
		...item,
		available_extras: masterItem?.available_extras || [],
	};
	const isAvailable = isBaseItemAvailable(fullItem);
	const safeImageUrl = getSafeImageUrl(item.image_url);

	return (
		<div
			className={`bg-base-100 border rounded-lg p-3 relative overflow-hidden transition-all duration-100 ease-out ${
				!isAvailable
					? "grayscale opacity-50 cursor-not-allowed border-base-300"
					: "cursor-pointer hover:shadow-md border-base-300 active:scale-95 active:shadow-inner " +
					  (item.isCombo ? "border-primary/30 ring-1 ring-primary/10" : "")
			}`}
			onClick={() => isAvailable && onClick(fullItem)}>
			{!isAvailable && (
				<div className="absolute inset-0 bg-base-200/20 z-10 flex items-center justify-center">
					<span className="bg-error text-error-content text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg rotate-[-12deg]">
						Unavailable
					</span>
				</div>
			)}
			{item.isCombo && (
				<div className="absolute top-0 right-0 bg-primary text-primary-content text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg uppercase tracking-tighter">
					Combo
				</div>
			)}
			<img
				src={
					safeImageUrl ||
					"https://theme-assets.getbento.com/sensei/dbc3b64.sensei/assets/images/catering-item-placeholder-704x520.png"
				}
				alt={item.name_english}
				className="w-full h-20 object-cover rounded mb-2"
			/>
			<h3 className="font-semibold text-sm line-clamp-2">
				{item.name_burmese}
			</h3>
			{item.name_english && (
				<p className="text-xs text-base-content/70 truncate">
					{item.name_english}
				</p>
			)}
		</div>
	);
};

export default MenuItemCard;
