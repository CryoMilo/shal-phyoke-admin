export const calculateAddOnTotal = (addOnsDetails) => {
	if (!addOnsDetails || !Array.isArray(addOnsDetails)) return 0;

	return addOnsDetails.reduce((total, addOn) => {
		const price = addOn.menu_item?.price || 0;
		const quantity = addOn.quantity || 1;
		return total + price * quantity;
	}, 0);
};
