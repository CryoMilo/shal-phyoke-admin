// src/pages/Customers.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
	Users,
	UserCheck,
	Phone,
	MapPin,
	ShoppingBag,
	DollarSign,
	Search,
	ArrowUpDown,
	Filter,
	RotateCcw,
	ChevronRight,
	X,
	Utensils,
	Sparkles,
	Clock,
	CheckCircle2,
	Calendar,
	FileText,
} from "lucide-react";
import { PageHeader } from "../components/common/PageHeader";
import { Loading } from "../components/common/Loading";
import useCustomerStore from "../stores/customerStore";

const Customers = () => {
	const {
		customers,
		overview,
		loading,
		overviewLoading,
		selectedCustomer,
		customerOrders,
		ordersLoading,
		searchQuery,
		sortBy,
		filterOnlyRepeat,
		setSearchQuery,
		setSortBy,
		setFilterOnlyRepeat,
		setSelectedCustomer,
		fetchOverview,
		fetchCustomers,
	} = useCustomerStore();

	const [searchInput, setSearchInput] = useState(searchQuery);

	useEffect(() => {
		fetchOverview();
		fetchCustomers();
	}, [fetchOverview, fetchCustomers]);

	// Debounce search query input to store
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchQuery(searchInput);
			fetchCustomers();
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput, setSearchQuery, fetchCustomers]);

	const handleRefresh = () => {
		fetchOverview();
		fetchCustomers();
	};

	const handleSortChange = (e) => {
		setSortBy(e.target.value);
		setTimeout(() => fetchCustomers(), 50);
	};

	const handleFilterRepeatToggle = () => {
		setFilterOnlyRepeat(!filterOnlyRepeat);
		setTimeout(() => fetchCustomers(), 50);
	};

	// Calculated Repeat Rate
	const repeatRate = useMemo(() => {
		if (!overview || !overview.total_customers) return "0.0";
		const rate = (overview.repeat_customers / overview.total_customers) * 100;
		return rate.toFixed(1);
	}, [overview]);

	const formatDate = (dateStr) => {
		if (!dateStr) return "-";
		const d = new Date(dateStr);
		return d.toLocaleDateString("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	const formatDateTime = (dateStr) => {
		if (!dateStr) return "-";
		const d = new Date(dateStr);
		return d.toLocaleString("en-GB", {
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
			{/* Page Header */}
			<PageHeader
				title="Customer Analytics"
				description="Customer loyalty, repeat purchase patterns, and delivery preferences"
				buttons={[
					{
						label: "Refresh",
						icon: RotateCcw,
						variant: "ghost",
						onClick: handleRefresh,
						loading: loading || overviewLoading,
					},
				]}
			/>

			{/* KPI Overview Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* 1. Total Customers */}
				<div className="stat bg-base-100 border border-base-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
					<div className="stat-figure text-primary">
						<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
							<Users className="w-6 h-6 text-primary" />
						</div>
					</div>
					<div className="stat-title text-xs font-semibold uppercase tracking-wider text-base-content/60">
						Total Customers
					</div>
					<div className="stat-value text-2xl sm:text-3xl text-primary font-black mt-1">
						{overviewLoading ? (
							<span className="loading loading-spinner loading-sm" />
						) : (
							(overview?.total_customers || 0).toLocaleString()
						)}
					</div>
					<div className="stat-desc text-xs mt-1 text-base-content/70">
						{(overview?.total_delivery_orders || 0).toLocaleString()} delivery orders
					</div>
				</div>

				{/* 2. Repeat Customers & Rate */}
				<div className="stat bg-base-100 border border-base-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
					<div className="stat-figure text-success">
						<div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
							<Sparkles className="w-6 h-6 text-success" />
						</div>
					</div>
					<div className="stat-title text-xs font-semibold uppercase tracking-wider text-base-content/60">
						Repeat Rate
					</div>
					<div className="stat-value text-2xl sm:text-3xl text-success font-black mt-1">
						{overviewLoading ? (
							<span className="loading loading-spinner loading-sm" />
						) : (
							`${repeatRate}%`
						)}
					</div>
					<div className="stat-desc text-xs mt-1 text-base-content/70">
						{(overview?.repeat_customers || 0).toLocaleString()} repeat customers (2+ orders)
					</div>
				</div>

				{/* 3. Delivery Revenue */}
				<div className="stat bg-base-100 border border-base-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
					<div className="stat-figure text-secondary">
						<div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
							<DollarSign className="w-6 h-6 text-secondary" />
						</div>
					</div>
					<div className="stat-title text-xs font-semibold uppercase tracking-wider text-base-content/60">
						Delivery Revenue
					</div>
					<div className="stat-value text-2xl sm:text-3xl text-secondary font-black mt-1">
						{overviewLoading ? (
							<span className="loading loading-spinner loading-sm" />
						) : (
							`฿${Number(overview?.total_delivery_revenue || 0).toLocaleString()}`
						)}
					</div>
					<div className="stat-desc text-xs mt-1 text-base-content/70">
						From completed delivery orders
					</div>
				</div>

				{/* 4. Average Spend Per Customer */}
				<div className="stat bg-base-100 border border-base-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
					<div className="stat-figure text-info">
						<div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
							<ShoppingBag className="w-6 h-6 text-info" />
						</div>
					</div>
					<div className="stat-title text-xs font-semibold uppercase tracking-wider text-base-content/60">
						Avg Spend / Customer
					</div>
					<div className="stat-value text-2xl sm:text-3xl text-info font-black mt-1">
						{overviewLoading ? (
							<span className="loading loading-spinner loading-sm" />
						) : (
							`฿${Number(overview?.avg_spend_per_customer || 0).toLocaleString()}`
						)}
					</div>
					<div className="stat-desc text-xs mt-1 text-base-content/70">
						Customer lifetime value
					</div>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<div className="bg-base-100 border border-base-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
				{/* Search Input */}
				<div className="relative flex-1">
					<Search className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
					<input
						type="text"
						placeholder="Search customer name or phone..."
						className="input input-bordered w-full pl-9 pr-8 input-sm sm:input-md"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
					/>
					{searchInput && (
						<button
							onClick={() => {
								setSearchInput("");
								setSearchQuery("");
								setTimeout(() => fetchCustomers(), 50);
							}}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 btn btn-ghost btn-circle btn-xs opacity-60 hover:opacity-100">
							<X className="w-3.5 h-3.5" />
						</button>
					)}
				</div>

				{/* Controls Right */}
				<div className="flex flex-wrap items-center gap-2">
					{/* Repeat Only Toggle Button */}
					<button
						type="button"
						onClick={handleFilterRepeatToggle}
						className={`btn btn-sm ${
							filterOnlyRepeat ? "btn-success" : "btn-outline border-base-300"
						} gap-1.5`}>
						<Sparkles className="w-3.5 h-3.5" />
						<span>Repeat Only</span>
					</button>

					{/* Sort Dropdown */}
					<div className="flex items-center gap-1.5">
						<ArrowUpDown className="w-4 h-4 text-base-content/50" />
						<select
							className="select select-bordered select-sm"
							value={sortBy}
							onChange={handleSortChange}>
							<option value="total_orders">Most Orders</option>
							<option value="total_spent">Highest Spend</option>
							<option value="last_order_at">Recently Active</option>
							<option value="name">Name (A-Z)</option>
						</select>
					</div>
				</div>
			</div>

			{/* Customers Card Grid */}
			{loading ? (
				<div className="py-16">
					<Loading message="Loading customer analytics..." />
				</div>
			) : customers.length === 0 ? (
				<div className="bg-base-100 border border-base-200 rounded-2xl p-12 text-center">
					<div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4 text-base-content/40">
						<Users className="w-8 h-8" />
					</div>
					<h3 className="font-bold text-lg text-base-content">No customers found</h3>
					<p className="text-base-content/60 text-sm mt-1 max-w-sm mx-auto">
						{searchInput || filterOnlyRepeat
							? "Try changing your search term or disabling the repeat customer filter."
							: "Delivery orders with customer information will automatically populate this dashboard."}
					</p>
					{(searchInput || filterOnlyRepeat) && (
						<button
							onClick={() => {
								setSearchInput("");
								setSearchQuery("");
								setFilterOnlyRepeat(false);
								setTimeout(() => fetchCustomers(), 50);
							}}
							className="btn btn-sm btn-outline btn-primary mt-4">
							Reset Filters
						</button>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{customers.map((cust) => {
						const isRepeat = (cust.total_orders || 0) > 1;
						const frequentNotesList = Array.isArray(cust.frequent_notes)
							? cust.frequent_notes
							: [];
						const favoriteItemsList = Array.isArray(cust.favorite_items)
							? cust.favorite_items
							: [];

						return (
							<div
								key={cust.id}
								className="bg-base-100 border border-base-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
								<div className="space-y-3">
									{/* Customer Header */}
									<div className="flex items-start justify-between gap-2">
										<div>
											<div className="flex items-center gap-2 flex-wrap">
												<h3 className="font-bold text-base text-base-content">
													{cust.name || "Unnamed Customer"}
												</h3>
												{isRepeat ? (
													<span className="badge badge-success badge-sm gap-1 text-[11px] font-semibold">
														<Sparkles className="w-3 h-3" />
														{cust.total_orders} Orders
													</span>
												) : (
													<span className="badge badge-ghost badge-sm text-[11px]">
														1 Order
													</span>
												)}
											</div>
											{cust.phone && (
												<a
													href={`tel:${cust.phone}`}
													className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5 font-medium">
													<Phone className="w-3 h-3" />
													{cust.phone}
												</a>
											)}
										</div>

										<div className="text-right">
											<div className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">
												Total Spend
											</div>
											<div className="text-base font-bold text-secondary">
												฿{Number(cust.total_spent || 0).toLocaleString()}
											</div>
										</div>
									</div>

									{/* Delivery Address */}
									{cust.delivery_address && (
										<div className="flex items-start gap-1.5 text-xs text-base-content/70 bg-base-200/60 p-2 rounded-xl">
											<MapPin className="w-3.5 h-3.5 text-base-content/50 shrink-0 mt-0.5" />
											<span className="line-clamp-2">{cust.delivery_address}</span>
										</div>
									)}

									{/* Frequent Order Notes */}
									{frequentNotesList.length > 0 ? (
										<div className="space-y-1">
											<span className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-1">
												<FileText className="w-3 h-3 text-warning" />
												Frequent Notes
											</span>
											<div className="flex flex-wrap gap-1">
												{frequentNotesList.slice(0, 3).map((item, idx) => (
													<span
														key={idx}
														className="badge badge-warning badge-outline badge-sm text-[11px] max-w-full truncate"
														title={`${item.note} (${item.count}x)`}>
														{item.note}
														<span className="opacity-70 ml-1 font-bold">
															×{item.count}
														</span>
													</span>
												))}
											</div>
										</div>
									) : cust.default_notes ? (
										<div className="space-y-1">
											<span className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wider">
												Default Note
											</span>
											<div className="text-xs italic text-base-content/80 bg-base-200/40 px-2 py-1 rounded-lg">
												📝 {cust.default_notes}
											</div>
										</div>
									) : null}

									{/* Favorite Dishes */}
									{favoriteItemsList.length > 0 && (
										<div className="space-y-1">
											<span className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-1">
												<Utensils className="w-3 h-3 text-primary" />
												Favorite Dishes
											</span>
											<div className="flex flex-wrap gap-1">
												{favoriteItemsList.slice(0, 3).map((item, idx) => (
													<span
														key={idx}
														className="badge badge-ghost badge-sm text-[11px] font-normal"
														title={`${item.name} (${item.count}x)`}>
														{item.name}
														<span className="text-primary font-bold ml-1">
															×{item.count}
														</span>
													</span>
												))}
											</div>
										</div>
									)}
								</div>

								{/* Card Bottom Footer */}
								<div className="pt-2 border-t border-base-200 flex items-center justify-between gap-2 text-xs text-base-content/60">
									<div className="flex items-center gap-1">
										<Clock className="w-3.5 h-3.5 text-base-content/40" />
										<span>Last: {formatDate(cust.last_order_at)}</span>
									</div>

									<button
										type="button"
										onClick={() => setSelectedCustomer(cust)}
										className="btn btn-xs btn-outline btn-primary gap-1 active:scale-95 transition-transform">
										<span>History</span>
										<ChevronRight className="w-3 h-3" />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Customer Detail Drawer / Modal */}
			{selectedCustomer && (
				<div className="modal modal-open">
					<div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
						{/* Modal Header */}
						<div className="flex items-start justify-between gap-4 pb-4 border-b border-base-200">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
									<UserCheck className="w-6 h-6" />
								</div>
								<div>
									<div className="flex items-center gap-2">
										<h2 className="text-xl font-bold text-base-content">
											{selectedCustomer.name || "Customer Details"}
										</h2>
										{(selectedCustomer.total_orders || 0) > 1 && (
											<span className="badge badge-success badge-sm">
												Repeat Customer
											</span>
										)}
									</div>
									{selectedCustomer.phone && (
										<a
											href={`tel:${selectedCustomer.phone}`}
											className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-0.5">
											<Phone className="w-3 h-3" />
											{selectedCustomer.phone}
										</a>
									)}
								</div>
							</div>

							<button
								type="button"
								onClick={() => setSelectedCustomer(null)}
								className="btn btn-sm btn-circle btn-ghost">
								<X className="w-4 h-4" />
							</button>
						</div>

						{/* Modal Customer Stats Row */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-base-200">
							<div className="bg-base-200/60 p-2.5 rounded-xl text-center">
								<div className="text-[11px] font-semibold text-base-content/60 uppercase">
									Total Orders
								</div>
								<div className="text-lg font-bold text-primary">
									{selectedCustomer.total_orders || 0}
								</div>
							</div>
							<div className="bg-base-200/60 p-2.5 rounded-xl text-center">
								<div className="text-[11px] font-semibold text-base-content/60 uppercase">
									Total Spend
								</div>
								<div className="text-lg font-bold text-secondary">
									฿{Number(selectedCustomer.total_spent || 0).toLocaleString()}
								</div>
							</div>
							<div className="bg-base-200/60 p-2.5 rounded-xl text-center">
								<div className="text-[11px] font-semibold text-base-content/60 uppercase">
									First Seen
								</div>
								<div className="text-xs font-semibold text-base-content mt-1">
									{formatDate(selectedCustomer.first_order_at)}
								</div>
							</div>
							<div className="bg-base-200/60 p-2.5 rounded-xl text-center">
								<div className="text-[11px] font-semibold text-base-content/60 uppercase">
									Last Active
								</div>
								<div className="text-xs font-semibold text-base-content mt-1">
									{formatDate(selectedCustomer.last_order_at)}
								</div>
							</div>
						</div>

						{/* Delivery Address */}
						{selectedCustomer.delivery_address && (
							<div className="py-3 border-b border-base-200 flex items-start gap-2 text-sm text-base-content/80">
								<MapPin className="w-4 h-4 text-base-content/50 shrink-0 mt-0.5" />
								<div>
									<span className="font-semibold text-xs text-base-content/60 block uppercase">
										Delivery Address:
									</span>
									<span>{selectedCustomer.delivery_address}</span>
								</div>
							</div>
						)}

						{/* Customer Preferences: Frequent Notes & Favorites */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-base-200">
							{/* Frequent Notes */}
							<div className="space-y-2">
								<h4 className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
									<FileText className="w-3.5 h-3.5 text-warning" />
									Frequently Requested Notes
								</h4>
								{Array.isArray(selectedCustomer.frequent_notes) &&
								selectedCustomer.frequent_notes.length > 0 ? (
									<div className="flex flex-col gap-1.5">
										{selectedCustomer.frequent_notes.map((noteItem, idx) => (
											<div
												key={idx}
												className="flex items-center justify-between text-xs bg-base-200/50 p-2 rounded-lg">
												<span className="font-medium text-base-content">
													{noteItem.note}
												</span>
												<span className="badge badge-warning badge-sm font-bold">
													{noteItem.count}×
												</span>
											</div>
										))}
									</div>
								) : selectedCustomer.default_notes ? (
									<div className="text-xs italic bg-base-200/40 p-2.5 rounded-lg text-base-content/80">
										📝 {selectedCustomer.default_notes}
									</div>
								) : (
									<div className="text-xs text-base-content/50 italic">
										No special notes recorded.
									</div>
								)}
							</div>

							{/* Favorite Dishes */}
							<div className="space-y-2">
								<h4 className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
									<Utensils className="w-3.5 h-3.5 text-primary" />
									Favorite Dishes
								</h4>
								{Array.isArray(selectedCustomer.favorite_items) &&
								selectedCustomer.favorite_items.length > 0 ? (
									<div className="flex flex-col gap-1.5">
										{selectedCustomer.favorite_items.map((fav, idx) => (
											<div
												key={idx}
												className="flex items-center justify-between text-xs bg-base-200/50 p-2 rounded-lg">
												<span className="font-medium text-base-content">
													{fav.name}
												</span>
												<span className="badge badge-primary badge-outline badge-sm font-bold">
													{fav.count} ordered
												</span>
											</div>
										))}
									</div>
								) : (
									<div className="text-xs text-base-content/50 italic">
										No item history available.
									</div>
								)}
							</div>
						</div>

						{/* Recent Order History */}
						<div className="pt-4 space-y-3">
							<h4 className="text-sm font-bold uppercase tracking-wider text-base-content/80 flex items-center gap-2">
								<ShoppingBag className="w-4 h-4 text-primary" />
								Recent Order History (Last 15)
							</h4>

							{ordersLoading ? (
								<div className="py-8 text-center">
									<span className="loading loading-spinner loading-md text-primary" />
									<p className="text-xs text-base-content/60 mt-2">
										Loading order history...
									</p>
								</div>
							) : customerOrders.length === 0 ? (
								<div className="text-center py-6 bg-base-200/40 rounded-xl text-xs text-base-content/50">
									No recent orders found for this customer.
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="table table-xs sm:table-sm w-full">
										<thead>
											<tr className="border-base-200 text-base-content/60">
												<th>Order #</th>
												<th>Date & Time</th>
												<th>Items</th>
												<th>Notes</th>
												<th>Amount</th>
												<th>Status</th>
											</tr>
										</thead>
										<tbody>
											{customerOrders.map((order) => {
												const itemsCount = Array.isArray(order.order_items)
													? order.order_items.reduce(
															(sum, i) => sum + (Number(i.quantity) || 1),
															0
													  )
													: 0;

												return (
													<tr key={order.id} className="hover:bg-base-200/50">
														<td className="font-bold text-xs font-mono">
															{order.order_number || "-"}
														</td>
														<td className="text-xs text-base-content/70 whitespace-nowrap">
															{formatDateTime(order.created_at)}
														</td>
														<td className="text-xs max-w-[200px] truncate">
															{Array.isArray(order.order_items)
																? order.order_items
																		.map(
																			(i) =>
																				`${
																					i.name_burmese ||
																					i.name_english ||
																					"Item"
																				} (${i.quantity}x)`
																		)
																		.join(", ")
																: `${itemsCount} items`}
														</td>
														<td className="text-xs text-warning max-w-[150px] truncate">
															{order.notes ? `📝 ${order.notes}` : "-"}
														</td>
														<td className="font-bold text-xs whitespace-nowrap text-secondary">
															฿{Number(order.total_amount || 0).toLocaleString()}
														</td>
														<td>
															<span
																className={`badge badge-xs text-[10px] ${
																	order.pos_order_status === "completed"
																		? "badge-success"
																		: order.pos_order_status === "cancelled"
																		? "badge-error"
																		: "badge-ghost"
																}`}>
																{order.pos_order_status || "completed"}
															</span>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* Modal Actions */}
						<div className="modal-action mt-6 border-t border-base-200 pt-4">
							<button
								type="button"
								onClick={() => setSelectedCustomer(null)}
								className="btn btn-sm btn-ghost">
								Close
							</button>
						</div>
					</div>
					<div
						className="modal-backdrop bg-black/40"
						onClick={() => setSelectedCustomer(null)}
					/>
				</div>
			)}
		</div>
	);
};

export default Customers;
