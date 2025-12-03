import React from "react";
import { Edit, Trash2, Eye } from "lucide-react";

const RegularMenuCard = ({
	menu,
	onEdit,
	onDelete,
	onViewDetails,
	onToggleStatus,
}) => {
	const getCategoryBadgeColor = (category) => {
		switch (category) {
			case "Regular":
				return "badge-primary";
			case "Regular_Extras":
				return "badge-secondary";
			case "Regular_Drinks":
				return "badge-accent";
			default:
				return "badge-outline";
		}
	};

	const handleToggleStatus = async (e) => {
		e.stopPropagation();
		if (onToggleStatus) {
			await onToggleStatus(menu.id);
		}
	};

	return (
		<div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
			{/* Image */}
			<figure className="relative h-48 bg-gray-200">
				{menu.image_url ? (
					<img
						src={menu.image_url}
						alt={menu.name_english || menu.name_burmese}
						className="w-full h-full object-cover"
						onError={(e) => {
							e.target.style.display = "none";
							e.target.parentElement.classList.add("flex", "items-center", "justify-center");
							e.target.parentElement.innerHTML = '<span class="text-gray-400 text-sm">No Image</span>';
						}}
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<span className="text-gray-400 text-sm">No Image</span>
					</div>
				)}
				{/* Status Badge Overlay */}
				<div className="absolute top-2 right-2">
					<span
						className={`badge ${
							menu.is_active ? "badge-success" : "badge-error"
						}`}>
						{menu.is_active ? "Available" : "Out of Stock"}
					</span>
				</div>
			</figure>

			<div className="card-body p-4">
				{/* Title */}
				<h3 className="card-title text-lg">
					{menu.name_burmese}
					<span
						className={`badge badge-sm ${getCategoryBadgeColor(
							menu.category
						)}`}>
						{menu.category.replace("Regular_", "")}
					</span>
				</h3>

				{/* English/Thai Name */}
				{menu.name_english && (
					<p className="text-sm text-gray-600">{menu.name_english}</p>
				)}

				{/* Price */}
				<div className="text-xl font-bold text-primary mt-2">
					฿{menu.price}
				</div>

				{/* Taste Profile */}
				{menu.taste_profile && (
					<p className="text-xs text-gray-500 mt-1">
						{menu.taste_profile}
					</p>
				)}

				{/* Actions */}
				<div className="card-actions justify-between items-center mt-4">
					{/* Toggle Status Button */}
					<button
						className={`btn btn-sm ${
							menu.is_active ? "btn-warning" : "btn-success"
						}`}
						onClick={handleToggleStatus}
						title={menu.is_active ? "Mark as Out of Stock" : "Mark as Available"}>
						{menu.is_active ? "Out of Stock" : "Mark Available"}
					</button>

					{/* Action Buttons */}
					<div className="flex gap-1">
						<button
							className="btn btn-sm btn-ghost btn-square"
							onClick={() => onViewDetails(menu)}
							title="View Details">
							<Eye className="w-4 h-4" />
						</button>
						<button
							className="btn btn-sm btn-ghost btn-square"
							onClick={() => onEdit(menu)}
							title="Edit">
							<Edit className="w-4 h-4" />
						</button>
						<button
							className="btn btn-sm btn-ghost btn-square text-red-600"
							onClick={() => onDelete(menu.id)}
							title="Delete">
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RegularMenuCard;
