import React from "react";
import { X, Banknote, CreditCard, CheckCircle2 } from "lucide-react";

const PaymentModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    amount, 
    paymentMethod, 
    title = "Confirm Payment" 
}) => {
    if (!isOpen) return null;

    const isQR = paymentMethod === "qr";
    const isCash = paymentMethod === "cash";

    return (
        <div className="modal modal-open z-[100]">
            <div className="modal-box max-w-md p-0 overflow-hidden bg-base-100 rounded-3xl shadow-2xl">
                {/* Header */}
                <div className="p-6 pb-0 flex justify-between items-center">
                    <h3 className="font-bold text-xl">{title}</h3>
                    <button 
                        onClick={onClose}
                        className="btn btn-sm btn-circle btn-ghost"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    <div className="mb-6">
                        <div className="text-sm opacity-60 uppercase tracking-widest font-bold mb-1">Total Amount</div>
                        <div className="text-5xl font-black text-primary">฿{Number(amount).toFixed(2)}</div>
                    </div>

                    <div className="flex flex-col items-center justify-center min-h-[200px] bg-base-200/50 rounded-2xl p-6 border-2 border-dashed border-base-300">
                        {isCash && (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
                                    <Banknote className="w-12 h-12" />
                                </div>
                                <span className="font-bold text-xl text-success uppercase tracking-wider">Cash Payment</span>
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
                                            e.target.style.display = 'none';
                                            e.target.parentNode.innerHTML = '<div class="p-8 text-center text-xs opacity-40">QR Image not found<br/>(public/payment.jpg)</div>';
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-info">
                                    <CreditCard className="w-5 h-5" />
                                    <span className="font-bold text-xl uppercase tracking-wider">QR Scan</span>
                                </div>
                            </div>
                        )}

                        {!isCash && !isQR && (
                             <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                <div className="w-24 h-24 bg-base-300 text-base-content/30 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <span className="font-bold text-xl opacity-60 uppercase tracking-wider">{paymentMethod} Payment</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-base-200 border-t border-base-300 flex flex-col gap-2">
                    <button 
                        className="btn btn-primary btn-lg rounded-2xl font-bold shadow-lg shadow-primary/20"
                        onClick={onConfirm}
                    >
                        Confirm Received ฿{Number(amount).toFixed(2)}
                    </button>
                    <button 
                        className="btn btn-ghost rounded-2xl"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
            <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        </div>
    );
};

export default PaymentModal;
