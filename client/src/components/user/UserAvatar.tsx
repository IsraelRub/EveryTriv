import { memo, useMemo } from 'react';

import { getDisplayNameFromUserFields } from '@shared/utils';

import { AvatarSize, AvatarVariant, DISPLAY_NAME_FALLBACKS } from '@/constants';
import type { UserAvatarProps } from '@/types';
import { ApiConfig } from '@/services';
import { getAvatarImageSource, toAbsoluteAvatarUrl } from '@/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const FALLBACK_TEXT_BY_SIZE: Record<AvatarSize, string> = {
	[AvatarSize.SM]: 'text-xs',
	[AvatarSize.NAV]: 'text-sm',
	[AvatarSize.MD]: 'text-sm',
	[AvatarSize.LG]: 'text-base',
	[AvatarSize.XL]: 'text-2xl',
	[AvatarSize.FULL]: 'text-sm',
};

export const UserAvatar = memo(function UserAvatar({
	source,
	size,
	name: nameProp,
	fallbackLetter = DISPLAY_NAME_FALLBACKS.PLAYER_SHORT,
	avatarId: avatarIdProp,
	src,
	pointerEventsNone = false,
	variant = AvatarVariant.DEFAULT,
}: UserAvatarProps) {
	const { avatarId, avatarUrl } = useMemo(
		() => ({
			avatarId: avatarIdProp ?? source?.avatar ?? undefined,
			avatarUrl: source?.avatarUrl ?? undefined,
		}),
		[source, avatarIdProp]
	);

	const rawSrc = src ?? getAvatarImageSource(avatarUrl, avatarId);
	const imageSrc = rawSrc ? (toAbsoluteAvatarUrl(rawSrc, ApiConfig.getBaseUrl()) ?? rawSrc) : undefined;

	const effectiveSize = size ?? AvatarSize.MD;
	const initials = imageSrc
		? fallbackLetter
		: (() => {
				const name = nameProp ?? getDisplayNameFromUserFields(source);
				const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
				const first = parts[0];
				const last = parts.length >= 2 ? parts[parts.length - 1] : undefined;
				return first && last
					? (first.charAt(0) + last.charAt(0)).toUpperCase()
					: first
						? first.charAt(0).toUpperCase()
						: fallbackLetter;
			})();

	return (
		<Avatar key={imageSrc ?? 'no-image'} size={effectiveSize} variant={variant} pointerEventsNone={pointerEventsNone}>
			{imageSrc && <AvatarImage src={imageSrc} />}
			<AvatarFallback className={FALLBACK_TEXT_BY_SIZE[effectiveSize]}>{initials}</AvatarFallback>
		</Avatar>
	);
});
