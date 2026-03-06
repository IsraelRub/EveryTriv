import type { ReactNode } from 'react';

import type { ViewAllDestination } from '@/constants';

export interface ViewAllButtonProps {
	destination: ViewAllDestination;
	visible?: boolean;
}

export interface HomeHeaderProps {
	isAuthenticated: boolean;
	firstName: string | null;
	showWelcome: boolean;
	showGuestContent: boolean;
	action: ReactNode;
}
