// src/components/common/ImageUpload.jsx
import { useState, useRef } from "react";
import { Camera, X, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "../../services/supabase";

const ImageUpload = ({
	bucket = "inventory-images",
	folder = "",
	value = "",
	onChange,
	className = "",
	label = "Menu Item Image",
	required = false,
	maxSizeMB = 5,
	allowedTypes = ["image/jpeg", "image/png", "image/webp"],
	error: externalError,
	onError,
}) => {
	const [uploading, setUploading] = useState(false);
	const [internalError, setInternalError] = useState("");
	const [preview, setPreview] = useState(value);
	const fileInputRef = useRef(null);

	const error = externalError || internalError;

	const validateFile = (file) => {
		if (!allowedTypes.includes(file.type)) {
			return `File type not allowed. Allowed: ${allowedTypes
				.map((t) => t.split("/")[1])
				.join(", ")}`;
		}
		const maxSizeBytes = maxSizeMB * 1024 * 1024;
		if (file.size > maxSizeBytes) {
			return `File size too large (max ${maxSizeMB}MB)`;
		}
		return null;
	};

	const handleFileSelect = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setInternalError("");
		const validationError = validateFile(file);
		if (validationError) {
			setInternalError(validationError);
			onError?.(validationError);
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		const objectUrl = URL.createObjectURL(file);
		setPreview(objectUrl);

		setUploading(true);
		try {
			const fileExt = file.name.split(".").pop();
			const fileName = `${Date.now()}-${Math.random()
				.toString(36)
				.substring(7)}.${fileExt}`;
			const filePath = folder ? `${folder}/${fileName}` : fileName;

			const { error: uploadError } = await supabase.storage
				.from(bucket)
				.upload(filePath, file);

			if (uploadError) throw uploadError;

			const {
				data: { publicUrl },
			} = supabase.storage.from(bucket).getPublicUrl(filePath);

			onChange?.(publicUrl);
			URL.revokeObjectURL(objectUrl);
		} catch (err) {
			console.error("Error uploading image:", err);
			const msg = err.message || "Failed to upload image";
			setInternalError(msg);
			onError?.(msg);
			setPreview(value);
		} finally {
			setUploading(false);
		}
	};

	const handleRemove = async (e) => {
		e.stopPropagation();
		if (value) {
			try {
				const url = new URL(value);
				const pathParts = url.pathname.split("/");
				const filePath = pathParts
					.slice(pathParts.indexOf("object") + 2)
					.join("/");

				await supabase.storage.from(bucket).remove([filePath]);
			} catch (err) {
				console.error("Error removing file:", err);
			}
		}

		setPreview("");
		onChange?.("");
		setInternalError("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className={`form-control w-full ${className}`}>
			{label && (
				<label className="label py-1">
					<span className="label-text font-medium text-xs text-base-content/80">
						{label}
						{required && <span className="text-error ml-1">*</span>}
					</span>
				</label>
			)}

			<input
				ref={fileInputRef}
				type="file"
				accept={allowedTypes.join(",")}
				onChange={handleFileSelect}
				className="hidden"
			/>

			<div
				onClick={() => !uploading && fileInputRef.current?.click()}
				className={`group relative w-full h-36 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
					error
						? "border-error bg-error/5"
						: preview
						? "border-primary/40 bg-base-100 hover:border-primary shadow-sm"
						: "border-base-300 bg-base-200/50 hover:bg-base-200 hover:border-primary/50"
				}`}>
				{uploading ? (
					<div className="flex flex-col items-center justify-center p-4">
						<Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
						<span className="text-xs font-semibold text-base-content/70">
							Uploading image...
						</span>
					</div>
				) : preview || value ? (
					<>
						<img
							src={preview || value}
							alt="Preview"
							className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
						{/* Hover Overlay */}
						<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-[1px]">
							<Camera className="w-6 h-6" />
							<span className="text-xs font-medium">Click to change image</span>
						</div>
						{/* Delete button */}
						<button
							type="button"
							onClick={handleRemove}
							className="absolute top-2 right-2 btn btn-circle btn-xs btn-error shadow-md opacity-80 hover:opacity-100 z-10"
							title="Remove image">
							<X className="w-3.5 h-3.5" />
						</button>
					</>
				) : (
					<div className="flex flex-col items-center justify-center text-center p-4 text-base-content/60 group-hover:text-primary transition-colors">
						<div className="p-2.5 rounded-full bg-base-100 shadow-xs mb-2 group-hover:scale-110 transition-transform">
							<Camera className="w-6 h-6 text-primary" />
						</div>
						<p className="text-xs font-semibold">Click to upload photo</p>
						<p className="text-[10px] text-base-content/50 mt-0.5">
							PNG, JPG, WEBP up to {maxSizeMB}MB
						</p>
					</div>
				)}
			</div>

			{error && (
				<label className="label py-1">
					<span className="label-text-alt text-error text-[11px]">
						⚠️ {error}
					</span>
				</label>
			)}
		</div>
	);
};

export default ImageUpload;
