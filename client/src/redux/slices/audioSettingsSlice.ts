import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AudioSettingsState {
	volume: number;
	isMuted: boolean;
	soundEnabled: boolean;
	musicEnabled: boolean;
	isInitialized: boolean;
}

const initialState: AudioSettingsState = {
	volume: 0.7,
	isMuted: false,
	soundEnabled: true,
	musicEnabled: true,
	isInitialized: false,
};

export const audioSettingsSlice = createSlice({
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
		setMuted: (state, action: PayloadAction<boolean>) => {
			state.isMuted = action.payload;
		},
		setSoundEnabled: (state, action: PayloadAction<boolean>) => {
			state.soundEnabled = action.payload;
		},
		setMusicEnabled: (state, action: PayloadAction<boolean>) => {
			state.musicEnabled = action.payload;
		},
		toggleMute: state => {
			state.isMuted = !state.isMuted;
		},
		toggleAll: state => {
			const allEnabled = state.soundEnabled && state.musicEnabled;
			state.soundEnabled = !allEnabled;
			state.musicEnabled = !allEnabled;
		},
		setInitialized: (state, action: PayloadAction<boolean>) => {
			state.isInitialized = action.payload;
		},
	},
});

export const { setVolume, setMuted, setSoundEnabled, setMusicEnabled, toggleMute, toggleAll, setInitialized } =
	audioSettingsSlice.actions;

export default audioSettingsSlice.reducer;
