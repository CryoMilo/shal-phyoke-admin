import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Calendar, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { supabase } from "../services/supabase";

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

			setStats(stats);
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

	const getStatus = (overhead) => {
		const now = new Date();

		if (overhead.paid_date) {
			return { label: "Paid", color: "badge-success" };
		}

		if (overhead.due_date && new Date(overhead.due_date) < now) {
			return { label: "Overdue", color: "badge-error" };
		}

		return { label: "Pending", color: "badge-warning" };
	};

	return (
		<div className="p-4">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold">Monthly Overheads</h1>
					<p className="text-gray-600">Track recurring monthly expenses</p>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={() => handleMonthChange(-1)}
						className="btn btn-ghost btn-sm">
						Previous Month
					</button>
					<div className="flex items-center gap-2 bg-base-300 px-3 py-2 rounded-lg">
						<Calendar className="w-4 h-4" />
						<input
							type="month"
							value={selectedMonth}
							onChange={(e) => setSelectedMonth(e.target.value)}
							className="bg-transparent focus:outline-none"
						/>
					</div>
					<button
						onClick={() => handleMonthChange(1)}
						className="btn btn-ghost btn-sm">
						Next Month
					</button>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<div className="stats shadow">
					<div className="stat">
						<div className="stat-title">Total Overheads</div>
						<div className="stat-value text-primary">
							${stats.total.toFixed(2)}
						</div>
						<div className="stat-desc">
							For {format(new Date(`${selectedMonth}-01`), "MMMM yyyy")}
						</div>
					</div>
				</div>

				<div className="stats shadow">
					<div className="stat">
						<div className="stat-title">Paid</div>
						<div className="stat-value text-success">
							${stats.paid.toFixed(2)}
						</div>
						<div className="stat-desc">
							<div className="flex items-center gap-1">
								<CheckCircle className="w-4 h-4" />
								{stats.paid > 0
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
							${stats.pending.toFixed(2)}
						</div>
						<div className="stat-desc">
							<div className="flex items-center gap-1">
								<Clock className="w-4 h-4" />
								{stats.pending > 0
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
							${stats.overdue.toFixed(2)}
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
					<div className="flex justify-between items-center mb-4">
						<h2 className="card-title">
							Overheads for{" "}
							{format(new Date(`${selectedMonth}-01`), "MMMM yyyy")}
						</h2>
						<button className="btn btn-primary btn-sm">
							<Plus className="w-4 h-4 mr-2" />
							Add Overhead
						</button>
					</div>

					{loading ? (
						<div className="flex justify-center py-8">
							<span className="loading loading-spinner loading-lg"></span>
						</div>
					) : overheads.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-500">
								No overheads recorded for this month
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="table table-zebra">
								<thead>
									<tr>
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
										return (
											<tr key={overhead.id}>
												<td>
													<div>
														<p className="font-medium">
															{overhead.description}
														</p>
														{overhead.notes && (
															<p className="text-sm text-gray-600">
																{overhead.notes}
															</p>
														)}
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
													${parseFloat(overhead.amount).toFixed(2)}
												</td>
												<td>
													{overhead.due_date
														? format(new Date(overhead.due_date), "MMM dd")
														: "N/A"}
												</td>
												<td>
													<span className={`badge ${status.color}`}>
														{status.label}
													</span>
													{overhead.paid_date && (
														<p className="text-xs text-gray-500">
															Paid on{" "}
															{format(new Date(overhead.paid_date), "MMM dd")}
														</p>
													)}
												</td>
												<td>
													{!overhead.paid_date && (
														<button
															onClick={() => handleMarkAsPaid(overhead.id)}
															className="btn btn-success btn-sm">
															Mark as Paid
														</button>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* Recurring Overheads Summary */}
			<div className="card bg-base-100 shadow mt-6">
				<div className="card-body">
					<h2 className="card-title mb-4">Recurring Expenses Summary</h2>
					<div className="space-y-4">
						{overheads
							.filter((o) => o.is_recurring)
							.map((overhead) => (
								<div
									key={overhead.id}
									className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
									<div>
										<p className="font-medium">{overhead.description}</p>
										<p className="text-sm text-gray-600">
											Due on {format(new Date(overhead.due_date), "do MMMM")}
										</p>
									</div>
									<div className="flex items-center gap-4">
										<span className="text-xl font-bold">
											${parseFloat(overhead.amount).toFixed(2)}
										</span>
										{overhead.paid_date ? (
											<span className="badge badge-success">Paid</span>
										) : (
											<button
												onClick={() => handleMarkAsPaid(overhead.id)}
												className="btn btn-success btn-sm">
												Mark Paid
											</button>
										)}
									</div>
								</div>
							))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default MonthlyOverheads;
