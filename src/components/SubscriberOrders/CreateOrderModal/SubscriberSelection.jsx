// components/SubscriberOrders/SubscriberSelection.js
export const SubscriberSelection = ({
	register,
	errors,
	activeSubscribers,
	onSubscriberChange,
	watchSubscriberId,
}) => (
	<div className="form-control w-full">
		<label className="label">
			<span className="label-text">Select Subscriber</span>
		</label>
		<select
			{...register("subscriber_id")}
			className={`select select-bordered w-full ${
				errors.subscriber_id ? "select-error" : ""
			}`}
			onChange={(e) => onSubscriberChange(e.target.value)}
			value={watchSubscriberId}>
			<option value="">Choose a subscriber</option>
			{activeSubscribers.map((s) => (
				<option key={s.id} value={s.id}>
					{s.name} – {s.active_plans?.length || 0} active plan(s)
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
);
