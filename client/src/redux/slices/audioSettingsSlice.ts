import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { AudioSettingsState } from '@/types';

const initialState: AudioSettingsState = {
	volume: 0.7,
	soundEffectsVolume: 1,
	musicVolume: 1,
	isMuted: false,
	soundEnabled: true,
	musicEnabled: true,
	isInitialized: false,
};

const audioSettingsSlice = createSlice({
	name: 'audioSettings',
	initialState,
	reducers: {
		setVolume: (state, action: PayloadAction<number>) => {
			state.volume = action.payload;
			// Unmute if volume is set above 0
			if (action.payload > 0 && state.isMuted) {
				state.isMuted = false;
			}
		},
		setSoundEffectsVolume: (state, action: PayloadAction<number>) => {
			state.soundEffectsVolume = action.payload;
		},
		setMusicVolume: (state, action: PayloadAction<number>) => {
			state.musicVolume = action.payload;
		},
		setMuted: (state, action: PayloadAction<boolean>) => {
			state.isMuted = action.payload;
		},
		setSoundEnabled: (state, action: PayloadAction<boolean>) => {
			state.soundEnabled = action.payload;
		},
		setMusicEnabled: (state, action: PayloadAction<boolean>) => {
			state.musicEnabled = action.payload;
		},
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.isInitialized = action.payload;
		},
	},
});

export const {
	setVolume,
	setSoundEffectsVolume,
	setMusicVolume,
	setMuted,
	setSoundEnabled,
	setMusicEnabled,
	setInitialized,
} = audioSettingsSlice.actions;

export default audioSettingsSlice.reducer;
