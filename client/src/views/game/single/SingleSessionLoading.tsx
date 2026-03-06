import { LoadingMessages } from '@/constants';
import { FullPageSpinner } from '@/components';
import type { SingleSessionLoadingProps } from '@/types';

export function SingleSessionLoading({ message, showSpinner = true, onBeforeNavigate }: SingleSessionLoadingProps) {
	return (
		<FullPageSpinner
			message={message as LoadingMessages}
			showSpinner={showSpinner}
			onBeforeNavigate={onBeforeNavigate}
		/>
	);
}
