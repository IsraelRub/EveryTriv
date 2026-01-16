import type { ReactNode } from 'react';
import type { NavLinkProps as RouterNavLinkProps } from 'react-router-dom';

import type { ComponentSize } from '@/constants';

export interface NavigationLink {
	readonly label: string;
	readonly path: string;
}

export interface NavigationLinks {
	readonly main: ReadonlyArray<NavigationLink>;
	readonly authenticated: ReadonlyArray<NavigationLink>;
	readonly admin: ReadonlyArray<NavigationLink>;
	readonly footer: {
		readonly quick: ReadonlyArray<NavigationLink>;
		readonly legal: ReadonlyArray<NavigationLink>;
	};
}

export interface NavigationMenuLink extends NavigationLink {
	readonly isActive: boolean;
}

export interface NavigationUserDisplay {
	email: string;
	avatar?: number;
	firstName?: string;
	lastName?: string;
}

export interface NavUserActions extends NavigationUserDisplay {
	avatarSize?: ComponentSize;
}

export interface NavigationBrandProps {
	isHome: boolean;
	appName: string;
	onNavigateHome?: () => void;
}

export interface NavigationMenuProps {
	links: ReadonlyArray<NavigationMenuLink>;
	isAuthenticated: boolean;
	creditsDisplay?: string;
	totalCredits?: number;
	nextResetTime?: string | null;
	userDisplay?: NavigationUserDisplay;
	onLogout: () => void;
	onSignUp: () => void;
	onSignIn: () => void;
	onGetMoreCredits: () => void;
}

export interface NavigationActionsProps {
	isAuthenticated: boolean;
	userDisplay?: NavUserActions;
	onLogout: () => void;
	onSignUp: () => void;
	onSignIn: () => void;
	children?: ReactNode;
}

export interface NavigationCreditsState {
	display: string;
	total?: number;
	nextResetTime: string | null;
}

export interface NavLinkProps extends RouterNavLinkProps {
	activeClassName?: string;
}
