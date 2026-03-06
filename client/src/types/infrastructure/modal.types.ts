import type { ReactNode } from 'react';

import { ComponentSize } from '@/constants';

export interface ModalRouteProps {
	children: ReactNode;
	modalSize?: ComponentSize;
}

export interface UseModalRouteReturn {
	isModal: boolean;
	closeModal: () => void;
	returnUrl?: string;
}
