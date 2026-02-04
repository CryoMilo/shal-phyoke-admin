import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Edit, Save } from "lucide-react";
import { supabase } from "../services/supabase";

const expenseCategories = [
	{ value: "ingredients", label: "Ingredients", color: "bg-green-500" },
	{ value: "utilities", label: "Utilities", color: "bg-blue-500" },
	{ value: "rent", label: "Rent", color: "bg-red-500" },
	{ value: "salaries", label: "Salaries", color: "bg-purple-500" },
	{ value: "equipment", label: "Equipment", color: "bg-yellow-500" },
	{ value: "packaging", label: "Packaging", color: "bg-pink-500" },
	{ value: "delivery", label: "Delivery", color: "bg-indigo-500" },
	{ value: "marketing", label: "Marketing", color: "bg-teal-500" },
	{ value: "maintenance", label: "Maintenance", color: "bg-orange-500" },
	{ value: "other", label: "Other", color: "bg-gray-500" },
];

const DailyExpenses = () => {
	const [expenses, setExpenses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [selectedDate, setSelectedDate] = useState(
		format(new Date(), "yyyy-MM-dd")
	);
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [total, setTotal] = useState(0);

	const [formData, setFormData] = useState({
		date: format(new Date(), "yyyy-MM-dd"),
		category: "ingredients",
		description: "",
		amount: "",
		payment_method: "cash",
		receipt_url: "",
		notes: "",
	});

	const fetchExpenses = async () => {
		setLoading(true);
		try {
			let query = supabase
				.from("daily_expenses")
				.select("*")
				.order("date", { ascending: false });

			if (selectedDate) {
				query = query.eq("date", selectedDate);
			}

			if (selectedCategory !== "all") {
				query = query.eq("category", selectedCategory);
			}

			const { data, error } = await query;

			if (error) throw error;

			setExpenses(data || []);

			// Calculate total
			const sum =
				data?.reduce((acc, expense) => acc + parseFloat(expense.amount), 0) ||
				0;
			setTotal(sum);
		} catch (error) {
			console.error("Error fetching expenses:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchExpenses();
	}, [selectedDate, selectedCategory]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const expenseData = {
				...formData,
				amount: parseFloat(formData.amount),
				recorded_by: (await supabase.auth.getUser()).data.user?.id,
			};

			if (editingId) {
				const { error } = await supabase
					.from("daily_expenses")
					.update(expenseData)
					.eq("id", editingId);

				if (error) throw error;
				setEditingId(null);
			} else {
				const { error } = await supabase
					.from("daily_expenses")
					.insert([expenseData]);

				if (error) throw error;
			}

			setFormData({
				date: format(new Date(), "yyyy-MM-dd"),
				category: "ingredients",
				description: "",
				amount: "",
				payment_method: "cash",
				receipt_url: "",
				notes: "",
			});
			setShowForm(false);
			fetchExpenses();
		} catch (error) {
			console.error("Error saving expense:", error);
		}
	};

	const handleEdit = (expense) => {
		setFormData({
			date: expense.date,
			category: expense.category,
			description: expense.description,
			amount: expense.amount,
			payment_method: expense.payment_method,
			receipt_url: expense.receipt_url || "",
			notes: expense.notes || "",
		});
		setEditingId(expense.id);
		setShowForm(true);
	};

	const handleDelete = async (id) => {
		if (!confirm("Are you sure you want to delete this expense?")) return;

		try {
			const { error } = await supabase
				.from("daily_expenses")
				.delete()
				.eq("id", id);

			if (error) throw error;
			fetchExpenses();
		} catch (error) {
			console.error("Error deleting expense:", error);
		}
	};

	const getCategoryLabel = (categoryValue) => {
		const category = expenseCategories.find((c) => c.value === categoryValue);
		return category ? category.label : categoryValue;
	};

	const getCategoryColor = (categoryValue) => {
		const category = expenseCategories.find((c) => c.value === categoryValue);
		return category ? category.color : "bg-gray-500";
	};

	return (
		<div className="p-4">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold">Daily Expenses</h1>
					<p className="text-gray-600">Track daily operational expenses</p>
				</div>
				<div className="flex items-center gap-2">
					<button onClick={() => setShowForm(true)} className="btn btn-primary">
						<Plus className="w-4 h-4 mr-2" />
						Add Expense
					</button>
				</div>
			</div>

			{/* Filters */}
			<div className="card bg-base-100 shadow mb-6">
				<div className="card-body">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text">Date</span>
							</label>
							<input
								type="date"
								value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								className="input input-bordered"
							/>
						</div>
						<div className="form-control">
							<label className="label">
								<span className="label-text">Category</span>
							</label>
							<select
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
								className="select select-bordered">
								<option value="all">All Categories</option>
								{expenseCategories.map((category) => (
									<option key={category.value} value={category.value}>
										{category.label}
									</option>
								))}
							</select>
						</div>
						<div className="form-control">
							<label className="label">
								<span className="label-text">Total</span>
							</label>
							<div className="text-2xl font-bold text-error">
								${total.toFixed(2)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Expense Form Modal */}
			{showForm && (
				<div className="modal modal-open">
					<div className="modal-box">
						<h3 className="font-bold text-lg mb-4">
							{editingId ? "Edit Expense" : "Add New Expense"}
						</h3>
						<form onSubmit={handleSubmit}>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="form-control">
										<label className="label">
											<span className="label-text">Date</span>
										</label>
										<input
											type="date"
											value={formData.date}
											onChange={(e) =>
												setFormData({ ...formData, date: e.target.value })
											}
											className="input input-bordered"
											required
										/>
									</div>
									<div className="form-control">
										<label className="label">
											<span className="label-text">Amount ($)</span>
										</label>
										<input
											type="number"
											step="0.01"
											value={formData.amount}
											onChange={(e) =>
												setFormData({ ...formData, amount: e.target.value })
											}
											className="input input-bordered"
											required
										/>
									</div>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Category</span>
									</label>
									<select
										value={formData.category}
										onChange={(e) =>
											setFormData({ ...formData, category: e.target.value })
										}
										className="select select-bordered"
										required>
										{expenseCategories.map((category) => (
											<option key={category.value} value={category.value}>
												{category.label}
											</option>
										))}
									</select>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Description</span>
									</label>
									<input
										type="text"
										value={formData.description}
										onChange={(e) =>
											setFormData({ ...formData, description: e.target.value })
										}
										className="input input-bordered"
										placeholder="What was this expense for?"
										required
									/>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Payment Method</span>
									</label>
									<select
										value={formData.payment_method}
										onChange={(e) =>
											setFormData({
												...formData,
												payment_method: e.target.value,
											})
										}
										className="select select-bordered">
										<option value="cash">Cash</option>
										<option value="card">Card</option>
										<option value="online">Online</option>
									</select>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Notes (Optional)</span>
									</label>
									<textarea
										value={formData.notes}
										onChange={(e) =>
											setFormData({ ...formData, notes: e.target.value })
										}
										className="textarea textarea-bordered"
										placeholder="Additional details..."
									/>
								</div>

								<div className="form-control">
									<label className="label">
										<span className="label-text">Receipt URL (Optional)</span>
									</label>
									<input
										type="text"
										value={formData.receipt_url}
										onChange={(e) =>
											setFormData({ ...formData, receipt_url: e.target.value })
										}
										className="input input-bordered"
										placeholder="Link to receipt image"
									/>
								</div>
							</div>

							<div className="modal-action">
								<button
									type="button"
									onClick={() => {
										setShowForm(false);
										setEditingId(null);
									}}
									className="btn btn-ghost">
									Cancel
								</button>
								<button type="submit" className="btn btn-primary">
									<Save className="w-4 h-4 mr-2" />
									{editingId ? "Update" : "Save"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Expenses Table */}
			<div className="card bg-base-100 shadow">
				<div className="card-body">
					{loading ? (
						<div className="flex justify-center py-8">
							<span className="loading loading-spinner loading-lg"></span>
						</div>
					) : expenses.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-500">
								No expenses recorded for this date
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="table table-zebra">
								<thead>
									<tr>
										<th>Date</th>
										<th>Category</th>
										<th>Description</th>
										<th>Amount</th>
										<th>Payment Method</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{expenses.map((expense) => (
										<tr key={expense.id}>
											<td>{format(new Date(expense.date), "MMM dd, yyyy")}</td>
											<td>
												<span
													className={`badge ${getCategoryColor(expense.category)} text-white`}>
													{getCategoryLabel(expense.category)}
												</span>
											</td>
											<td>
												<div>
													<p className="font-medium">{expense.description}</p>
													{expense.notes && (
														<p className="text-sm text-gray-600">
															{expense.notes}
														</p>
													)}
												</div>
											</td>
											<td className="font-bold text-error">
												${parseFloat(expense.amount).toFixed(2)}
											</td>
											<td>
												<span className="badge badge-outline">
													{expense.payment_method}
												</span>
											</td>
											<td>
												<div className="flex gap-2">
													<button
														onClick={() => handleEdit(expense)}
														className="btn btn-ghost btn-xs"
														title="Edit">
														<Edit className="w-4 h-4" />
													</button>
													<button
														onClick={() => handleDelete(expense.id)}
														className="btn btn-ghost btn-xs text-error"
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
					)}
				</div>
			</div>

			{/* Category Breakdown */}
			<div className="mt-6">
				<h2 className="text-lg font-bold mb-4">Category Breakdown</h2>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					{expenseCategories.map((category) => {
						const categoryTotal = expenses
							.filter((e) => e.category === category.value)
							.reduce((sum, e) => sum + parseFloat(e.amount), 0);

						if (categoryTotal === 0) return null;

						const percentage = (categoryTotal / total) * 100;

						return (
							<div key={category.value} className="card bg-base-100 shadow">
								<div className="card-body p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm text-gray-600">{category.label}</p>
											<p className="text-xl font-bold">
												${categoryTotal.toFixed(2)}
											</p>
										</div>
										<div
											className={`w-3 h-3 rounded-full ${category.color}`}></div>
									</div>
									<div className="mt-2">
										<div className="w-full bg-gray-200 rounded-full h-2">
											<div
												className={`h-2 rounded-full ${category.color}`}
												style={{ width: `${percentage}%` }}></div>
										</div>
										<p className="text-xs text-gray-500 mt-1">
											{percentage.toFixed(1)}% of total
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default DailyExpenses;
