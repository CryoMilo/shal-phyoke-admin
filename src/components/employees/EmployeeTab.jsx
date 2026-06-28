import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import useEmployeeStore from "../../stores/employeeStore";
import DeleteConfirmationModal from "../common/DeleteConfirmationModal";
import { showToast } from "../../utils/toastUtils";

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
					<div className="modal-box max-w-lg p-0 overflow-hidden">
						<div className="p-6 pb-4 border-b border-base-200 flex justify-between items-center">
							<h3 className="font-bold text-xl">
								{editingEmployee ? "Edit Employee" : "New Employee"}
							</h3>
							<button className="btn btn-sm btn-circle btn-ghost" onClick={resetModal}>
								<X className="w-5 h-5" />
							</button>
						</div>

						<form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">Name *</span>
								</label>
								<input
									type="text"
									className="input input-bordered"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>

							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">Phone *</span>
								</label>
								<input
									type="text"
									className="input input-bordered"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									required
								/>
							</div>

							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">Position</span>
								</label>
								<input
									type="text"
									className="input input-bordered"
									value={position}
									onChange={(e) => setPosition(e.target.value)}
									placeholder="e.g. Chef, Waiter"
								/>
							</div>

							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">Address</span>
								</label>
								<textarea
									className="textarea textarea-bordered"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									rows={2}
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-bold text-sm">Daily Rate</span>
									</label>
									<input
										type="number"
										min="0"
										step="0.01"
										className="input input-bordered"
										value={dailyRate}
										onChange={(e) => setDailyRate(e.target.value)}
									/>
								</div>
								<div className="form-control">
									<label className="label py-1">
										<span className="label-text font-bold text-sm">Salary</span>
									</label>
									<input
										type="number"
										min="0"
										step="0.01"
										className="input input-bordered"
										value={salary}
										onChange={(e) => setSalary(e.target.value)}
									/>
								</div>
							</div>

							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">Hire Date</span>
								</label>
								<input
									type="date"
									className="input input-bordered"
									value={hireDate}
									onChange={(e) => setHireDate(e.target.value)}
								/>
							</div>

							<label className="label cursor-pointer justify-start gap-3 bg-base-200/50 p-3 rounded-lg">
								<input
									type="checkbox"
									className="checkbox checkbox-primary"
									checked={isActive}
									onChange={(e) => setIsActive(e.target.checked)}
								/>
								<span className="label-text font-bold">Active Employee</span>
							</label>
						</form>

						<div className="p-6 border-t border-base-200 flex justify-end gap-2">
							<button className="btn btn-ghost" onClick={resetModal}>
								Cancel
							</button>
							<button className="btn btn-primary" onClick={handleSave}>
								{editingEmployee ? "Update" : "Save"}
							</button>
						</div>
					</div>
					<div className="modal-backdrop bg-black/50" onClick={resetModal} />
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
