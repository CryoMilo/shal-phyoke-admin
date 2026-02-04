import React, { useState, useEffect } from "react";
import {
	format,
	startOfMonth,
	endOfMonth,
	addMonths,
	subMonths,
	parseISO,
} from "date-fns";
import {
	Clock,
	CheckCircle,
	AlertCircle,
	Plus,
	Copy,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { PageHeader } from "../components/common/PageHeader";
import { useForm } from "react-hook-form";

// Expense categories (same as daily expenses for consistency)
const expenseCategories = [
	{ value: "gas", label: "Gas", color: "bg-green-500" },
	{ value: "utilities", label: "Utilities", color: "bg-blue-500" },
	{ value: "rent", label: "Rent", color: "bg-yellow-500" },
	{ value: "salaries", label: "Salaries", color: "bg-pink-500" },
	{ value: "other", label: "Other", color: "bg-gray-500" },
];

const MonthlyOverheads = () => {
	const [overheads, setOverheads] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedMonth, setSelectedMonth] = useState(
		format(new Date(), "yyyy-MM")
	);
	const [stats, setStats] = useState({
		total: 0,
		paid: 0,
		pending: 0,
		overdue: 0,
	});
	const [showAddForm, setShowAddForm] = useState(false);
	const [showDuplicateModal, setShowDuplicateModal] = useState(false);
	const [expandedOverhead, setExpandedOverhead] = useState(null);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors },
	} = useForm({
		defaultValues: {
			description: "",
			category: "utilities",
			amount: "",
			due_date: "",
			is_recurring: false,
			notes: "",
		},
	});

	const selectedCategory = watch("category");

	const fetchOverheads = async () => {
		setLoading(true);
		try {
			const monthStart = startOfMonth(new Date(`${selectedMonth}-01`));
			const monthEnd = endOfMonth(monthStart);

			const { data, error } = await supabase
				.from("monthly_overheads")
				.select("*")
				.gte("month", format(monthStart, "yyyy-MM-dd"))
				.lte("month", format(monthEnd, "yyyy-MM-dd"))
				.order("due_date", { ascending: true });

			if (error) throw error;

			setOverheads(data || []);

			// Calculate stats
			const now = new Date();
			const stats = data?.reduce(
				(acc, overhead) => {
					acc.total += parseFloat(overhead.amount);

					if (overhead.paid_date) {
						acc.paid += parseFloat(overhead.amount);
					} else {
						acc.pending += parseFloat(overhead.amount);

						if (overhead.due_date && new Date(overhead.due_date) < now) {
							acc.overdue += parseFloat(overhead.amount);
						}
					}

					return acc;
				},
				{ total: 0, paid: 0, pending: 0, overdue: 0 }
			);

			setStats(stats || { total: 0, paid: 0, pending: 0, overdue: 0 });
		} catch (error) {
			console.error("Error fetching overheads:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOverheads();
	}, [selectedMonth]);

	const handleMonthChange = (months) => {
		const newDate = new Date(`${selectedMonth}-01`);
		newDate.setMonth(newDate.getMonth() + months);
		setSelectedMonth(format(newDate, "yyyy-MM"));
	};

	const onSubmit = async (data) => {
		try {
			const monthStart = startOfMonth(new Date(`${selectedMonth}-01`));

			const overheadData = {
				month: format(monthStart, "yyyy-MM-dd"),
				category:
					data.category === "other" && data.other_category
						? data.other_category
						: data.category,
				description: data.description,
				amount: parseFloat(data.amount),
				due_date: data.due_date || null,
				is_recurring: data.is_recurring,
				notes: data.notes || null,
				paid_date: null,
			};

			const { error } = await supabase
				.from("monthly_overheads")
				.insert([overheadData]);

			if (error) throw error;

			resetForm();
			setShowAddForm(false);
			fetchOverheads();
		} catch (error) {
			console.error("Error adding overhead:", error);
		}
	};

	const resetForm = () => {
		reset({
			description: "",
			category: "utilities",
			amount: "",
			due_date: "",
			is_recurring: false,
			notes: "",
			other_category: "",
		});
	};

	const handleMarkAsPaid = async (id) => {
		try {
			const { error } = await supabase
				.from("monthly_overheads")
				.update({
					paid_date: format(new Date(), "yyyy-MM-dd"),
					updated_at: new Date().toISOString(),
				})
				.eq("id", id);

			if (error) throw error;
			fetchOverheads();
		} catch (error) {
			console.error("Error marking as paid:", error);
		}
	};

	const handleMarkAsUnpaid = async (id) => {
		try {
			const { error } = await supabase
				.from("monthly_overheads")
				.update({
					paid_date: null,
					updated_at: new Date().toISOString(),
				})
				.eq("id", id);

			if (error) throw error;
			fetchOverheads();
		} catch (error) {
			console.error("Error marking as unpaid:", error);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Are you sure you want to delete this overhead?")) return;

		try {
			const { error } = await supabase
				.from("monthly_overheads")
				.delete()
				.eq("id", id);

			if (error) throw error;
			fetchOverheads();
		} catch (error) {
			console.error("Error deleting overhead:", error);
		}
	};

	const handleDuplicateFromPreviousMonth = async () => {
		try {
			// Get previous month
			const currentMonth = new Date(`${selectedMonth}-01`);
			const previousMonth = subMonths(currentMonth, 1);
			const prevMonthStart = startOfMonth(previousMonth);
			const prevMonthEnd = endOfMonth(previousMonth);

			// Fetch previous month's recurring overheads
			const { data: previousOverheads, error } = await supabase
				.from("monthly_overheads")
				.select("*")
				.eq("is_recurring", true)
				.gte("month", format(prevMonthStart, "yyyy-MM-dd"))
				.lte("month", format(prevMonthEnd, "yyyy-MM-dd"));

			if (error) throw error;

			if (!previousOverheads || previousOverheads.length === 0) {
				alert("No recurring overheads found in previous month");
				return;
			}

			const currentMonthStart = startOfMonth(currentMonth);

			// Create new overheads for current month
			const newOverheads = previousOverheads.map((overhead) => ({
				month: format(currentMonthStart, "yyyy-MM-dd"),
				category: overhead.category,
				description: overhead.description,
				amount: overhead.amount,
				due_date: overhead.due_date
					? format(addMonths(parseISO(overhead.due_date), 1), "yyyy-MM-dd")
					: null,
				is_recurring: true,
				notes: overhead.notes,
				paid_date: null,
			}));

			const { error: insertError } = await supabase
				.from("monthly_overheads")
				.insert(newOverheads);

			if (insertError) throw insertError;

			setShowDuplicateModal(false);
			fetchOverheads();
			alert(
				`Duplicated ${newOverheads.length} recurring overheads from previous month`
			);
		} catch (error) {
			console.error("Error duplicating overheads:", error);
			alert("Error duplicating overheads: " + error.message);
		}
	};

	const getStatus = (overhead) => {
		const now = new Date();

		if (overhead.paid_date) {
			return { label: "Paid", color: "badge-success", icon: CheckCircle };
		}

		if (overhead.due_date && new Date(overhead.due_date) < now) {
			return { label: "Overdue", color: "badge-error", icon: AlertCircle };
		}

		return { label: "Pending", color: "badge-warning", icon: Clock };
	};

	const toggleOverheadDetails = (id) => {
		setExpandedOverhead(expandedOverhead === id ? null : id);
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
	};

	return (
		<div className="p-4">
			<PageHeader
				title="Monthly Overheads"
				description={
					<div className="flex items-center gap-2">
						<span>{format(new Date(`${selectedMonth}-01`), "MMMM yyyy")}</span>
						{stats.overdue > 0 && (
							<span className="badge badge-sm badge-error">
								฿{formatCurrency(stats.overdue)} Overdue
							</span>
						)}
					</div>
				}
				buttons={[
					{
						label: "Prev Month",
						icon: ChevronUp,
						onClick: () => handleMonthChange(-1),
						variant: "outline",
					},
					{
						label: "Next Month",
						icon: ChevronDown,
						onClick: () => handleMonthChange(1),
						variant: "outline",
					},
					{
						label: "Duplicate from Last Month",
						icon: Copy,
						onClick: () => setShowDuplicateModal(true),
						variant: "outline",
					},
					{
						label: "Add Overhead",
						icon: Plus,
						onClick: () => setShowAddForm(true),
						variant: "primary",
					},
				]}
			/>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<div className="stats shadow">
					<div className="stat">
						<div className="stat-title">Total Overheads</div>
						<div className="stat-value text-primary">
							฿{formatCurrency(stats.total)}
						</div>
						<div className="stat-desc">
							{format(new Date(`${selectedMonth}-01`), "MMMM yyyy")}
						</div>
					</div>
				</div>

				<div className="stats shadow">
					<div className="stat">
						<div className="stat-title">Paid</div>
						<div className="stat-value text-success">
							฿{formatCurrency(stats.paid)}
						</div>
						<div className="stat-desc">
							<div className="flex items-center gap-1">
								<CheckCircle className="w-4 h-4" />
								{stats.total > 0
									? ((stats.paid / stats.total) * 100).toFixed(1)
									: 0}
								% complete
							</div>
						</div>
					</div>
				</div>

				<div className="stats shadow">
					<div className="stat">
						<div className="stat-title">Pending</div>
						<div className="stat-value text-warning">
							฿{formatCurrency(stats.pending)}
						</div>
						<div className="stat-desc">
							<div className="flex items-center gap-1">
								<Clock className="w-4 h-4" />
								{stats.total > 0
									? ((stats.pending / stats.total) * 100).toFixed(1)
									: 0}
								% remaining
							</div>
						</div>
					</div>
				</div>

				<div className="stats shadow">
					<div className="stat">
						<div className="stat-title">Overdue</div>
						<div className="stat-value text-error">
							฿{formatCurrency(stats.overdue)}
						</div>
						<div className="stat-desc">
							<div className="flex items-center gap-1">
								<AlertCircle className="w-4 h-4" />
								{stats.overdue > 0 ? "Attention needed" : "All good"}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Overheads List */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					<h2 className="card-title mb-4">
						Overheads for {format(new Date(`${selectedMonth}-01`), "MMMM yyyy")}
					</h2>

					{loading ? (
						<div className="flex justify-center py-8">
							<span className="loading loading-spinner loading-lg"></span>
						</div>
					) : overheads.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-500 mb-4">
								No overheads recorded for this month
							</p>
							<button
								onClick={() => setShowDuplicateModal(true)}
								className="btn btn-primary">
								<Copy className="w-4 h-4 mr-2" />
								Copy from Last Month
							</button>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="table table-zebra">
								<thead>
									<tr>
										<th className="w-8"></th>
										<th>Description</th>
										<th>Category</th>
										<th>Amount</th>
										<th>Due Date</th>
										<th>Status</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{overheads.map((overhead) => {
										const status = getStatus(overhead);
										const Icon = status.icon;
										const isExpanded = expandedOverhead === overhead.id;

										return (
											<React.Fragment key={overhead.id}>
												<tr>
													<td>
														<button
															onClick={() => toggleOverheadDetails(overhead.id)}
															className="btn btn-ghost btn-xs">
															{isExpanded ? "▲" : "▼"}
														</button>
													</td>
													<td>
														<div>
															<p className="font-medium">
																{overhead.description}
															</p>
															{overhead.is_recurring && (
																<span className="badge badge-xs badge-info">
																	Recurring
																</span>
															)}
														</div>
													</td>
													<td>
														<span className="badge badge-outline">
															{overhead.category}
														</span>
													</td>
													<td className="font-bold text-error">
														฿{formatCurrency(overhead.amount)}
													</td>
													<td>
														{overhead.due_date
															? format(new Date(overhead.due_date), "MMM dd")
															: "N/A"}
													</td>
													<td>
														<span className={`badge ${status.color} gap-1`}>
															<Icon className="w-3 h-3" />
															{status.label}
														</span>
													</td>
													<td>
														<div className="flex gap-2">
															{overhead.paid_date ? (
																<button
																	onClick={() =>
																		handleMarkAsUnpaid(overhead.id)
																	}
																	className="btn btn-warning btn-sm"
																	title="Mark as Unpaid">
																	Undo
																</button>
															) : (
																<button
																	onClick={() => handleMarkAsPaid(overhead.id)}
																	className="btn btn-success btn-sm"
																	title="Mark as Paid">
																	Paid
																</button>
															)}
															<button
																onClick={() => handleDelete(overhead.id)}
																className="btn btn-error btn-sm"
																title="Delete">
																Delete
															</button>
														</div>
													</td>
												</tr>
												{isExpanded && (
													<tr>
														<td colSpan="7" className="bg-base-200">
															<div className="p-4">
																<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
																	<div>
																		<h4 className="font-semibold mb-2">
																			Details
																		</h4>
																		<p className="text-sm">
																			{overhead.notes || "No additional notes"}
																		</p>
																	</div>
																	<div>
																		<h4 className="font-semibold mb-2">
																			Payment Info
																		</h4>
																		<div className="space-y-1">
																			<p className="text-sm">
																				<span className="font-medium">
																					Amount:
																				</span>{" "}
																				฿{formatCurrency(overhead.amount)}
																			</p>
																			{overhead.due_date && (
																				<p className="text-sm">
																					<span className="font-medium">
																						Due Date:
																					</span>{" "}
																					{format(
																						new Date(overhead.due_date),
																						"MMMM dd, yyyy"
																					)}
																				</p>
																			)}
																			{overhead.paid_date && (
																				<p className="text-sm text-success">
																					<span className="font-medium">
																						Paid on:
																					</span>{" "}
																					{format(
																						new Date(overhead.paid_date),
																						"MMMM dd, yyyy"
																					)}
																				</p>
																			)}
																			<p className="text-sm">
																				<span className="font-medium">
																					Recurring:
																				</span>{" "}
																				{overhead.is_recurring ? "Yes" : "No"}
																			</p>
																		</div>
																	</div>
																</div>
															</div>
														</td>
													</tr>
												)}
											</React.Fragment>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Add Overhead Modal */}
			{showAddForm && (
				<div className="modal modal-open">
					<div className="modal-box max-w-2xl">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">Add Monthly Overhead</h3>
							<button
								onClick={() => {
									setShowAddForm(false);
									resetForm();
								}}
								className="btn btn-ghost btn-sm btn-circle">
								✕
							</button>
						</div>

						<form onSubmit={handleSubmit(onSubmit)}>
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="form-control">
										<label className="label">
											<span className="label-text">Description *</span>
										</label>
										<input
											type="text"
											{...register("description", {
												required: "Description is required",
											})}
											className="input input-bordered"
											placeholder="e.g., Rent, Electricity Bill"
										/>
										{errors.description && (
											<span className="label-text-alt text-error">
												{errors.description.message}
											</span>
										)}
									</div>

									<div className="form-control">
										<label className="label">
											<span className="label-text">Amount (฿) *</span>
										</label>
										<input
											type="number"
											step="0.01"
											min="0.01"
											{...register("amount", {
												required: "Amount is required",
												min: {
													value: 0.01,
													message: "Amount must be greater than 0",
												},
											})}
											className="input input-bordered"
										/>
										{errors.amount && (
											<span className="label-text-alt text-error">
												{errors.amount.message}
											</span>
										)}
									</div>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Category *</span>
									</label>
									<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
										{expenseCategories.map((category) => (
											<button
												key={category.value}
												type="button"
												onClick={() => setValue("category", category.value)}
												className={`btn btn-outline btn-sm ${
													selectedCategory === category.value
														? "btn-active"
														: ""
												}`}>
												{category.label}
											</button>
										))}
									</div>
									<input
										type="hidden"
										{...register("category", {
											required: "Category is required",
										})}
									/>
									{errors.category && (
										<span className="label-text-alt text-error">
											{errors.category.message}
										</span>
									)}
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="form-control">
										<label className="label">
											<span className="label-text">Due Date</span>
										</label>
										<input
											type="date"
											{...register("due_date")}
											className="input input-bordered"
										/>
									</div>

									<div className="form-control">
										<label className="label cursor-pointer justify-start gap-2">
											<input
												type="checkbox"
												{...register("is_recurring")}
												className="checkbox checkbox-primary"
											/>
											<span className="label-text">Recurring Expense</span>
										</label>
										<p className="text-xs text-gray-500 mt-1">
											Will be copied to next month automatically
										</p>
									</div>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Notes (Optional)</span>
									</label>
									<textarea
										{...register("notes")}
										className="textarea textarea-bordered"
										placeholder="Additional details..."
										rows="3"
									/>
								</div>
							</div>

							<div className="modal-action">
								<button
									type="button"
									onClick={() => {
										setShowAddForm(false);
										resetForm();
									}}
									className="btn btn-ghost">
									Cancel
								</button>
								<button type="submit" className="btn btn-primary">
									Save Overhead
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Duplicate Modal */}
			{showDuplicateModal && (
				<div className="modal modal-open">
					<div className="modal-box">
						<h3 className="font-bold text-lg mb-4">
							Duplicate Recurring Overheads
						</h3>
						<p className="mb-4">
							This will copy all recurring overheads from the previous month (
							{format(
								subMonths(new Date(`${selectedMonth}-01`), 1),
								"MMMM yyyy"
							)}
							) to the current month.
						</p>
						<p className="text-sm text-warning mb-4">
							Note: Only recurring overheads will be copied. Paid dates will be
							reset.
						</p>
						<div className="modal-action">
							<button
								onClick={() => setShowDuplicateModal(false)}
								className="btn btn-ghost">
								Cancel
							</button>
							<button
								onClick={handleDuplicateFromPreviousMonth}
								className="btn btn-primary">
								<Copy className="w-4 h-4 mr-2" />
								Duplicate from Last Month
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default MonthlyOverheads;
