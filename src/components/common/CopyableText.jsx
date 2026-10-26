import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { showToast } from "../../utils/toastUtils";

const CopyableText = ({
	text,
	label = "text",
	children,
	className = "",
	showIcon = true,
	toastMessage,
}) => {
	const [copied, setCopied] = useState(false);

	if (!text) return children || null;

	const handleCopy = async (e) => {
		e.stopPropagation();
		try {
			if (navigator?.clipboard?.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
				const textArea = document.createElement("textarea");
				textArea.value = text;
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand("copy");
				document.body.removeChild(textArea);
			}
			setCopied(true);
			showToast.success(toastMessage || `Copied ${label} to clipboard`);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
			showToast.error("Failed to copy");
		}
	};

	return (
		<span
			onClick={handleCopy}
			title={`Click to copy ${label}`}
			className={`inline-flex items-center gap-1.5 cursor-pointer select-none group transition-colors rounded-md ${className}`}>
			{children || <span className="hover:text-primary transition-colors">{text}</span>}
			{showIcon && (
				<span className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
					{copied ? (
						<Check className="w-3.5 h-3.5 text-success stroke-[2.5]" />
					) : (
						<Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
					)}
				</span>
			)}
		</span>
	);
};

export default CopyableText;
