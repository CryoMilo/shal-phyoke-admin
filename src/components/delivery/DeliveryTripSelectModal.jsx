import React, { useState, useEffect } from "react";
import { X, Bike, User, ArrowRight, Check } from "lucide-react";
import useEmployeeStore from "../../stores/employeeStore";

const DeliveryTripSelectModal = ({ isOpen, onClose, onStartSelection }) => {
	const { employees, fetchEmployees, loading } = useEmployeeStore();
	const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
	const [tripFee, setTripFee] = useState(20);

	useEffect(() => {
		if (isOpen) {
			fetchEmployees();
			setSelectedEmployeeId("");
			setTripFee(20);
		}
	}, [isOpen, fetchEmployees]);

	if (!isOpen) return null;

	const activeEmployees = employees.filter((e) => e.is_active);

	const handleConfirmStaff = () => {
		const emp = activeEmployees.find((e) => e.id === selectedEmployeeId);
		if (!emp) return;
		onStartSelection({
			type: "staff",
			employee: emp,
			tripFee: Number(tripFee) || 20,
		});
		onClose();
	};

	return (
		<div className="modal modal-open z-[100]">
			<div className="modal-box max-w-md p-0 overflow-hidden bg-base-100 rounded-3xl shadow-2xl border border-base-300">
				{/* Header */}
				<div className="p-5 border-b border-base-200 flex justify-between items-center bg-base-200/40">
					<div className="flex items-center gap-2.5">
						<div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
							<Bike className="w-5 h-5" />
						</div>
						<div>
							<h3 className="font-black text-lg text-base-content leading-tight">
								Record Delivery Trip
							</h3>
							<p className="text-xs text-base-content/60">
								Choose delivering staff member
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="btn btn-sm btn-circle btn-ghost"
						type="button">
						<X className="w-4 h-4" />
					</button>
				</div>

				<div className="p-5 space-y-4">
					{/* Trip Fee setting */}
					<div className="flex items-center justify-between bg-base-200/50 px-3.5 py-2.5 rounded-xl border border-base-200">
						<span className="text-xs font-bold text-base-content/80">
							Trip Payout Fee:
						</span>
						<div className="flex items-center gap-1.5">
							<span className="text-sm font-bold text-primary">฿</span>
							<input
								type="number"
								min="0"
								value={tripFee}
								onChange={(e) => setTripFee(e.target.value)}
								className="input input-xs input-bordered w-16 text-right font-black text-sm"
							/>
						</div>
					</div>

					{/* Employee selection buttons */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<label className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
								<User className="w-3.5 h-3.5" />
								Select Delivering Staff:
							</label>
							{selectedEmployeeId && (
								<span className="text-[11px] font-bold text-primary">
									1 selected
								</span>
							)}
						</div>

						{loading && activeEmployees.length === 0 ? (
							<div className="py-6 text-center">
								<span className="loading loading-spinner loading-md text-primary"></span>
							</div>
						) : activeEmployees.length === 0 ? (
							<div className="py-6 text-center text-xs opacity-50 border-2 border-dashed border-base-300 rounded-2xl">
								No active employees found
							</div>
						) : (
							<div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-0.5">
								{activeEmployees.map((emp) => {
									const isSelected = selectedEmployeeId === emp.id;
									return (
										<button
											key={emp.id}
											type="button"
											onClick={() =>
												setSelectedEmployeeId((prev) =>
													prev === emp.id ? "" : emp.id
												)
											}
											className={`relative p-3 rounded-2xl text-left border-2 transition-all flex items-center gap-2.5 ${
												isSelected
													? "bg-primary text-primary-content border-primary shadow-md ring-2 ring-primary/20 scale-[1.01]"
													: "bg-base-200/60 hover:bg-base-200 border-base-300/80 text-base-content hover:scale-[1.01] active:scale-95"
											}`}>
											<div
												className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
													isSelected
														? "bg-primary-content/20 text-primary-content"
														: "bg-primary/10 text-primary"
												}`}>
												{emp.name ? emp.name.slice(0, 2).toUpperCase() : "?"}
											</div>
											<div className="min-w-0 flex-1">
												<div className="font-bold text-sm truncate leading-snug">
													{emp.name}
												</div>
												{emp.position && (
													<div
														className={`text-[10px] truncate leading-tight ${
															isSelected
																? "text-primary-content/80 font-medium"
																: "text-base-content/60"
														}`}>
														{emp.position}
													</div>
												)}
											</div>
											{isSelected && (
												<div className="w-5 h-5 rounded-full bg-primary-content text-primary flex items-center justify-center shrink-0 shadow-xs">
													<Check className="w-3 h-3 stroke-[3]" />
												</div>
											)}
										</button>
									);
								})}
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="p-4 border-t border-base-200 bg-base-200/30 flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="btn btn-ghost btn-sm">
						Cancel
					</button>
					<button
						type="button"
						disabled={!selectedEmployeeId}
						onClick={handleConfirmStaff}
						className="btn btn-primary btn-sm font-bold gap-1.5 shadow-sm">
						Next: Select Orders <ArrowRight className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default DeliveryTripSelectModal;

