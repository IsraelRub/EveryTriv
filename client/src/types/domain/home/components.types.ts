import type { ReactElement } from 'react';

export interface HomePublicLobbiesPanelProps {
	isActive?: boolean;
}

export interface HomeHeaderProps {
	isAuthenticated: boolean;
	firstName: string | null;
	showWelcome: boolean;
	showGuestContent: boolean;
	action: ReactElement;
}
