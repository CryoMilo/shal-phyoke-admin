// src/components/orders/DeliveryPagerModal.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Printer, Phone, MapPin, Truck, DollarSign, MessageSquare, Clipboard, Home } from "lucide-react";
import { supabase } from "../../services/supabase";
import { showToast } from "../../utils/toastUtils";

const BASE_INSTRUCTIONS = [
	{ id: "call", th: "ถึงแล้วโทรหาลูกค้า", en: "Call customer on arrival" },
	{ id: "guard", th: "ฝากไว้ที่ป้อม รปภ.", en: "Leave at security guard" },
	{ id: "door", th: "วางไว้ที่หน้าประตู", en: "Leave at the door" },
	{ id: "bell", th: "ไม่ต้องกดกริ่ง", en: "Do not ring doorbell" },
	{
		id: "building",
		th: (building) => `ส่งที่ตึก ${building || "..."} / ชั้น...`,
		en: (building) => `Deliver to Building ${building || "..."}...`
	}
];

const DeliveryPagerModal = ({ isOpen, onClose, order }) => {
	const [selectedInstructions, setSelectedInstructions] = useState(["call"]); // Contains IDs e.g. ["call", "building"]
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors }
	} = useForm({
		defaultValues: {
			dispatchText: "",
			customerPhone: "",
			customerAddress: "",
			buildingInfo: "",
			riderPlate: "",
			isPrepaid: true,
			amountToPay: 0,
			customNote: ""
		}
	});

	const isPrepaid = watch("isPrepaid");
	const buildingInfo = watch("buildingInfo");
	const customerPhone = watch("customerPhone");
	const customerAddress = watch("customerAddress");

	// Sync with order props on open/change
	useEffect(() => {
		if (order && isOpen) {
			const defaultPrepaid = order.payment_status === "paid";
			reset({
				dispatchText: "",
				customerPhone: order.customer_phone || "",
				customerAddress: "",
				buildingInfo: "",
				riderPlate: "",
				isPrepaid: defaultPrepaid,
				amountToPay: defaultPrepaid ? 0 : Number(order.total_amount || 0),
				customNote: ""
			});
			setSelectedInstructions(["call"]);
		}
	}, [order, isOpen, reset]);

	// Toggle handler for prepaid checkbox
	const handlePrepaidToggle = (checked) => {
		setValue("isPrepaid", checked);
		if (!checked) {
			// If not checked (postpaid/COD), amount field is enabled, auto-populate with total
			setValue("amountToPay", Number(order?.total_amount || 0));
		} else {
			// If checked (prepaid), amount field is disabled, default to 0
			setValue("amountToPay", 0);
		}
	};

	// Parse pasted dispatch string
	const handleDispatchTextChange = (text) => {
		setValue("dispatchText", text);
		if (!text) return;

		// Split and parse lines
		const lines = text.split("\n");
		for (let line of lines) {
			line = line.trim();
			const deliveryMatch = line.match(/^delivery:\s*(.*)$/i);
			if (deliveryMatch) {
				setValue("customerAddress", deliveryMatch[1].trim());
			}
			const vehicleMatch = line.match(/^vehicle:\s*(.*)$/i);
			if (vehicleMatch) {
				setValue("riderPlate", vehicleMatch[1].trim());
			}
		}
	};

	const toggleInstruction = (id) => {
		setSelectedInstructions((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
		);
	};

	const onSubmit = async (data) => {
		if (!order) return;

		setIsSubmitting(true);
		try {
			// Map selected instruction IDs to evaluated Thai strings
			const instructionsToSave = selectedInstructions.map(id => {
				const inst = BASE_INSTRUCTIONS.find(i => i.id === id);
				if (id === "building") {
					return `ส่งที่ตึก ${data.buildingInfo || "..."} / ชั้น...`;
				}
				return inst.th;
			});

			const jobData = {
				order_id: order.id,
				customer_name: order.customer_name || "Unknown",
				customer_phone: data.customerPhone,
				customer_address: data.customerAddress,
				building_info: data.buildingInfo.trim() || null,
				rider_plate: data.riderPlate,
				amount_to_pay: Number(data.amountToPay),
				is_prepaid: data.isPrepaid, // bool in database
				instructions: instructionsToSave,
				custom_note: data.customNote.trim() || null,
				status: "pending"
			};

			const { error } = await supabase
				.from("delivery_pager_jobs")
				.insert([jobData]);

			if (error) throw error;

			showToast.success("Delivery pager job created successfully!");
			onClose();
		} catch (error) {
			console.error("Error creating delivery pager job:", error);
			showToast.error("Failed to create delivery pager job: " + error.message);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen || !order) return null;

	return (
		<div className="modal modal-open z-[9999]">
			<div className="modal-box max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-base-100 border border-base-300 shadow-2xl rounded-2xl">
				{/* Header */}
				<div className="p-4 bg-base-200 border-b border-base-300 flex justify-between items-center">
					<div className="flex flex-col gap-1">
						<h3 className="font-bold text-lg flex items-center gap-2 text-base-content">
							<Printer className="w-5 h-5 text-primary" />
							Print Delivery Pager Slip
						</h3>
						<div className="flex items-center gap-1.5 mt-0.5">
							<span className="text-xs opacity-60">Customer:</span>
							<span className="badge badge-secondary badge-sm font-bold truncate max-w-[180px]">
								{order.customer_name || "N/A"}
							</span>
						</div>
					</div>
					<button
						type="button"
						className="btn btn-sm btn-circle btn-ghost active:scale-90 transition-transform duration-100 ease-out"
						onClick={onClose}
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Scrollable Form Body */}
				<form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-5 space-y-5">
					{/* Smart Paste Area */}
					<div className="bg-base-200/50 p-4 rounded-xl border border-base-300">
						<label className="label py-0 mb-1.5 flex items-center gap-1.5">
							<Clipboard className="w-4 h-4 text-secondary" />
							<span className="label-text font-bold text-base-content/85 text-xs uppercase tracking-wider">
								Paste Dispatch Message / Link (Bolt Send)
							</span>
						</label>
						<textarea
							placeholder="Paste the full delivery dispatch message here. We will auto-fill the address and vehicle plate details."
							className="textarea textarea-bordered textarea-sm w-full bg-base-100 h-20 text-xs focus:textarea-primary"
							value={watch("dispatchText")}
							onChange={(e) => handleDispatchTextChange(e.target.value)}
						/>
					</div>

					{/* Editable Fields */}
					<div className="space-y-4">
						{/* Customer Phone */}
						<div>
							<label className="label py-0 mb-1">
								<span className="label-text font-semibold flex items-center gap-1 text-xs text-base-content/80">
									<Phone className="w-3.5 h-3.5 text-base-content/50" />
									Customer Phone
								</span>
							</label>
							<input
								type="tel"
								placeholder="e.g. 091-234-5678"
								className={`input input-bordered input-sm w-full text-sm focus:input-primary ${errors.customerPhone ? "input-error" : ""}`}
								{...register("customerPhone", { required: true })}
							/>
						</div>

						{/* Customer Address */}
						<div>
							<label className="label py-0 mb-1">
								<span className="label-text font-semibold flex items-center gap-1 text-xs text-base-content/80">
									<MapPin className="w-3.5 h-3.5 text-base-content/50" />
									Customer Address
								</span>
							</label>
							<textarea
								placeholder="Delivery location / Address detail"
								className={`textarea textarea-bordered textarea-sm w-full text-sm h-16 focus:textarea-primary ${errors.customerAddress ? "textarea-error" : ""}`}
								{...register("customerAddress", { required: true })}
							/>
						</div>

						{/* Building Info */}
						<div>
							<label className="label py-0 mb-1">
								<span className="label-text font-semibold flex items-center gap-1 text-xs text-base-content/80">
									<Home className="w-3.5 h-3.5 text-base-content/50" />
									Building Info
								</span>
							</label>
							<input
								type="text"
								placeholder="e.g. Tower A, Fl. 12, Room 1204"
								className="input input-bordered input-sm w-full text-sm focus:input-primary"
								{...register("buildingInfo")}
							/>
						</div>

						{/* Rider Vehicle & Plate */}
						<div>
							<label className="label py-0 mb-1">
								<span className="label-text font-semibold flex items-center gap-1 text-xs text-base-content/80">
									<Truck className="w-3.5 h-3.5 text-base-content/50" />
									Rider Vehicle / Plate
								</span>
							</label>
							<input
								type="text"
								placeholder="e.g. Honda Click - 9ขฐ6717"
								className="input input-bordered input-sm w-full text-sm focus:input-primary"
								{...register("riderPlate")}
							/>
						</div>
					</div>

					{/* Payment Config */}
					<div className="bg-base-200/50 p-4 rounded-xl border border-base-300 flex items-center justify-between gap-4">
						{/* Checkbox */}
						<div className="form-control">
							<label className="label cursor-pointer flex items-center gap-2">
								<input
									type="checkbox"
									className="checkbox checkbox-primary checkbox-sm"
									checked={isPrepaid}
									onChange={(e) => handlePrepaidToggle(e.target.checked)}
								/>
								<span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/75">
									Prepaid?
								</span>
							</label>
						</div>

						{/* Amount Input */}
						<div className="flex-1 max-w-[200px]">
							<label className="label py-0 mb-1 justify-end">
								<span className="label-text font-semibold flex items-center gap-1 text-xs text-base-content/80">
									<DollarSign className="w-3.5 h-3.5 text-base-content/50" />
									Amount
								</span>
							</label>
							<input
								type="number"
								min="0"
								step="0.01"
								disabled={!isPrepaid}
								className="input input-bordered input-sm w-full text-sm focus:input-primary text-right"
								{...register("amountToPay", { required: true, valueAsNumber: true })}
							/>
						</div>
					</div>

					{/* Thai Instructions Chips */}
					<div>
						<label className="label py-0 mb-2">
							<span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
								Quick Instructions (Click to Toggle)
							</span>
						</label>
						<div className="flex flex-col gap-2">
							{BASE_INSTRUCTIONS.map((inst) => {
								const isSelected = selectedInstructions.includes(inst.id);
								const thText = inst.id === "building" ? inst.th(buildingInfo) : inst.th;
								const enText = inst.id === "building" ? inst.en(buildingInfo) : inst.en;
								return (
									<button
										key={inst.id}
										type="button"
										onClick={() => toggleInstruction(inst.id)}
										className={`btn btn-sm justify-start active:scale-95 transition-transform duration-100 ease-out w-full border ${
											isSelected
												? "btn-primary text-primary-content"
												: "btn-outline border-base-300 text-base-content/80 hover:bg-base-200"
										}`}
									>
										<span className="font-bold">{thText}</span>
										<span className="text-xs opacity-60 ml-2 font-normal">({enText})</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Custom Thai Notes */}
					<div>
						<label className="label py-0 mb-1">
							<span className="label-text font-semibold flex items-center gap-1 text-xs text-base-content/80">
								<MessageSquare className="w-3.5 h-3.5 text-base-content/50" />
								Custom Instruction Note
							</span>
						</label>
						<textarea
							placeholder="Enter any additional delivery details or specific notes for the rider."
							className="textarea textarea-bordered textarea-sm w-full text-sm h-16 focus:textarea-primary"
							{...register("customNote")}
						/>
					</div>
				</form>

				{/* Footer actions */}
				<div className="p-4 bg-base-200 border-t border-base-300 flex justify-end gap-2">
					<button
						type="button"
						className="btn btn-sm btn-ghost active:scale-95 transition-transform duration-100 ease-out"
						onClick={onClose}
						disabled={isSubmitting}
					>
						Cancel
					</button>
					<button
						type="submit"
						onClick={handleSubmit(onSubmit)}
						disabled={isSubmitting || !customerPhone || !customerAddress}
						className="btn btn-sm btn-primary active:scale-95 transition-transform duration-100 ease-out min-w-[100px]"
					>
						{isSubmitting ? (
							<span className="loading loading-spinner loading-xs"></span>
						) : (
							"Create Job"
						)}
					</button>
				</div>
			</div>
			{/* Backdrop for click outside to close */}
			<div className="modal-backdrop bg-black/50" onClick={onClose}></div>
		</div>
	);
};

export default DeliveryPagerModal;
