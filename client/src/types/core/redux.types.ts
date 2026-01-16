import type { AudioSettingsState } from '@/redux/slices/audioSettingsSlice';
import type { GameSessionState } from '@/redux/slices/gameSessionSlice';
import type { MultiplayerState } from '@/redux/slices/multiplayerSlice';
import type { UIPreferencesState } from '@/redux/slices/uiPreferencesSlice';
import type { GameModeState } from '../domain/game';

export interface RootState {
	gameMode: GameModeState;
	gameSession: GameSessionState;
	multiplayer: MultiplayerState;
	audioSettings: AudioSettingsState;
	uiPreferences: UIPreferencesState;
}
