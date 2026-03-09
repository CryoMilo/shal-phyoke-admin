import React from "react";
import { Edit, Trash2, Eye, ToggleLeft, ToggleRight } from "lucide-react";

const MenuTable = ({
	menus,
	openEditModal,
	openDetailsModal,
	handleDelete,
	toggleMenuStatus,
}) => {
	return (
		<div className="overflow-x-auto">
			<table className="table table-zebra w-full">
				<thead>
					<tr>
						<th>Name (English)</th>
						<th>Name (Burmese)</th>
						<th>Category</th>
						<th>Price</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{menus.map((menu) => (
						<tr key={menu.id} className="hover">
							<td>
								<div className="font-medium">{menu.name_english}</div>
								<div className="text-sm text-gray-500">{menu.name_thai}</div>
							</td>
							<td className="font-medium">{menu.name_burmese}</td>
							<td>
								<span className="badge badge-outline">{menu.category}</span>
							</td>
							<td>Ks{menu.price}</td>
							<td>
								<button
									onClick={() => toggleMenuStatus(menu.id)}
									className="btn btn-ghost btn-xs"
									title={
										menu.is_active ? "Click to deactivate" : "Click to activate"
									}>
									{menu.is_active ? (
										<ToggleRight className="w-5 h-5 text-success" />
									) : (
										<ToggleLeft className="w-5 h-5 text-error" />
									)}
									<span className="ml-1">
										{menu.is_active ? "Active" : "Inactive"}
									</span>
								</button>
							</td>
							<td>
								<div className="flex gap-2">
									<button
										className="btn btn-sm btn-ghost"
										onClick={() => openDetailsModal(menu)}
										title="View Details">
										<Eye className="w-4 h-4" />
									</button>
									<button
										className="btn btn-sm btn-ghost"
										onClick={() => openEditModal(menu)}
										title="Edit">
										<Edit className="w-4 h-4" />
									</button>
									<button
										className="btn btn-sm btn-ghost text-red-600"
										onClick={() => handleDelete(menu.id)}
										title="Delete">
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

export default MenuTable;
