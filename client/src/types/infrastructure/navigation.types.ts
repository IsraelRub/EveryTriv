import type { ReactElement } from 'react';
import type { NavLinkProps as RouterNavLinkProps } from 'react-router-dom';

import type { ComponentSize, NavKey } from '@/constants';

export interface NavigationLink {
	readonly labelKey: NavKey;
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








export interface NavLinkProps extends RouterNavLinkProps {
	activeClassName?: string;
}

export interface UseNavigationCloseOptions {
	defaultRoute?: string;
	onBeforeClose?: () => void;
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
	children?: ReactElement | ReactElement[] | null;
}

export interface NavigationCreditsState {
	display: string;
	total?: number;
}

