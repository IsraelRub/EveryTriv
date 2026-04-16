import { useCallback, useEffect, useRef, useState } from 'react';

import { TIME_PERIODS_MS } from '@shared/constants';

import type { UseClipboardCopyParams } from '@/types';

export function useClipboardCopy({ text, onSuccess, onError }: UseClipboardCopyParams): {
	copied: boolean;
	copy: () => Promise<void>;
} {
	const onSuccessRef = useRef(onSuccess);
	const onErrorRef = useRef(onError);

	onSuccessRef.current = onSuccess;
	onErrorRef.current = onError;

	const [copied, setCopied] = useState(false);

	const copy = useCallback(async () => {
		if (text == null || text === '') {
			return;
		}
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), TIME_PERIODS_MS.TWO_SECONDS);
			onSuccessRef.current?.();
		} catch (error) {
			onErrorRef.current?.(error);
		}
	}, [text]);

	useEffect(() => {
		setCopied(false);
	}, [text]);

	return { copied, copy };
}
