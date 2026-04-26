import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { AnimatedCopyFeedbackIconVariant, ButtonSize, GameKey, VariantBase } from '@/constants';
import type { LobbyRoomCodeBlockProps } from '@/types';
import { AnimatedCopyFeedbackIcon, Button } from '@/components';

export const LobbyRoomCodeBlock = memo(function LobbyRoomCodeBlock({
	roomCode,
	copied,
	onCopy,
}: LobbyRoomCodeBlockProps) {
	const { t } = useTranslation('game');

	return (
		<div className='flex w-full max-w-full flex-col items-center gap-2 sm:flex-row sm:items-stretch sm:justify-center sm:gap-3'>
			<span className='shrink-0 text-sm text-muted-foreground sm:self-center sm:whitespace-nowrap'>
				{t(GameKey.ROOM_CODE)}
			</span>
			<div className='flex min-w-0 max-w-full flex-1 items-stretch overflow-hidden rounded-lg border border-border bg-card shadow-sm sm:max-w-md sm:flex-initial'>
				<span className='flex min-h-10 min-w-0 flex-1 items-center px-4 py-2 font-mono text-lg tracking-wide text-foreground'>
					{roomCode}
				</span>
				<Button
					type='button'
					variant={VariantBase.DEFAULT}
					size={ButtonSize.ICON_LG}
					onClick={onCopy}
					className='h-auto min-h-10 w-11 shrink-0 rounded-none rounded-e-lg border-s border-primary-foreground/15'
				>
					<AnimatedCopyFeedbackIcon success={copied} variant={AnimatedCopyFeedbackIconVariant.ON_PRIMARY} />
				</Button>
			</div>
		</div>
	);
});
