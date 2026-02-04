import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "../services/supabase";

// Expense Categories - matching your enum
const expenseCategories = [
	{ value: "ingredients", label: "Ingredients", color: "bg-green-500" },
	{ value: "utilities", label: "Utilities", color: "bg-blue-500" },
	{ value: "equipment", label: "Equipment", color: "bg-yellow-500" },
	{ value: "packaging", label: "Packaging", color: "bg-pink-500" },
	{ value: "delivery", label: "Delivery", color: "bg-indigo-500" },
	{ value: "marketing", label: "Marketing", color: "bg-teal-500" },
	{ value: "maintenance", label: "Maintenance", color: "bg-orange-500" },
	{ value: "other", label: "Other", color: "bg-gray-500" },
];

// Paid By options
const paidByOptions = [
	{ value: "cash_drawer", label: "Cash Drawer", color: "badge-primary" },
	{ value: "oak", label: "Oak", color: "badge-secondary" },
	{ value: "ei", label: "Ei", color: "badge-accent" },
	{ value: "bank", label: "Bank Account", color: "badge-info" },
	{ value: "other", label: "Other", color: "badge-neutral" },
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
	// eslint-disable-next-line no-unused-vars
	const [otherCategoryInput, setOtherCategoryInput] = useState("");

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm({
		defaultValues: {
			date: format(new Date(), "yyyy-MM-dd"),
			category: "ingredients",
			description: "",
			amount: "",
			paid_by: "cash_drawer",
			notes: "",
			other_category: "",
		},
	});

	const selectedCategoryWatch = watch("category");

	const fetchExpenses = async () => {
		setLoading(true);
		try {
			let query = supabase
				.from("daily_expenses")
				.select("*")
				.order("created_at", { ascending: false });

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

	const onSubmit = async (data) => {
		try {
			const expenseData = {
				date: data.date,
				category:
					data.category === "other" && data.other_category
						? data.other_category
						: data.category,
				description: data.description || "No description provided",
				amount: parseFloat(data.amount),
				paid_by: data.paid_by,
				notes: data.notes,
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

			resetForm();
			setShowForm(false);
			fetchExpenses();
		} catch (error) {
			console.error("Error saving expense:", error);
		}
	};

	const resetForm = () => {
		reset({
			date: format(new Date(), "yyyy-MM-dd"),
			category: "ingredients",
			description: "",
			amount: "",
			paid_by: "cash_drawer",
			notes: "",
			other_category: "",
		});
		setOtherCategoryInput("");
	};

	const handleEdit = (expense) => {
		const category = expenseCategories.find((c) => c.value === expense.category)
			? expense.category
			: "other";
		const otherCategory = expenseCategories.find(
			(c) => c.value === expense.category
		)
			? ""
			: expense.category;

		reset({
			date: expense.date,
			category: category,
			description: expense.description,
			amount: expense.amount,
			paid_by: expense.paid_by || "cash_drawer",
			notes: expense.notes || "",
			other_category: otherCategory,
		});

		if (category === "other") {
			setOtherCategoryInput(otherCategory);
		}

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

	const getPaidByLabel = (paidByValue) => {
		const paidBy = paidByOptions.find((p) => p.value === paidByValue);
		return paidBy ? paidBy.label : paidByValue;
	};

	const getPaidByColor = (paidByValue) => {
		const paidBy = paidByOptions.find((p) => p.value === paidByValue);
		return paidBy ? paidBy.color : "badge-neutral";
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
					<button
						onClick={() => {
							resetForm();
							setShowForm(true);
						}}
						className="btn btn-primary">
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
					<div className="modal-box max-w-2xl">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg">
								{editingId ? "Edit Expense" : "Add New Expense"}
							</h3>
							<button
								onClick={() => {
									setShowForm(false);
									setEditingId(null);
									resetForm();
								}}
								className="btn btn-ghost btn-sm btn-circle">
								<X className="w-4 h-4" />
							</button>
						</div>

						<form onSubmit={handleSubmit(onSubmit)}>
							<div className="space-y-4">
								{/* Date and Amount */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="form-control">
										<label className="label">
											<span className="label-text">Date *</span>
										</label>
										<input
											type="date"
											{...register("date", { required: "Date is required" })}
											className="input input-bordered"
										/>
										{errors.date && (
											<span className="label-text-alt text-error">
												{errors.date.message}
											</span>
										)}
									</div>

									<div className="form-control">
										<label className="label">
											<span className="label-text">Amount ($) *</span>
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

								{/* Category Selection */}
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
													selectedCategoryWatch === category.value
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

									{/* Other Category Input */}
									{selectedCategoryWatch === "other" && (
										<div className="mt-2">
											<label className="label">
												<span className="label-text">Specify Category *</span>
											</label>
											<input
												type="text"
												{...register("other_category", {
													required: "Please specify the category",
												})}
												className="input input-bordered w-full"
												placeholder="Enter custom category..."
											/>
											{errors.other_category && (
												<span className="label-text-alt text-error">
													{errors.other_category.message}
												</span>
											)}
										</div>
									)}
								</div>

								{/* Description (Optional) */}
								<div className="form-control">
									<label className="label">
										<span className="label-text">Description (Optional)</span>
									</label>
									<input
										type="text"
										{...register("description")}
										className="input input-bordered"
										placeholder="What was this expense for?"
									/>
								</div>

								{/* Paid By Selection */}
								<div className="form-control">
									<label className="label">
										<span className="label-text">Paid By *</span>
									</label>
									<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
										{paidByOptions.map((option) => (
											<button
												key={option.value}
												type="button"
												onClick={() => setValue("paid_by", option.value)}
												className={`btn btn-outline btn-sm ${
													watch("paid_by") === option.value ? "btn-active" : ""
												}`}>
												{option.label}
											</button>
										))}
									</div>
									<input
										type="hidden"
										{...register("paid_by", {
											required: "Paid by is required",
										})}
									/>
									{errors.paid_by && (
										<span className="label-text-alt text-error">
											{errors.paid_by.message}
										</span>
									)}
								</div>

								{/* Notes (Optional) */}
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
										setShowForm(false);
										setEditingId(null);
										resetForm();
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
										<th>Paid By</th>
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
													<p className="font-medium">
														{expense.description || "No description"}
													</p>
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
												<span
													className={`badge ${getPaidByColor(expense.paid_by)}`}>
													{getPaidByLabel(expense.paid_by)}
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
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
