// components/SubscriberOrders/OrderOptions.js
export const OrderOptions = ({ register, selectedDay }) => {
	if (!selectedDay) return null;

	return (
		<>
			<div className="form-control">
				<label className="label cursor-pointer justify-start gap-3">
					<input type="checkbox" {...register("eat_in")} className="checkbox" />
					<span className="label-text">Dine-In (unchecked = Delivery)</span>
				</label>
			</div>

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
		</>
	);
};
