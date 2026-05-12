const clickSound = new Audio("/sounds/click.mp3");

/**
 * Play a standard click sound for POS interactions
 */
export const playClickSound = () => {
	clickSound.currentTime = 0;
	clickSound.play().catch((err) => {
		// Browser might block audio if no user interaction has occurred yet
		// We ignore this as it's a non-critical enhancement
		console.debug("Audio play blocked or failed:", err);
	});
};
