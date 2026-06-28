import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import useEmployeeStore from "../../stores/employeeStore";
import DeleteConfirmationModal from "../common/DeleteConfirmationModal";
import { showToast } from "../../utils/toastUtils";
import ShalPhyokeDatePicker from "../common/ShalPhyokeDatePicker";

const EmployeeTab = () => {
	const { employees, loading, fetchEmployees, addEmployee, updateEmployee, deleteEmployee } =
		useEmployeeStore();

	const [showModal, setShowModal] = useState(false);
	const [editingEmployee, setEditingEmployee] = useState(null);
	const [deleteId, setDeleteId] = useState(null);
	const [showInactive, setShowInactive] = useState(false);

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [position, setPosition] = useState("");
	const [dailyRate, setDailyRate] = useState("");
	const [salary, setSalary] = useState("");
	const [hireDate, setHireDate] = useState(format(new Date(), "yyyy-MM-dd"));
	const [isActive, setIsActive] = useState(true);

	useEffect(() => {
		fetchEmployees();
	}, [fetchEmployees]);

	useEffect(() => {
		if (editingEmployee) {
			setName(editingEmployee.name || "");
			setPhone(editingEmployee.phone || "");
			setAddress(editingEmployee.address || "");
			setPosition(editingEmployee.position || "");
			setDailyRate(editingEmployee.daily_rate?.toString() || "");
			setSalary(editingEmployee.salary?.toString() || "");
			setHireDate(editingEmployee.hire_date || format(new Date(), "yyyy-MM-dd"));
			setIsActive(editingEmployee.is_active ?? true);
		} else {
			setName("");
			setPhone("");
			setAddress("");
			setPosition("");
			setDailyRate("");
			setSalary("");
			setHireDate(format(new Date(), "yyyy-MM-dd"));
			setIsActive(true);
		}
	}, [editingEmployee, showModal]);

	const resetModal = () => {
		setShowModal(false);
		setEditingEmployee(null);
	};

	const handleSave = async (e) => {
		e.preventDefault();
		if (!name.trim() || !phone.trim()) {
			showToast.error("Name and phone are required");
			return;
		}
		if (!dailyRate && !salary) {
			showToast.error("Enter at least daily rate or salary");
			return;
		}

		const payload = {
			name: name.trim(),
			phone: phone.trim(),
			address: address.trim() || null,
			position: position.trim() || null,
			daily_rate: dailyRate ? parseFloat(dailyRate) : null,
			salary: salary ? parseFloat(salary) : null,
			hire_date: hireDate,
			is_active: isActive,
		};

		const result = editingEmployee
			? await updateEmployee(editingEmployee.id, payload)
			: await addEmployee(payload);

		if (result.success) resetModal();
	};

	const handleDelete = async () => {
		if (!deleteId) return;
		await deleteEmployee(deleteId);
		setDeleteId(null);
	};

	const filtered = showInactive
		? employees
		: employees.filter((e) => e.is_active);

	const formatPay = (emp) => {
		const parts = [];
		if (emp.daily_rate) parts.push(`Daily: ${Number(emp.daily_rate).toLocaleString()}`);
		if (emp.salary) parts.push(`Salary: ${Number(emp.salary).toLocaleString()}`);
		return parts.join(" · ") || "—";
	};

	return (
		<>
			<div className="flex flex-wrap justify-between items-center gap-3 mb-4">
				<label className="label cursor-pointer gap-2">
					<input
						type="checkbox"
						className="checkbox checkbox-sm"
						checked={showInactive}
						onChange={(e) => setShowInactive(e.target.checked)}
					/>
					<span className="label-text">Show inactive</span>
				</label>
				<button
					className="btn btn-primary btn-sm"
					onClick={() => {
						setEditingEmployee(null);
						setShowModal(true);
					}}>
					<Plus className="w-4 h-4" />
					Add Employee
				</button>
			</div>

			{loading && employees.length === 0 ? (
				<div className="py-16 text-center">
					<span className="loading loading-spinner loading-lg text-primary"></span>
				</div>
			) : filtered.length > 0 ? (
				<div className="overflow-x-auto bg-base-100 rounded-lg border border-base-200">
					<table className="table table-zebra w-full">
						<thead>
							<tr>
								<th>Name</th>
								<th>Position</th>
								<th>Phone</th>
								<th>Pay</th>
								<th>Status</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((emp) => (
								<tr key={emp.id}>
									<td className="font-medium">{emp.name}</td>
									<td>{emp.position || "—"}</td>
									<td>{emp.phone}</td>
									<td className="text-sm">{formatPay(emp)}</td>
									<td>
										<span
											className={`badge badge-sm ${
												emp.is_active ? "badge-success" : "badge-ghost"
											}`}>
											{emp.is_active ? "Active" : "Inactive"}
										</span>
									</td>
									<td>
										<div className="flex gap-1">
											<button
												className="btn btn-ghost btn-xs btn-square"
												onClick={() => {
													setEditingEmployee(emp);
													setShowModal(true);
												}}>
												<Edit2 className="w-3.5 h-3.5" />
											</button>
											<button
												className="btn btn-ghost btn-xs btn-square text-error"
												onClick={() => setDeleteId(emp.id)}>
												<Trash2 className="w-3.5 h-3.5" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="py-16 text-center bg-base-200 rounded-xl border-2 border-dashed border-base-300">
					<p className="text-base-content/50">No employees yet. Add your first employee.</p>
				</div>
			)}

			{showModal && (
				<div className="modal modal-open">
					<div className="modal-box max-w-lg p-0 overflow-hidden bg-base-100 shadow-2xl rounded-2xl border border-base-200">
						{/* Header */}
						<div className="p-6 pb-4 border-b border-base-200 flex justify-between items-center bg-gradient-to-r from-primary/5 to-secondary/5">
							<div>
								<h3 className="font-bold text-xl text-base-content">
									{editingEmployee ? "Edit Employee" : "New Employee"}
								</h3>
								<p className="text-xs text-base-content/50 mt-0.5">Manage staff personal details & compensation</p>
							</div>
							<button className="btn btn-sm btn-circle btn-ghost" onClick={resetModal}>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Form */}
						<form onSubmit={handleSave} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
							
							{/* Section: Personal Info */}
							<div className="space-y-4">
								<h4 className="text-xs font-bold text-primary tracking-wider uppercase border-b border-base-200 pb-1">Personal & Position</h4>
								
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="form-control">
										<label className="label py-1">
											<span className="label-text font-bold text-sm text-base-content/80">Name *</span>
										</label>
										<input
											type="text"
											className="input input-bordered w-full focus:input-primary transition-all font-medium"
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder="Full Name"
											required
										/>
									</div>

									<div className="form-control">
										<label className="label py-1">
											<span className="label-text font-bold text-sm text-base-content/80">Phone *</span>
										</label>
										<input
											type="text"
											className="input input-bordered w-full focus:input-primary transition-all font-medium"
											value={phone}
											onChange={(e) => setPhone(e.target.value)}
											placeholder="Phone Number"
											required
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="form-control">
										<label className="label py-1">
											<span className="label-text font-bold text-sm text-base-content/80">Position</span>
										</label>
										<input
											type="text"
											className="input input-bordered w-full focus:input-primary transition-all"
											value={position}
											onChange={(e) => setPosition(e.target.value)}
											placeholder="e.g. Chef, Waiter, Manager"
										/>
									</div>

									<div className="form-control">
										<label className="label py-1">
											<span className="label-text font-bold text-sm text-base-content/80">Hire Date</span>
										</label>
										<ShalPhyokeDatePicker
											mode="date"
											value={new Date(hireDate + "T12:00:00")}
											onChange={(date) => setHireDate(format(date, "yyyy-MM-dd"))}
											className="w-full"
										/>
									</div>
								</div>

								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-bold text-sm text-base-content/80">Address</span>
									</label>
									<textarea
										className="textarea textarea-bordered w-full focus:textarea-primary transition-all"
										value={address}
										onChange={(e) => setAddress(e.target.value)}
										rows={2}
										placeholder="Residential Address"
									/>
								</div>
							</div>

							{/* Section: Compensation */}
							<div className="space-y-4 pt-2">
								<h4 className="text-xs font-bold text-primary tracking-wider uppercase border-b border-base-200 pb-1">Compensation Details</h4>
								<p className="text-[11px] text-base-content/50 mt-1">Specify at least one: Daily Rate or Salary. (All amounts in THB)</p>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="form-control">
										<label className="label py-1">
											<span className="label-text font-bold text-sm text-base-content/80">Daily Rate</span>
										</label>
										<div className="relative">
											<input
												type="number"
												min="0"
												step="0.01"
												className="input input-bordered w-full pr-12 focus:input-primary transition-all font-semibold text-success"
												value={dailyRate}
												onChange={(e) => setDailyRate(e.target.value)}
												placeholder="0.00"
											/>
											<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-base-content/40">THB</span>
										</div>
									</div>

									<div className="form-control">
										<label className="label py-1">
											<span className="label-text font-bold text-sm text-base-content/80">Monthly Salary</span>
										</label>
										<div className="relative">
											<input
												type="number"
												min="0"
												step="0.01"
												className="input input-bordered w-full pr-12 focus:input-primary transition-all font-semibold text-success"
												value={salary}
												onChange={(e) => setSalary(e.target.value)}
												placeholder="0.00"
											/>
											<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-base-content/40">THB</span>
										</div>
									</div>
								</div>
							</div>

							{/* Active Status */}
							<label className="label cursor-pointer justify-start gap-3 bg-base-200/50 p-4 rounded-xl border border-base-200 mt-2">
								<input
									type="checkbox"
									className="checkbox checkbox-primary"
									checked={isActive}
									onChange={(e) => setIsActive(e.target.checked)}
								/>
								<div>
									<span className="label-text font-bold text-base-content">Active Status</span>
									<p className="text-[10px] text-base-content/50 mt-0.5">Inactive employees are excluded from current month bonus distributions</p>
								</div>
							</label>
						</form>

						{/* Footer */}
						<div className="p-6 border-t border-base-200 flex justify-end gap-2 bg-base-50/50">
							<button type="button" className="btn btn-ghost" onClick={resetModal}>
								Cancel
							</button>
							<button type="submit" className="btn btn-primary px-6" onClick={handleSave}>
								{editingEmployee ? "Update Employee" : "Save Employee"}
							</button>
						</div>
					</div>
					<div className="modal-backdrop bg-black/60 backdrop-blur-xs" onClick={resetModal} />
				</div>
			)}

			<DeleteConfirmationModal
				isOpen={!!deleteId}
				onClose={() => setDeleteId(null)}
				onConfirm={handleDelete}
				title="Delete Employee?"
				message="This will permanently remove the employee and all related absence and bonus records."
			/>
		</>
	);
};

export default EmployeeTab;
