// src/components/inventory/InventoryGrid.jsx
import React from "react";
import { Edit2, Trash2, Image as ImageIcon } from "lucide-react";

const InventoryGrid = ({ items, onEdit, onDelete }) => {
	if (items.length === 0) {
		return (
			<div className="text-center py-12 bg-base-100 rounded-lg border border-base-200">
				<ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
				<p className="text-gray-500">No inventory items found</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{items.map((item) => (
				<div
					key={item.id}
					className={`card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 border ${
						!item.is_regular
							? "border-primary border-2"
							: "border-base-200 hover:border-primary/30"
					}`}>
					<div className="card-body p-4">
						<div className="flex items-start gap-3">
							{/* Image */}
							<div className="w-20 h-20 rounded-lg bg-base-300 flex items-center justify-center overflow-hidden">
								{item.image_url ? (
									<img
										src={item.image_url}
										alt={item.name}
										className="w-full h-full object-cover"
									/>
								) : (
									<ImageIcon className="w-8 h-8 text-gray-500" />
								)}
							</div>

							{/* Details */}
							<div className="flex-1 min-w-0">
								<div className="flex items-start justify-between">
									<div>
										<h3 className="font-semibold text-base truncate">
											{item.name}
										</h3>
										<p className="text-xs text-gray-500 mt-0.5">
											{item.category}
										</p>
									</div>

									{/* Action Buttons */}
									<div className="flex items-center gap-1">
										<button
											onClick={() => onEdit(item)}
											className="btn btn-ghost btn-xs btn-circle"
											title="Edit item">
											<Edit2 className="w-3.5 h-3.5" />
										</button>
										<button
											onClick={() => onDelete(item)}
											className="btn btn-ghost btn-xs btn-circle text-error"
											title="Delete item">
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</div>
								</div>

								<div className="mt-3 space-y-1.5">
									<div className="flex items-center text-sm">
										<span className="text-gray-500 w-16">Unit:</span>
										<span className="font-medium">{item.unit}</span>
									</div>
									<div className="flex items-center text-sm">
										<span className="text-gray-500 w-16">Vendor:</span>
										<span className="font-medium truncate">
											{item.default_vendor?.name || "—"}
										</span>
									</div>
								</div>

								{/* Badge */}
								<div className="mt-3">
									<span
										className={`badge badge-sm ${
											item.is_regular ? "badge-primary" : "badge-ghost"
										}`}>
										{item.is_regular ? "Regular Stock" : "Occasional"}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default InventoryGrid;
