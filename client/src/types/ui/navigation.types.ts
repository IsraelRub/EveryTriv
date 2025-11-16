/**
 * Navigation Component Types
 * @module NavigationComponentTypes
 * @description Typed definitions for navigation-related UI components and data structures
 */

import type { ReactNode } from 'react';

import type { ComponentSize } from '@constants/ui/size.constants';

/**
 * Navigation link descriptor
 * @interface NavigationLink
 * @description Represents an individual navigation item with display metadata
 */
export interface NavigationLink {
	readonly label: string;
	readonly path: string;
}

/**
 * Structured navigation collections
 * @interface NavigationLinks
 * @description Navigation link groupings scoped by feature or user role
 */
export interface NavigationLinks {
	readonly main: ReadonlyArray<NavigationLink>;
	readonly authenticated: ReadonlyArray<NavigationLink>;
	readonly admin: ReadonlyArray<NavigationLink>;
	readonly footer: {
		readonly quick: ReadonlyArray<NavigationLink>;
	};
}

/**
 * Navigation link enriched with active-state metadata
 * @interface NavigationMenuLink
 */
export interface NavigationMenuLink extends NavigationLink {
	readonly isActive: boolean;
}

/**
 * Navigation user display model shared across navigation components
 * @interface NavigationUserDisplay
 */
export interface NavigationUserDisplay {
	username: string;
	avatar?: string;
	firstName?: string;
	lastName?: string;
}

/**
 * Navigation user display model for action components
 * @interface NavigationActionsUserDisplay
 */
export interface NavigationActionsUserDisplay extends NavigationUserDisplay {
	avatarSize?: ComponentSize;
}

/**
 * Navigation brand component props
 * @interface NavigationBrandProps
 */
export interface NavigationBrandProps {
	isHome: boolean;
	appName: string;
	onNavigateHome?: () => void;
}

/**
 * Navigation menu component props
 * @interface NavigationMenuProps
 */
export interface NavigationMenuProps {
	links: ReadonlyArray<NavigationMenuLink>;
	audioControls: ReactNode;
	isAuthenticated: boolean;
	pointsDisplay?: string;
	totalPoints?: number;
	freeQuestions?: number;
	nextResetTime?: string | null;
	userDisplay?: NavigationUserDisplay;
	onLogout: () => void;
	onSignUp: () => void;
	onGoogleLogin: () => void;
	onGetMorePoints: () => void;
}

/**
 * Navigation actions component props
 * @interface NavigationActionsProps
 */
export interface NavigationActionsProps {
	isAuthenticated: boolean;
	userDisplay?: NavigationActionsUserDisplay;
	onLogout: () => void;
	onSignUp: () => void;
	onGoogleLogin: () => void;
	children?: ReactNode;
}

/**
 * Navigation points display state
 * @interface NavigationPointsState
 */
export interface NavigationPointsState {
	display: string;
	total?: number;
	freeQuestions?: number;
	nextResetTime: string | null;
}

/**
 * Navigation action handlers
 * @interface NavigationActionHandlers
 */
export interface NavigationActionHandlers {
	onNavigateHome: () => void;
	onLogout: () => void;
	onSignUp: () => void;
	onGoogleLogin: () => void;
	onGetMorePoints: () => void;
}

/**
 * Navigation controller result structure
 * @interface NavigationControllerResult
 */
export interface NavigationControllerResult {
	appName: string;
	isHomePage: boolean;
	links: ReadonlyArray<NavigationMenuLink>;
	isAuthenticated: boolean;
	userDisplay?: NavigationUserDisplay;
	points: NavigationPointsState;
	actions: NavigationActionHandlers;
}
