import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "../services/supabase";
import { PageHeader } from "../components/common/PageHeader";
import { showToast } from "../utils/toastUtils";
import DeleteConfirmationModal from "../components/common/DeleteConfirmationModal";
import BangkokDatePicker from "../components/common/BangkokDatePicker";
import { toBangkokDateString } from "../utils/dateUtils";
import Numpad from "../components/common/Numpad";

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
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [total, setTotal] = useState(0);
	// eslint-disable-next-line no-unused-vars
	const [otherCategoryInput, setOtherCategoryInput] = useState("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState(null);
	const [mostUsedCategories, setMostUsedCategories] = useState([]);

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm({
		defaultValues: {
			category: "",
			amount: "",
			paid_by: "cash_drawer",
			notes: "",
			other_category: "",
		},
	});

	const selectedCategoryWatch = watch("category");
	const amountWatch = watch("amount") || "";

	const fetchMostUsedCategories = async () => {
		try {
			const { data, error } = await supabase
				.from("daily_expenses")
				.select("category");
			if (error) throw error;

			const counts = {};
			data?.forEach((item) => {
				if (item.category) {
					const cat = item.category.trim();
					counts[cat] = (counts[cat] || 0) + 1;
				}
			});

			// Sort by frequency and get top 10
			const sorted = Object.entries(counts)
				.sort((a, b) => b[1] - a[1])
				.map(([category]) => category)
				.slice(0, 10);

			setMostUsedCategories(sorted);
		} catch (error) {
			console.error("Error fetching most used categories:", error);
		}
	};

	const fetchExpenses = async () => {
		setLoading(true);
		try {
			let query = supabase
				.from("daily_expenses")
				.select("*")
				.order("created_at", { ascending: false });

			if (selectedDate) {
				query = query.eq("date", toBangkokDateString(selectedDate));
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

	useEffect(() => {
		fetchMostUsedCategories();
	}, []);

	useEffect(() => {
		if (showForm) {
			fetchMostUsedCategories();
		}
	}, [showForm]);

	const onSubmit = async (data) => {
		try {
			const expenseData = {
				date: toBangkokDateString(selectedDate),
				category:
					data.category === "other" && data.other_category
						? data.other_category
						: data.category,
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
				showToast.success("Expense updated successfully");
			} else {
				const { error } = await supabase
					.from("daily_expenses")
					.insert([expenseData]);

				if (error) throw error;
				showToast.success("Expense added successfully");
			}

			resetForm();
			setShowForm(false);
			fetchExpenses();
			fetchMostUsedCategories();
		} catch (error) {
			console.error("Error saving expense:", error);
			showToast.error("Failed to save expense");
		}
	};

	const resetForm = () => {
		reset({
			category: mostUsedCategories[0] || "other",
			amount: "",
			paid_by: "cash_drawer",
			notes: "",
			other_category: "",
		});
		setOtherCategoryInput("");
	};

	const handleEdit = (expense) => {
		const isMostUsed = mostUsedCategories.includes(expense.category);
		const category = isMostUsed ? expense.category : "other";
		const otherCategory = isMostUsed ? "" : expense.category;

		reset({
			category: category,
			amount: expense.amount.toString(),
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

	const handleDelete = (id) => {
		setDeleteTargetId(id);
		setShowDeleteConfirm(true);
	};

	const confirmDelete = async () => {
		try {
			const { error } = await supabase
				.from("daily_expenses")
				.delete()
				.eq("id", deleteTargetId);

			if (error) throw error;
			showToast.success("Expense deleted successfully");
			fetchExpenses();
			fetchMostUsedCategories();
		} catch (error) {
			console.error("Error deleting expense:", error);
			showToast.error("Failed to delete expense");
		} finally {
			setShowDeleteConfirm(false);
			setDeleteTargetId(null);
		}
	};

	const getCategoryLabel = (categoryValue) => {
		if (!categoryValue) return "";
		return categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1);
	};

	const getCategoryColor = (categoryValue) => {
		const colors = [
			"bg-green-500",
			"bg-blue-500",
			"bg-yellow-500",
			"bg-pink-500",
			"bg-indigo-500",
			"bg-teal-500",
			"bg-orange-500",
			"bg-purple-500",
			"bg-cyan-500",
			"bg-rose-500"
		];
		const index = mostUsedCategories.indexOf(categoryValue);
		if (index !== -1 && index < colors.length) {
			return colors[index];
		}
		// Fallback hash color
		let hash = 0;
		for (let i = 0; i < categoryValue.length; i++) {
			hash = categoryValue.charCodeAt(i) + ((hash << 5) - hash);
		}
		const fallbackIndex = Math.abs(hash) % colors.length;
		return colors[fallbackIndex];
	};

	const getPaidByLabel = (paidByValue) => {
		const paidBy = paidByOptions.find((p) => p.value === paidByValue);
		return paidBy ? paidBy.label : paidByValue;
	};

	const getPaidByColor = (paidByValue) => {
		const paidBy = paidByOptions.find((p) => p.value === paidByValue);
		return paidBy ? paidBy.color : "badge-neutral";
	};

	const handleNumpadChange = useCallback((newValue) => {
		setValue("amount", newValue, { 
		  shouldValidate: false,
		  shouldDirty: true 
		});
	  }, [setValue]);

	return (
		<div className="p-4">
			{/* Header */}
			<PageHeader
				title="Daily Expenses"
				description="Track daily operational expenses"
				buttons={[
					{
						label: "Add Expense",
						icon: Plus,
						onClick: () => {
							resetForm();
							setShowForm(true);
						},
						variant: "primary",
					},
				]}
			/>

			{/* Filters */}
			<div className="card bg-base-100 shadow mb-6">
				<div className="card-body">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
						<div className="form-control">
							<BangkokDatePicker
								value={selectedDate}
								onChange={setSelectedDate}
								className="w-full"
							/>
						</div>
						<div className="form-control">
							<select
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
								className="select select-bordered w-full">
								<option value="all">All Categories</option>
								{mostUsedCategories.map((cat) => (
									<option key={cat} value={cat}>
										{cat.charAt(0).toUpperCase() + cat.slice(1)}
									</option>
								))}
							</select>
						</div>
						<div className="form-control">
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold text-gray-500">Total:</span>
								<span className="text-2xl font-bold text-error">
									${total.toFixed(2)}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>			{/* Expense Form Modal */}
			{showForm && (
				<div className="modal modal-open overflow-y-auto p-4 items-start md:items-center">
					<div className="modal-box max-w-4xl w-11/12 max-h-[90vh] overflow-y-auto">
						<div className="flex justify-between items-center mb-4">
							<h3 className="font-bold text-lg text-base-content">
								{editingId ? "Edit Expense" : "Add New Expense"}
							</h3>
							<button
								onClick={() => {
									setShowForm(false);
									setEditingId(null);
									resetForm();
								}}
								className="btn btn-ghost btn-sm btn-circle text-base-content">
								<X className="w-4 h-4" />
							</button>
						</div>

						<form onSubmit={handleSubmit(onSubmit)}>
							<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
								{/* Left Column - Details */}
								<div className="lg:col-span-7 space-y-4">
									{/* Category Selection */}
									<div className="form-control">
										<label className="label">
											<span className="label-text font-semibold">Category *</span>
										</label>
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
											{mostUsedCategories.map((cat) => (
												<button
													key={cat}
													type="button"
													onClick={() => {
														setValue("category", cat);
														setValue("other_category", "");
													}}
													className={`btn btn-outline btn-sm ${
														selectedCategoryWatch === cat
															? "btn-active"
															: ""
													}`}>
													{cat.charAt(0).toUpperCase() + cat.slice(1)}
												</button>
											))}
											<button
												type="button"
												onClick={() => {
													setValue("category", "other");
												}}
												className={`btn btn-outline btn-sm ${
													selectedCategoryWatch === "other"
														? "btn-active"
														: ""
												}`}>
												Other
											</button>
										</div>
										<input
											type="hidden"
											{...register("category", {
												required: "Category is required",
											})}
										/>
										{errors.category && (
											<span className="label-text-alt text-error block mt-1">
												{errors.category.message}
											</span>
										)}

										{/* Other Category Input */}
										{selectedCategoryWatch === "other" && (
											<div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
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
													<span className="label-text-alt text-error block mt-1">
														{errors.other_category.message}
													</span>
												)}
											</div>
										)}
									</div>

									{/* Paid By Selection */}
									<div className="form-control">
										<label className="label">
											<span className="label-text font-semibold">Paid By *</span>
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
											<span className="label-text-alt text-error block mt-1">
												{errors.paid_by.message}
											</span>
										)}
									</div>

									{/* Notes (Optional) */}
									<div className="form-control w-full block mt-2">
										<label className="label block pb-1">
											<span className="label-text font-semibold text-base-content/85 block">Notes (Optional)</span>
										</label>
										<textarea
											{...register("notes")}
											className="textarea textarea-bordered w-full text-base min-h-[90px]"
											placeholder="Additional details..."
											rows="3"
										/>
									</div>
								</div>

								{/* Right Column - Numpad and Amount */}
								<div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-base-300 pt-6 lg:pt-0 lg:pl-6">
									<div className="form-control mb-4">
										<label className="label">
											<span className="label-text font-bold text-base">Amount</span>
										</label>
										<input
											type="text"
											readOnly
											inputMode="none"
											placeholder="0.00"
											{...register("amount", {
												required: "Amount is required",
												validate: (v) => parseFloat(v) > 0 || "Amount must be greater than 0",
											})}
											className="input input-bordered text-right text-3xl font-bold font-mono h-16 w-full bg-base-200 border-2"
										/>
										{errors.amount && (
											<span className="label-text-alt text-error mt-1 block">
												{errors.amount.message}
											</span>
										)}
									</div>

									<Numpad
  value={amountWatch}
  onChange={handleNumpadChange}
  className="mt-auto"
/>
								</div>
							</div>

							<div className="modal-action mt-6 border-t border-base-200 pt-4">
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
										<th>Notes</th>
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
													className={`badge ${getCategoryColor(
														expense.category
													)} text-white`}>
													{getCategoryLabel(expense.category)}
												</span>
											</td>
											<td>
												<span className="text-sm text-gray-500">
													{expense.notes || "-"}
												</span>
											</td>
											<td className="font-bold text-error">
												${parseFloat(expense.amount).toFixed(2)}
											</td>
											<td>
												<span
													className={`badge ${getPaidByColor(
														expense.paid_by
													)}`}>
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
					{Array.from(new Set(expenses.map((e) => e.category))).map((cat) => {
						const categoryTotal = expenses
							.filter((e) => e.category === cat)
							.reduce((sum, e) => sum + parseFloat(e.amount), 0);

						if (categoryTotal === 0) return null;

						const percentage = (categoryTotal / total) * 100;
						const color = getCategoryColor(cat);

						return (
							<div key={cat} className="card bg-base-100 shadow">
								<div className="card-body p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm text-gray-600">
												{cat.charAt(0).toUpperCase() + cat.slice(1)}
											</p>
											<p className="text-xl font-bold">
												${categoryTotal.toFixed(2)}
											</p>
										</div>
										<div
											className={`w-3 h-3 rounded-full ${color}`}></div>
									</div>
									<div className="mt-2">
										<div className="w-full bg-gray-200 rounded-full h-2">
											<div
												className={`h-2 rounded-full ${color}`}
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

			<DeleteConfirmationModal
				isOpen={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={confirmDelete}
				title="Delete Expense"
				message="Are you sure you want to delete this expense? This action cannot be undone."
			/>
		</div>
	);
};
export default DailyExpenses;
