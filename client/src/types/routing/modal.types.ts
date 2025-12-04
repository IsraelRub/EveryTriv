/**
 * Modal Route Types
 * @module ModalRouteTypes
 * @description Type definitions for modal routing system
 */

import type { ReactNode } from 'react';

import { ModalSize } from '@/constants/ui/size.constants';

/**
 * Modal route state interface
 * @interface ModalRouteState
 * @description State passed via React Router location.state to indicate modal mode
 */
export interface ModalRouteState {
	modal: boolean;
	returnUrl?: string;
}

/**
 * Modal route wrapper props
 * @interface ModalRouteProps
 * @description Props for ModalRouteWrapper component
 */
export interface ModalRouteProps {
	children: ReactNode;
	modalSize?: ModalSize;
}

/**
 * Use modal route hook return type
 * @interface UseModalRouteReturn
 * @description Return type for useModalRoute hook
 */
export interface UseModalRouteReturn {
	isModal: boolean;
	closeModal: () => void;
	returnUrl?: string;
}
