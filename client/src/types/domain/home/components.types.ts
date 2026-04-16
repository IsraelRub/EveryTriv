import type { ReactElement } from 'react';

export interface HomePublicLobbiesPanelProps {
	/** When false, polling is disabled (e.g. tab not visible). Defaults to true for inline home layout */
	isActive?: boolean;
}

export interface HomeHeaderProps {
	isAuthenticated: boolean;
	firstName: string | null;
	showWelcome: boolean;
	showGuestContent: boolean;
	action: ReactElement;
}
