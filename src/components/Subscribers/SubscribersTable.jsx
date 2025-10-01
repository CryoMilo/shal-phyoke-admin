import { Edit, Eye, Trash2 } from "lucide-react";
import { avatar_placeholder } from "../../constants";

export const SubscribersTable = ({ subscribers, onView, onEdit, onDelete }) => {
	if (subscribers.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500 text-lg">No subscribers found</p>
				<button className="btn btn-primary mt-4" onClick={() => onEdit(null)}>
					Add Your First Subscriber
				</button>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="table table-zebra w-full">
				<thead>
					<tr>
						<th>Customer</th>
						<th>Current Plan</th>
						<th>Points</th>
						<th>Serve Type</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{subscribers.map((subscriber) => (
						<tr key={subscriber.id}>
							<td>
								<div className="flex items-center gap-3">
									<div className="avatar">
										<div className="w-16 rounded-full">
											<img
												src={subscriber?.image_url || avatar_placeholder}
												alt={subscriber.name}
											/>
										</div>
									</div>
									<div>
										<div className="font-bold">{subscriber.name}</div>
										<div className="text-sm opacity-50">
											{subscriber.line_id || "No LINE ID"}
										</div>
									</div>
								</div>
							</td>
							<td>
								<div className="flex flex-col gap-1">
									<span className="badge badge-outline">
										{subscriber.plan_name}
									</span>
									{subscriber.active_plans?.length > 1 && (
										<span className="text-xs text-gray-500">
											+{subscriber.active_plans.length - 1} more plan(s)
										</span>
									)}
								</div>
							</td>
							<td>
								<span className="font-mono font-semibold">
									{subscriber.remaining_points}
								</span>
							</td>
							<td>
								<span className="badge badge-ghost">
									{subscriber.serve_type || "N/A"}
								</span>
							</td>
							<td>
								<span
									className={`badge ${
										subscriber.is_active ? "badge-success" : "badge-error"
									}`}>
									{subscriber.is_active ? "Active" : "Inactive"}
								</span>
							</td>
							<td>
								<div className="flex gap-2">
									<button
										className="btn btn-sm btn-ghost"
										onClick={() => onView(subscriber)}>
										<Eye className="w-4 h-4" />
									</button>
									<button
										className="btn btn-sm btn-ghost"
										onClick={() => onEdit(subscriber)}>
										<Edit className="w-4 h-4" />
									</button>
									<button
										className="btn btn-sm btn-ghost text-red-600"
										onClick={() => onDelete(subscriber.id)}>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
