import React from "react";
import { X } from "lucide-react";

const MenuDetailsModal = ({ selectedMenu, setShowDetailsModal }) => {
	return (
		<div className="modal modal-open">
			<div className="modal-box w-11/12 max-w-lg">
				<div className="flex justify-between items-start mb-4">
					<h3 className="font-bold text-lg">Menu Item Details</h3>
					<button
						className="btn btn-sm btn-ghost"
						onClick={() => setShowDetailsModal(false)}>
						<X className="w-4 h-4" />
					</button>
				</div>

				{selectedMenu.image_url && (
					<div className="mb-4">
						<img
							src={selectedMenu.image_url}
							alt={selectedMenu.name_english}
							className="w-full h-48 object-cover rounded-lg"
						/>
					</div>
				)}

				<div className="space-y-3">
					<div>
						<strong>English:</strong> {selectedMenu.name_english}
					</div>
					<div>
						<strong>Burmese:</strong> {selectedMenu.name_burmese}
					</div>
					{selectedMenu.name_thai && (
						<div>
							<strong>Thai:</strong> {selectedMenu.name_thai}
						</div>
					)}
					<div className="flex gap-4">
						<div>
							<strong>Category:</strong>
							<span className="badge badge-outline ml-2">
								{selectedMenu.category}
							</span>
						</div>
					</div>
					<div>
						<strong>Price:</strong> ₹{selectedMenu.price}
					</div>
					{selectedMenu.taste_profile && (
						<div>
							<strong>Taste Profile:</strong> {selectedMenu.taste_profile}
						</div>
					)}
					<div>
						<strong>Vegan:</strong>
						<span
							className={`badge badge-sm ml-2 ${
								selectedMenu.is_vegan ? "badge-success" : "badge-ghost"
							}`}>
							{selectedMenu.is_vegan ? "🌱 Yes" : "No"}
						</span>
					</div>
					{selectedMenu.description && (
						<div>
							<strong>Description:</strong> {selectedMenu.description}
						</div>
					)}
					{selectedMenu.sensitive_ingredients &&
						selectedMenu.sensitive_ingredients.length > 0 && (
							<div>
								<strong>Sensitive Ingredients:</strong>
								<div className="flex flex-wrap gap-1 mt-1">
									{selectedMenu.sensitive_ingredients.map(
										(ingredient, index) => (
											<span
												key={index}
												className="badge badge-warning badge-sm">
												{ingredient}
											</span>
										)
									)}
								</div>
							</div>
						)}
					<div>
						<strong>Status:</strong>
						<span
							className={`badge ${
								selectedMenu.is_active ? "badge-success" : "badge-error"
							} ml-2`}>
							{selectedMenu.is_active ? "Active" : "Inactive"}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MenuDetailsModal;
