// pages/ArchivedOrders.js
import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, RotateCcw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useOrderCreationStore } from "../stores/subscriberOrderStore";
import Loading from "../components/common/Loading";
import { PageHeader } from "../components/common/PageHeader";

export const ArchivedOrders = () => {
	const { orders, loadingOrders, fetchSubscriberOrders, updateOrderStatus } =
		useOrderCreationStore();
	const [searchTerm, setSearchTerm] = useState("");
	const [dateFilter, setDateFilter] = useState("");
	const [restoringOrderId, setRestoringOrderId] = useState(null);

	useEffect(() => {
		fetchSubscriberOrders();
	}, [fetchSubscriberOrders]);

	// Filter archived orders
	const archivedOrders = orders
		.filter((order) => order.status === "Archived")
		.filter(
			(order) =>
				order.subscriber_name
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				order.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
		)
		.filter((order) => {
			if (!dateFilter) return true;
			return order.order_date === dateFilter;
		})
		.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

	const getStatusBadge = (status) => {
		const statusConfig = {
			Archived: "badge-neutral",
			Delivered: "badge-success",
			Cancelled: "badge-error",
			Cooking: "badge-warning",
			Ready: "badge-info",
		};
		return statusConfig[status] || "badge-neutral";
	};

	const handleRestoreOrder = async (orderId) => {
		if (
			!confirm(
				"Are you sure you want to restore this order? It will be moved back to active orders."
			)
		) {
			return;
		}

		setRestoringOrderId(orderId);
		try {
			await updateOrderStatus(orderId, "Cooking"); // Or whatever status you want to restore to
			await fetchSubscriberOrders(); // Refresh the list
			alert("Order restored successfully!");
		} catch (error) {
			console.error("Error restoring order:", error);
			alert("Error restoring order: " + (error.message || "Unknown error"));
		} finally {
			setRestoringOrderId(null);
		}
	};

	if (loadingOrders) {
		return <Loading />;
	}

	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<div className="flex items-center">
				<div className="flex items-center gap-4">
					<Link to="/subscriber-orders" className="btn btn-ghost btn-sm">
						<ArrowLeft className="w-4 h-4 mr-2" />
					</Link>
					<PageHeader
						title="Archived Orders"
						description="Manage Archived Orders"
					/>
				</div>
			</div>

			{/* Filters */}
			<div className="card bg-base-200 mb-6">
				<div className="card-body p-4">
					<div className="flex flex-col md:flex-row gap-4">
						{/* Search */}
						<div className="form-control flex-1">
							<label className="label">
								<span className="label-text">Search Orders</span>
							</label>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
								<input
									type="text"
									placeholder="Search by subscriber name or plan..."
									className="input input-bordered pl-10 w-full"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>

						{/* Date Filter */}
						<div className="form-control">
							<label className="label">
								<span className="label-text">Filter by Date</span>
							</label>
							<input
								type="date"
								className="input input-bordered"
								value={dateFilter}
								onChange={(e) => setDateFilter(e.target.value)}
							/>
						</div>

						{/* Clear Filters */}
						{(searchTerm || dateFilter) && (
							<div className="form-control justify-end">
								<button
									className="btn btn-ghost btn-sm"
									onClick={() => {
										setSearchTerm("");
										setDateFilter("");
									}}>
									Clear Filters
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Orders Table */}
			{archivedOrders.length === 0 ? (
				<div className="text-center py-12">
					<div className="text-gray-500 text-lg mb-4">
						{searchTerm || dateFilter
							? "No archived orders match your filters"
							: "No archived orders found"}
					</div>
					{!searchTerm && !dateFilter && (
						<Link to="/subscriber-orders" className="btn btn-primary">
							View Active Orders
						</Link>
					)}
				</div>
			) : (
				<div className="overflow-x-auto">
					<table className="table table-zebra w-full">
						<thead>
							<tr>
								<th>Subscriber</th>
								<th>Plan</th>
								<th>Order Date</th>
								<th>Status</th>
								<th>Type</th>
								<th>Points Used</th>
								<th>Created</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{archivedOrders.map((order) => (
								<tr key={order.id}>
									<td>
										<div className="flex items-center gap-3">
											<div className="avatar">
												<div className="w-10 h-10 rounded-full">
													<img
														src={order.image_url || "/default-avatar.png"}
														alt={order.subscriber_name}
													/>
												</div>
											</div>
											<div>
												<div className="font-bold">{order.subscriber_name}</div>
												<div className="text-sm text-gray-500">
													{order.phone_number}
												</div>
											</div>
										</div>
									</td>
									<td>
										<div className="badge badge-outline">{order.plan_name}</div>
									</td>
									<td>{new Date(order.order_date).toLocaleDateString()}</td>
									<td>
										<span className={`badge ${getStatusBadge(order.status)}`}>
											{order.status}
										</span>
									</td>
									<td>
										<span
											className={`badge ${
												order.eat_in ? "badge-info" : "badge-ghost"
											}`}>
											{order.eat_in ? "Dine-in" : "Delivery"}
										</span>
									</td>
									<td>
										<span className="font-mono">{order.point_use}</span>
									</td>
									<td>
										<div className="text-sm text-gray-500">
											{new Date(order.created_at).toLocaleDateString()}
										</div>
										<div className="text-xs text-gray-400">
											{new Date(order.created_at).toLocaleTimeString()}
										</div>
									</td>
									<td>
										<div className="flex gap-2">
											<button
												className="btn btn-success btn-sm"
												onClick={() => handleRestoreOrder(order.id)}
												disabled={restoringOrderId === order.id}>
												{restoringOrderId === order.id ? (
													<>
														<span className="loading loading-spinner loading-xs"></span>
														Restoring...
													</>
												) : (
													<>
														<RotateCcw className="w-3 h-3 mr-1" />
														Restore
													</>
												)}
											</button>
											{/* <button
												className="btn btn-ghost btn-sm"
												onClick={() => {
													// View order details - you can implement this later
													console.log("View order:", order.id);
												}}>
												View
											</button> */}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};
