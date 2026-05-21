/**
 * Utility for playing notification sounds
 */

const NOTIFICATION_SOUNDS = [
	"sounds/notification-1.mp3",
	"sounds/notification-2.mp3",
	"sounds/notification-3.mp3",
	"sounds/notification-4.mp3",
	"sounds/notification-5.mp3",
];

/**
 * Plays a random notification sound from the public folder
 */
export const playDeliveryNotificationSound = () => {
	try {
		const randomIndex = Math.floor(Math.random() * NOTIFICATION_SOUNDS.length);
		const soundPath = NOTIFICATION_SOUNDS[randomIndex];
		const audio = new Audio(soundPath);
		audio.play().catch((error) => {
			console.warn("Audio playback failed:", error);
			// This often happens if the user hasn't interacted with the page yet
		});
	} catch (error) {
		console.error("Error playing sound:", error);
	}
};
