// src/utils/copyToClipboard.js
export async function copyToClipboard(
	text,
	buttonEl = null,
	flashDuration = 1000
) {
	try {
		if (navigator?.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
		} else {
			// fallback for older browsers / insecure contexts
			const ta = document.createElement("textarea");
			ta.value = text;
			ta.setAttribute("readonly", "");
			ta.style.position = "absolute";
			ta.style.left = "-9999px";
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
		}

		if (buttonEl) {
			const original = buttonEl.innerHTML;
			buttonEl.innerHTML = "✓";
			// ensure flash resets
			setTimeout(() => {
				buttonEl.innerHTML = original;
			}, flashDuration);
		}

		return true;
	} catch (err) {
		console.error("copyToClipboard failed:", err);
		return false;
	}
}
