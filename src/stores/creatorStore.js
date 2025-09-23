/* eslint-disable no-unused-vars */
// stores/creatorStore.js
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

const useCreatorStore = create(
	persist(
		devtools(
			(set, get) => ({
				// Single source of truth: current creator form data
				currentCreator: null,

				// Actions
				setCurrentCreator: (data) =>
					set({ currentCreator: data }, false, "setCurrentCreator"),

				clearCurrentCreator: () =>
					set({ currentCreator: null }, false, "clearCurrentCreator"),

				// Helper to get current state (useful for debugging)
				getCurrentState: () => get(),

			// Get only creator data without courses, bundles, bonuses, colors, and fonts
			getCreatorMeta: () => {
				const data = get().currentCreator;
				if (!data) return null;

				// Destructure to exclude the unwanted properties
				const { courses, bundles, bonuses, colors, fonts, ...creatorMeta } = data;
				return creatorMeta;
			},
			}),
			{ name: "CreatorStore" }
		),
		{
			name: "creator-store",
			// Force a state update after rehydration to trigger DevTools
			onRehydrateStorage: () => (state, error) => {
				if (!error && state) {
					// Trigger a no-op update to refresh DevTools
					state.setCurrentCreator(state.currentCreator);
				}
			},
		}
	)
);

export default useCreatorStore;
