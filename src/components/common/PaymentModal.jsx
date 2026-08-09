import React from "react";
import { X, Banknote, CreditCard, CheckCircle2 } from "lucide-react";

const PaymentModal = ({
	isOpen,
	onClose,
	onConfirm,
	amount,
	paymentMethod,
	title = "Confirm Payment",
	loading = false,
}) => {
	const [cashReceived, setCashReceived] = React.useState("");

	React.useEffect(() => {
		setCashReceived("");
	}, [isOpen, amount]);

	const receivedNum = parseFloat(cashReceived) || 0;

	const isQR = paymentMethod === "qr";
	const isCash = paymentMethod === "cash";

	if (!isOpen) return null;

	return (
		<div className="modal modal-open z-[100]">
			<div className="modal-box max-w-md p-0 overflow-hidden bg-base-100 rounded-3xl shadow-2xl">
				{/* Header */}
				<div className="p-6 pb-0 flex justify-between items-center">
					<h3 className="font-bold text-xl">{title}</h3>
					<button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-8 text-center">
					<div className="mb-6">
						<div className="text-sm opacity-60 uppercase tracking-widest font-bold mb-1">
							Total Amount
						</div>
						<div className="text-5xl font-black text-primary">
							฿{Number(amount).toFixed(2)}
						</div>
					</div>

					<div className="flex flex-col items-center justify-center min-h-[200px] bg-base-200/50 rounded-2xl p-6 border-2 border-dashed border-base-300">
						{isCash && (
							<div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full">
								<div className="flex items-center gap-2 mb-3">
									<div className="w-8 h-8 bg-success/10 text-success rounded-full flex items-center justify-center">
										<Banknote className="w-5 h-5" />
									</div>
									<span className="font-bold text-sm text-success uppercase tracking-wider">
										Cash Calculator
									</span>
								</div>

								{/* Input field for Cash Received */}
								<div className="form-control w-full max-w-xs mb-3">
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-base-content/50 text-sm">
											฿
										</span>
										<input
											type="number"
											placeholder="Enter cash received"
											className="input input-sm input-bordered w-full pl-7 pr-3 text-center font-bold text-lg"
											value={cashReceived}
											onChange={(e) => setCashReceived(e.target.value)}
											onClick={(e) => e.target.select()}
											autoFocus
										/>
									</div>
								</div>

								{/* Quick Bills Selection */}
								<div className="flex flex-wrap justify-center gap-1.5 w-full max-w-xs mb-3">
									<button
										type="button"
										className="btn btn-md btn-outline btn-neutral rounded-lg"
										onClick={() => setCashReceived(Number(amount).toFixed(2))}>
										Exact
									</button>
									{[50, 100, 500, 1000].map((bill) => (
										<button
											key={bill}
											type="button"
											className="btn btn-md btn-neutral rounded-lg"
											onClick={() => setCashReceived(String(bill))}>
											฿{bill}
										</button>
									))}
								</div>

								{/* Change Calculator Box */}
								{cashReceived !== "" && (
									<div
										className={`w-full max-w-xs p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 ${
											receivedNum >= amount
												? "bg-success/10 border-success/30 text-success"
												: "bg-error/10 border-error/30 text-error"
										}`}>
										<span className="text-[10px] uppercase font-bold tracking-wider opacity-85">
											{receivedNum >= amount
												? "Change to Return"
												: "Amount Remaining"}
										</span>
										<span className="text-2xl font-black">
											฿{Math.abs(receivedNum - amount).toFixed(2)}
										</span>
									</div>
								)}
							</div>
						)}

						{isQR && (
							<div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full">
								<div className="relative group overflow-hidden rounded-xl border-4 border-white shadow-lg mb-4">
									<img
										src="/payment.jpg"
										alt="QR Payment"
										className="w-full max-w-[220px] h-auto object-contain"
										onError={(e) => {
											e.target.onerror = null;
											e.target.style.display = "none";
											e.target.parentNode.innerHTML =
												'<div class="p-8 text-center text-xs opacity-40">QR Image not found<br/>(public/payment.jpg)</div>';
										}}
									/>
								</div>
								<div className="flex items-center gap-2 text-info">
									<CreditCard className="w-5 h-5" />
									<span className="font-bold text-xl uppercase tracking-wider">
										QR Scan
									</span>
								</div>
							</div>
						)}

						{!isCash && !isQR && (
							<div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
								<div className="w-24 h-24 bg-base-300 text-base-content/30 rounded-full flex items-center justify-center mb-4">
									<CheckCircle2 className="w-12 h-12" />
								</div>
								<span className="font-bold text-xl opacity-60 uppercase tracking-wider">
									{paymentMethod} Payment
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="p-6 bg-base-200 border-t border-base-300 flex flex-col gap-2">
					<button
						className="btn btn-primary btn-lg rounded-2xl font-bold shadow-lg shadow-primary/20"
						onClick={onConfirm}
						disabled={loading}>
						{loading ? (
							<span className="loading loading-spinner loading-md"></span>
						) : (
							`Confirm Received ฿${Number(amount).toFixed(2)}`
						)}
					</button>
					<button
						className="btn btn-ghost rounded-2xl"
						onClick={onClose}
						disabled={loading}>
						Cancel
					</button>
				</div>
			</div>
			<div
				className="modal-backdrop bg-black/60 backdrop-blur-sm"
				onClick={onClose}></div>
		</div>
	);
};

export default PaymentModal;
