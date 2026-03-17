import type { ReactElement } from 'react';

import { ComponentSize } from '@/constants';

export interface ModalRouteProps {
	children: ReactElement | ReactElement[];
	modalSize?: ComponentSize;
}

export interface UseModalRouteReturn {
	isModal: boolean;
	closeModal: () => void;
	returnUrl?: string;
}
