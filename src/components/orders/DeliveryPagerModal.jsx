// src/components/orders/DeliveryPagerModal.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	X,
	Printer,
	Phone,
	MapPin,
	Truck,
	MessageSquare,
	Clipboard,
	Home,
	PhoneCall,
	PackageCheck,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { showToast } from "../../utils/toastUtils";

const DeliveryPagerModal = ({ isOpen, onClose, order }) => {
	const [instructionMode, setInstructionMode] = useState("drop"); // "call" | "drop"
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { register, handleSubmit, setValue, watch, reset } = useForm({
		defaultValues: {
			dispatchText: "",
			customerPhone: "",
			customerAddress: "",
			buildingInfo: "",
			riderPlate: "",
			isPrepaid: true,
			amountToPay: 0,
			customNote: "",
		},
	});

	const isPrepaid = watch("isPrepaid");
	const buildingInfo = watch("buildingInfo");
	const customerPhone = watch("customerPhone");

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
				amountToPay: defaultPrepaid ? Number(order.delivery_fee || 0) : "",
				customNote: "",
			});
			setInstructionMode("drop");
		}
	}, [order, isOpen, reset]);

	// Auto-switch to drop mode if phone number is cleared and current mode is call
	useEffect(() => {
		if (!customerPhone?.trim() && instructionMode === "call") {
			setInstructionMode("drop");
		}
	}, [customerPhone, instructionMode]);

	// Toggle handler for prepaid checkbox
	const handlePrepaidToggle = (checked) => {
		setValue("isPrepaid", checked);
		setValue("amountToPay", checked ? Number(order?.delivery_fee || 0) : "");
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

	// Paste text from clipboard using browser API
	const handlePasteFromClipboard = async () => {
		try {
			const text = await navigator.clipboard.readText();
			if (text) {
				handleDispatchTextChange(text);
				showToast.success("Dispatch message pasted from clipboard!");
			} else {
				showToast.error("Clipboard is empty.");
			}
		} catch (error) {
			console.error("Failed to read clipboard:", error);
			showToast.error("Clipboard access denied. Please paste manually.");
		}
	};

	// Dynamic preview helper
	const getCraftedInstruction = () => {
		const bldg = buildingInfo?.trim()
			? `ตึก ${buildingInfo.trim()}`
			: "ตึก ...";
		const phone = customerPhone?.trim() || "";

		if (instructionMode === "drop") {
			const base = `วางไว้ที่จุดรับส่งอาหาร ${bldg}`;
			if (!phone) {
				return `${base} • ไม่ต้องติดต่อลูกค้า • หากเป็นไปได้ รบกวนส่งหมายเลขตะกร้าเข้ามาในแชท`;
			}
			return `${base} • หากเป็นไปได้ รบกวนส่งหมายเลขตะกร้าเข้ามาในแชท`;
		}
		return `ถึงแล้วโทรหา ${phone || "ลูกค้า"} ${bldg}`;
	};

	const onSubmit = async (data) => {
		if (!order) return;

		setIsSubmitting(true);
		try {
			const bldg = data.buildingInfo?.trim()
				? `ตึก ${data.buildingInfo.trim()}`
				: "";
			const phone = data.customerPhone?.trim() || "";

			let instructionsArray = [];
			if (instructionMode === "drop") {
				instructionsArray = [
					bldg ? `วางไว้ที่จุดรับส่งอาหาร ${bldg}` : "วางไว้ที่จุดรับส่งอาหาร"
				];
				if (!phone) {
					instructionsArray.push("ไม่ต้องติดต่อลูกค้า");
				}
				instructionsArray.push("หากเป็นไปได้ รบกวนส่งหมายเลขตะกร้าเข้ามาในแชท");
			} else {
				instructionsArray = [
					phone
						? `ถึงแล้วโทรหา ${phone} ${bldg}`.trim()
						: `ถึงแล้วโทรหาลูกค้า ${bldg}`.trim()
				];
			}

			const jobData = {
				order_id: order.id,
				customer_name: order.customer_name || "Unknown",
				customer_phone: data.customerPhone || null,
				customer_address: data.customerAddress || null,
				building_info: data.buildingInfo.trim() || null,
				rider_plate: data.riderPlate || null,
				amount_to_pay:
					data.amountToPay === "" || isNaN(Number(data.amountToPay))
						? null
						: Number(data.amountToPay),
				is_prepaid: data.isPrepaid,
				instructions: instructionsArray,
				custom_note: data.customNote.trim() || null,
				status: "pending",
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
						onClick={onClose}>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Scrollable Form Body */}
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="flex-1 overflow-y-auto p-5 space-y-5">
					{/* Smart Paste Area */}
					<div className="bg-base-200/50 p-4 rounded-xl border border-base-300">
						<div className="flex justify-between items-center mb-1.5">
							<label className="label py-0 flex items-center gap-1.5">
								<Clipboard className="w-4 h-4 text-secondary" />
								<span className="label-text font-bold text-base-content/85 text-xs uppercase tracking-wider">
									Tracking Link / Dispatch Text
								</span>
							</label>
							<button
								type="button"
								onClick={handlePasteFromClipboard}
								className="btn btn-xs btn-outline btn-secondary gap-1 active:scale-95 transition-all">
								Paste
							</button>
						</div>
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
									Customer Phone{" "}
									<span className="text-[10px] opacity-40 font-normal ml-1">
										(Optional)
									</span>
								</span>
							</label>
							<input
								type="tel"
								placeholder="e.g. 091-234-5678"
								className="input input-bordered input-sm w-full text-sm focus:input-primary"
								{...register("customerPhone")}
							/>
						</div>

						{/* Customer Address */}
						<div>
							<label className="label py-0 mb-1">
								<span className="label-text font-semibold flex items-center gap-1 text-xs text-base-content/80">
									<MapPin className="w-3.5 h-3.5 text-base-content/50" />
									Customer Address{" "}
									<span className="text-[10px] opacity-40 font-normal ml-1">
										(Optional)
									</span>
								</span>
							</label>
							<textarea
								placeholder="Delivery location / Address detail"
								className="textarea textarea-bordered textarea-sm w-full text-sm h-16 focus:textarea-primary"
								{...register("customerAddress")}
							/>
						</div>

						{/* Building Info */}
						<div>
							<label className="label py-0 mb-1">
								<span className="label-text font-semibold flex items-center gap-1 text-xs text-base-content/80">
									<Home className="w-3.5 h-3.5 text-base-content/50" />
									Building Info{" "}
									<span className="text-[10px] opacity-40 font-normal ml-1">
										(Optional)
									</span>
								</span>
							</label>
							<input
								type="text"
								placeholder="e.g. A, 12, Tower B"
								className="input input-bordered input-sm w-full text-sm focus:input-primary mb-2"
								{...register("buildingInfo")}
							/>
							{/* Quick Select Buttons */}
							<div className="flex flex-wrap gap-1.5 items-center">
								<span className="text-[10px] uppercase opacity-55 font-bold mr-1">
									Quick Select:
								</span>
								{[
									"A",
									"B",
									"C",
									"D",
									"E",
									"F",
									"G",
									"H",
									"1",
									"2",
									"3",
									"4",
									"5",
								].map((val) => (
									<button
										key={val}
										type="button"
										onClick={() => setValue("buildingInfo", val)}
										className={`btn btn-xs ${
											watch("buildingInfo") === val
												? "btn-primary"
												: "btn-outline border-base-300"
										} rounded`}>
										{val}
									</button>
								))}
							</div>
						</div>

						{/* Rider Vehicle & Plate */}
						<div>
							<label className="label py-0 mb-1">
								<span className="label-text font-semibold flex items-center gap-1 text-xs text-base-content/80">
									<Truck className="w-3.5 h-3.5 text-base-content/50" />
									Rider Vehicle / Plate{" "}
									<span className="text-[10px] opacity-40 font-normal ml-1">
										(Optional)
									</span>
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

						<div className="flex-1 max-w-[200px]">
							<label className="label py-0 mb-1 justify-end">
								<span className="label-text font-semibold flex items-center gap-1 text-xs text-base-content/80">
									Amount
								</span>
							</label>
							<input
								type="number"
								min="0"
								step="0.01"
								disabled={!isPrepaid}
								className="input input-bordered input-sm w-full text-sm focus:input-primary text-right"
								{...register("amountToPay", {
									required: true,
									valueAsNumber: true,
								})}
							/>
						</div>
					</div>

					{/* Instruction Mode Radio Group (Drop vs Call) */}
					<div>
						<label className="label py-0 mb-2">
							<span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/70">
								Instruction Type
							</span>
						</label>
						<div className="grid grid-cols-2 gap-3">
							{/* Drop Option */}
							<label
								className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${
									instructionMode === "drop"
										? "border-primary bg-primary/10"
										: "border-base-300 bg-base-100 hover:bg-base-200/50"
								}`}>
								<div className="flex items-center justify-between mb-1">
									<div className="flex items-center gap-2 font-bold text-sm">
										<PackageCheck className="w-4 h-4 text-primary" />
										Drop at Point
									</div>
									<input
										type="radio"
										name="instruction_mode"
										className="radio radio-primary radio-sm"
										checked={instructionMode === "drop"}
										onChange={() => setInstructionMode("drop")}
									/>
								</div>
								<span className="text-xs text-base-content/60 font-medium">
									วางไว้ที่จุดรับส่งอาหาร
								</span>
							</label>

							{/* Call Option */}
							<label
								className={`flex flex-col p-3 rounded-xl border-2 transition-all ${
									!customerPhone?.trim()
										? "opacity-40 cursor-not-allowed border-base-200 bg-base-200/20"
										: instructionMode === "call"
										? "border-primary bg-primary/10 cursor-pointer"
										: "border-base-300 bg-base-100 hover:bg-base-200/50 cursor-pointer"
								}`}>
								<div className="flex items-center justify-between mb-1">
									<div className="flex items-center gap-2 font-bold text-sm">
										<PhoneCall className="w-4 h-4 text-primary" />
										Call on Arrival
									</div>
									<input
										type="radio"
										name="instruction_mode"
										className="radio radio-primary radio-sm"
										disabled={!customerPhone?.trim()}
										checked={instructionMode === "call"}
										onChange={() => setInstructionMode("call")}
									/>
								</div>
								<span className="text-xs text-base-content/60 font-medium">
									ถึงแล้วโทรหาลูกค้า
								</span>
							</label>
						</div>

						{/* Dynamic Result Live Preview */}
						<div className="mt-2.5 px-3 py-2 bg-base-200/70 rounded-lg border border-base-300 text-xs font-mono text-base-content/80 flex items-center gap-2">
							<span className="badge badge-neutral badge-xs uppercase font-bold text-[9px]">
								Preview
							</span>
							<span className="font-medium truncate">
								{getCraftedInstruction()}
							</span>
						</div>
					</div>

					{/* Custom Notes */}
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
						disabled={isSubmitting}>
						Cancel
					</button>
					<button
						type="submit"
						onClick={handleSubmit(onSubmit)}
						disabled={isSubmitting}
						className="btn btn-sm btn-primary active:scale-95 transition-transform duration-100 ease-out min-w-[100px]">
						{isSubmitting ? (
							<span className="loading loading-spinner loading-xs"></span>
						) : (
							"Notify"
						)}
					</button>
				</div>
			</div>
			{/* Backdrop */}
			<div className="modal-backdrop bg-black/50" onClick={onClose}></div>
		</div>
	);
};

export default DeliveryPagerModal;
