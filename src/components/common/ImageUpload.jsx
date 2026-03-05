// src/components/common/ImageUpload.jsx
import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "../../services/supabase";

/**
 * Reusable Image Upload Component
 *
 * @param {Object} props
 * @param {string} props.bucket - Supabase storage bucket name (default: 'inventory-images')
 * @param {string} props.folder - Folder path within bucket (default: '')
 * @param {string} props.value - Current image URL
 * @param {function} props.onChange - Callback when image changes (receives URL string)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.label - Label text
 * @param {boolean} props.required - Whether image is required
 * @param {string} props.placeholder - Placeholder text when no image
 * @param {number} props.maxSizeMB - Max file size in MB (default: 5)
 * @param {string[]} props.allowedTypes - Allowed MIME types (default: ['image/jpeg', 'image/png', 'image/webp'])
 * @param {string} props.error - Error message
 * @param {function} props.onError - Error callback
 */
const ImageUpload = ({
	bucket = "inventory-images",
	folder = "",
	value = "",
	onChange,
	className = "",
	label = "Image",
	required = false,
	placeholder = "No image selected",
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
		// Check file type
		if (!allowedTypes.includes(file.type)) {
			return `File type not allowed. Please upload: ${allowedTypes
				.map((t) => t.split("/")[1])
				.join(", ")}`;
		}

		// Check file size
		const maxSizeBytes = maxSizeMB * 1024 * 1024;
		if (file.size > maxSizeBytes) {
			return `File size too large. Maximum size is ${maxSizeMB}MB`;
		}

		return null;
	};

	const handleFileSelect = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Clear previous errors
		setInternalError("");

		// Validate file
		const validationError = validateFile(file);
		if (validationError) {
			setInternalError(validationError);
			onError?.(validationError);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
			return;
		}

		// Create preview
		const objectUrl = URL.createObjectURL(file);
		setPreview(objectUrl);

		// Upload to Supabase
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

			// Call onChange with the public URL
			onChange?.(publicUrl);

			// Clean up preview object URL
			URL.revokeObjectURL(objectUrl);
		} catch (error) {
			console.error("Error uploading image:", error);
			const errorMessage = error.message || "Failed to upload image";
			setInternalError(errorMessage);
			onError?.(errorMessage);
			// Reset preview
			setPreview(value);
		} finally {
			setUploading(false);
		}
	};

	const handleRemove = async () => {
		if (value) {
			// Extract file path from URL
			try {
				const url = new URL(value);
				const pathParts = url.pathname.split("/");
				const filePath = pathParts
					.slice(pathParts.indexOf("object") + 2)
					.join("/");

				// Remove from storage
				await supabase.storage.from(bucket).remove([filePath]);
			} catch (error) {
				console.error("Error removing file:", error);
			}
		}

		// Reset states
		setPreview("");
		onChange?.("");
		setInternalError("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleRetry = () => {
		setInternalError("");
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	return (
		<div className={`form-control w-full ${className}`}>
			{label && (
				<label className="label">
					<span className="label-text">
						{label}
						{required && <span className="text-error ml-1">*</span>}
					</span>
				</label>
			)}

			<div className="flex items-start gap-4">
				{/* Image Preview */}
				<div className="relative">
					<div className="w-24 h-24 rounded-lg bg-base-300 flex items-center justify-center overflow-hidden border-2 border-base-300">
						{uploading ? (
							<div className="flex flex-col items-center justify-center">
								<Loader2 className="w-8 h-8 animate-spin text-primary" />
								<span className="text-xs mt-1">Uploading...</span>
							</div>
						) : preview ? (
							<img
								src={preview}
								alt="Preview"
								className="w-full h-full object-cover"
							/>
						) : (
							<ImageIcon className="w-10 h-10 text-gray-500" />
						)}
					</div>
					{value && !uploading && (
						<button
							type="button"
							onClick={handleRemove}
							className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error"
							title="Remove image">
							<X className="w-3 h-3" />
						</button>
					)}
				</div>

				{/* Upload Controls */}
				<div className="flex-1">
					<input
						ref={fileInputRef}
						type="file"
						accept={allowedTypes.join(",")}
						onChange={handleFileSelect}
						className="hidden"
						id="image-upload-input"
					/>

					<div className="flex flex-wrap gap-2">
						<label
							htmlFor="image-upload-input"
							className={`btn btn-outline btn-sm gap-2 ${
								uploading ? "btn-disabled" : ""
							}`}>
							<Upload className="w-4 h-4" />
							{value ? "Change Image" : "Upload Image"}
						</label>

						{error && (
							<button
								type="button"
								onClick={handleRetry}
								className="btn btn-warning btn-sm gap-2">
								Retry
							</button>
						)}
					</div>

					{/* File requirements */}
					<div className="mt-2 text-xs text-gray-500">
						<p>
							Max size: {maxSizeMB}MB • Allowed:{" "}
							{allowedTypes.map((t) => t.split("/")[1]).join(", ")}
						</p>
					</div>

					{/* Error message */}
					{error && (
						<div className="mt-2 text-xs text-error flex items-center gap-1">
							<span>⚠️ {error}</span>
						</div>
					)}

					{/* Placeholder text when no image */}
					{!value && !uploading && !error && (
						<p className="mt-2 text-xs text-gray-400 italic">{placeholder}</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default ImageUpload;
