import React, { useState, useEffect } from "react";
import { X, Bike, Zap, User, ArrowRight } from "lucide-react";
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

	const handleSelectBolt = () => {
		onStartSelection({
			type: "bolt",
			employee: null,
			tripFee: 0,
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
								Choose in-house staff or mark external Bolt
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
					{/* External Bolt Option */}
					<div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shadow-sm">
								<Zap className="w-5 h-5 fill-current" />
							</div>
							<div>
								<h4 className="font-bold text-sm text-base-content">
									Bolt / External Delivery
								</h4>
								<p className="text-[11px] text-base-content/60">
									Far deliveries (no staff trip fee payout)
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={handleSelectBolt}
							className="btn btn-sm btn-warning font-bold text-xs gap-1 shadow-sm">
							Select Bolt <ArrowRight className="w-3.5 h-3.5" />
						</button>
					</div>

					<div className="divider text-xs text-base-content/40 uppercase tracking-widest my-1 font-semibold">
						or In-House Staff (฿20/trip)
					</div>

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

					{/* Employee selection list */}
					<div>
						<label className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2 block">
							Select Delivering Staff:
						</label>

						{loading && activeEmployees.length === 0 ? (
							<div className="py-6 text-center">
								<span className="loading loading-spinner loading-sm text-primary"></span>
							</div>
						) : activeEmployees.length === 0 ? (
							<div className="py-4 text-center text-xs opacity-50 border border-dashed rounded-xl">
								No active employees found
							</div>
						) : (
							<div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
								{activeEmployees.map((emp) => {
									const isSelected = selectedEmployeeId === emp.id;
									return (
										<button
											key={emp.id}
											type="button"
											onClick={() => setSelectedEmployeeId(emp.id)}
											className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
												isSelected
													? "bg-primary text-primary-content border-primary shadow-sm"
													: "bg-base-200/60 hover:bg-base-200 border-base-200 text-base-content"
											}`}>
											<div className="flex items-center gap-2.5 min-w-0">
												<div
													className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
														isSelected
															? "bg-primary-content/20 text-primary-content"
															: "bg-base-300 text-base-content/70"
													}`}>
													<User className="w-4 h-4" />
												</div>
												<div className="truncate">
													<div className="font-bold text-sm truncate">
														{emp.name}
													</div>
													{emp.position && (
														<div
															className={`text-[10px] truncate ${
																isSelected
																	? "text-primary-content/80"
																	: "text-base-content/50"
															}`}>
															{emp.position}
														</div>
													)}
												</div>
											</div>
											{isSelected && (
												<span className="badge badge-sm bg-primary-content text-primary font-bold">
													Selected
												</span>
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
