import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import useEmployeeStore from "../../stores/employeeStore";
import useEmployeeAbsenceStore from "../../stores/employeeAbsenceStore";
import DeleteConfirmationModal from "../common/DeleteConfirmationModal";
import { showToast } from "../../utils/toastUtils";
// import { sumAbsencePoints } from "../../utils/bonusUtils";

const AbsenceTab = () => {
	const { employees, fetchEmployees } = useEmployeeStore();
	const { absences, loading, fetchAbsences, addAbsence, deleteAbsence } =
		useEmployeeAbsenceStore();

	const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
	const [showModal, setShowModal] = useState(false);
	const [deleteId, setDeleteId] = useState(null);

	const [employeeId, setEmployeeId] = useState("");
	const [absenceDate, setAbsenceDate] = useState(format(new Date(), "yyyy-MM-dd"));
	const [points, setPoints] = useState("1.0");
	const [reason, setReason] = useState("");

	useEffect(() => {
		fetchEmployees();
	}, [fetchEmployees]);

	useEffect(() => {
		fetchAbsences(selectedMonth);
	}, [selectedMonth, fetchAbsences]);

	const activeEmployees = employees.filter((e) => e.is_active);

	const resetModal = () => {
		setShowModal(false);
		setEmployeeId("");
		setAbsenceDate(format(new Date(), "yyyy-MM-dd"));
		setPoints("1.0");
		setReason("");
	};

	const handleSave = async (e) => {
		e.preventDefault();
		if (!employeeId) {
			showToast.error("Select an employee");
			return;
		}

		const result = await addAbsence({
			employee_id: employeeId,
			absence_date: absenceDate,
			points: parseFloat(points),
			reason: reason.trim() || null,
		});

		if (result.success) {
			resetModal();
			fetchAbsences(selectedMonth);
		}
	};

	const handleDelete = async () => {
		if (!deleteId) return;
		await deleteAbsence(deleteId);
		setDeleteId(null);
	};

	const isSunday = (dateStr) => {
		const d = new Date(dateStr + "T12:00:00");
		return d.getDay() === 0;
	};

	const pointsByEmployee = absences.reduce((acc, a) => {
		if (isSunday(a.absence_date)) return acc;
		const id = a.employee_id;
		if (!acc[id]) acc[id] = [];
		acc[id].push(a);
		return acc;
	}, {});

	return (
		<>
			<div className="flex flex-wrap justify-between items-center gap-3 mb-4">
				<input
					type="month"
					className="input input-bordered input-sm"
					value={selectedMonth}
					onChange={(e) => setSelectedMonth(e.target.value)}
				/>
				<button
					className="btn btn-primary btn-sm"
					onClick={() => setShowModal(true)}
					disabled={activeEmployees.length === 0}>
					<Plus className="w-4 h-4" />
					Record Absence
				</button>
			</div>

			{Object.keys(pointsByEmployee).length > 0 && (
				<div className="flex flex-wrap gap-2 mb-4">
					{Object.entries(pointsByEmployee).map(([empId, empAbsences]) => {
						const emp = employees.find((e) => e.id === empId);
						const total = sumAbsencePoints(empAbsences);
						return (
							<span key={empId} className="badge badge-outline badge-lg">
								{emp?.name || "Unknown"}: {total} pts
							</span>
						);
					})}
				</div>
			)}

			{loading && absences.length === 0 ? (
				<div className="py-16 text-center">
					<span className="loading loading-spinner loading-lg text-primary"></span>
				</div>
			) : absences.length > 0 ? (
				<div className="overflow-x-auto bg-base-100 rounded-lg border border-base-200">
					<table className="table table-zebra w-full">
						<thead>
							<tr>
								<th>Date</th>
								<th>Employee</th>
								<th>Points</th>
								<th>Reason</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{absences.map((a) => (
								<tr key={a.id} className={isSunday(a.absence_date) ? "opacity-50" : ""}>
									<td>
										{format(new Date(a.absence_date + "T12:00:00"), "MMM d, yyyy")}
										{isSunday(a.absence_date) && (
											<span className="badge badge-xs ml-1">Sun</span>
										)}
									</td>
									<td>{a.employee?.name || "—"}</td>
									<td>{a.points}</td>
									<td className="text-sm">{a.reason || "—"}</td>
									<td>
										<button
											className="btn btn-ghost btn-xs btn-square text-error"
											onClick={() => setDeleteId(a.id)}>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="py-16 text-center bg-base-200 rounded-xl border-2 border-dashed border-base-300">
					<p className="text-base-content/50">No absences recorded for this month.</p>
				</div>
			)}

			{showModal && (
				<div className="modal modal-open">
					<div className="modal-box max-w-md p-0 overflow-hidden">
						<div className="p-6 pb-4 border-b border-base-200 flex justify-between items-center">
							<h3 className="font-bold text-xl">Record Absence</h3>
							<button className="btn btn-sm btn-circle btn-ghost" onClick={resetModal}>
								<X className="w-5 h-5" />
							</button>
						</div>

						<form onSubmit={handleSave} className="p-6 space-y-4">
							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">Employee *</span>
								</label>
								<select
									className="select select-bordered"
									value={employeeId}
									onChange={(e) => setEmployeeId(e.target.value)}
									required>
									<option value="">Select employee</option>
									{activeEmployees.map((e) => (
										<option key={e.id} value={e.id}>
											{e.name}
										</option>
									))}
								</select>
							</div>

							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">Date *</span>
								</label>
								<input
									type="date"
									className="input input-bordered"
									value={absenceDate}
									onChange={(e) => setAbsenceDate(e.target.value)}
									required
								/>
							</div>

							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">Absence Type *</span>
								</label>
								<select
									className="select select-bordered"
									value={points}
									onChange={(e) => setPoints(e.target.value)}>
									<option value="1.0">Full Day (1.0 pt)</option>
									<option value="0.5">Half Day (0.5 pt)</option>
								</select>
							</div>

							<div className="form-control">
								<label className="label py-1">
									<span className="label-text font-bold text-sm">Reason</span>
								</label>
								<input
									type="text"
									className="input input-bordered"
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									placeholder="Optional"
								/>
							</div>
						</form>

						<div className="p-6 border-t border-base-200 flex justify-end gap-2">
							<button className="btn btn-ghost" onClick={resetModal}>
								Cancel
							</button>
							<button className="btn btn-primary" onClick={handleSave}>
								Save
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
				title="Delete Absence?"
				message="This will remove the absence record."
			/>
		</>
	);
};

export default AbsenceTab;
