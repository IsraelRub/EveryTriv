import type { ReactNode } from 'react';

import { ModalSize } from '@/constants';

export interface ModalRouteProps {
	children: ReactNode;
	modalSize?: ModalSize;
}

export interface UseModalRouteReturn {
	isModal: boolean;
	closeModal: () => void;
	returnUrl?: string;
}
