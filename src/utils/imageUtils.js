/**
 * Utility helper to safely filter out Supabase Storage URLs to temporarily prevent egress overages.
 *
 * @param {string} url - Image URL string
 * @returns {string|null} - Null if it is a Supabase Storage URL, otherwise the original URL
 */
export const getSafeImageUrl = (url) => {
	if (!url) return null;
	if (typeof url === "string" && url.includes("supabase.co/storage/")) {
		return null; // Bypassed to save Supabase egress bandwidth
	}
	return url;
};
