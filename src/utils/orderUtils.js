/**
 * Generates formatted plain text for order details to be copied to clipboard.
 * Including add-on prices (itemExtraPrices) in the individual item unit price and total calculations.
 */
export const generateOrderDetailsText = ({
	cart,
	customerInfo,
	orderType,
	tableNumber,
	itemNotes,
	itemExtraPrices,
	subtotal,
	discountAmount,
	deliveryFee,
	totalAmount,
	notes,
}) => {
	if (!cart || cart.length === 0) return "";

	let text = `📦 *ORDER DETAILS*\n`;
	text += `--------------------------\n`;

	if (customerInfo?.name) text += `👤 *Customer:* ${customerInfo.name}\n`;
	if (customerInfo?.phone) text += `📞 *Phone:* ${customerInfo.phone}\n`;
	if (customerInfo?.address) text += `📍 *Address:* ${customerInfo.address}\n`;

	text += `🍴 *Type:* ${orderType.toUpperCase()}\n`;
	if (tableNumber) text += `🪑 *Table:* ${tableNumber}\n`;
	text += `--------------------------\n\n`;

	cart.forEach((item, index) => {
		text += `${index + 1}. *${item.name_burmese}*\n`;
		if (item.name_english) text += `   (${item.name_english})\n`;

		const note = itemNotes?.[item.cart_id];
		if (note) text += `   📝 Note: ${note}_\n`;

		const extraPrice = itemExtraPrices?.[item.cart_id] || 0;
		const unitPrice = item.price + extraPrice;
		text += `   ${item.quantity} x ฿${unitPrice} = *฿${
			item.quantity * unitPrice
		}*\n\n`;
	});

	text += `--------------------------\n`;
	text += `Subtotal: ฿${subtotal.toFixed(2)}\n`;
	if (discountAmount > 0) text += `Discount: -฿${discountAmount.toFixed(2)}\n`;
	if (orderType === "delivery" && deliveryFee > 0)
		text += `Delivery Fee: +฿${deliveryFee.toFixed(2)}\n`;
	text += `--------------------------\n`;
	text += `💰 *TOTAL: ฿${totalAmount.toFixed(2)}*\n`;

	if (notes) {
		text += `\n📝 *General Notes:* ${notes}\n`;
	}

	return text;
};
