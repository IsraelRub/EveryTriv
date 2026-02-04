import type { ReactNode } from 'react';

export interface HomeHeaderProps {
	isAuthenticated: boolean;
	firstName?: string | null;
	showWelcome?: boolean;
	showGuestContent?: boolean;
	action?: ReactNode;
}
