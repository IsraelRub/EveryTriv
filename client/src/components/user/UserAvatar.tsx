import { memo, useEffect, useMemo } from 'react';

import { getDisplayNameFromUserFields } from '@shared/utils';

import { AvatarSize, AvatarVariant, DISPLAY_NAME_FALLBACKS } from '@/constants';
import type { UserAvatarProps } from '@/types';
import { ApiConfig, clientLogger as logger } from '@/services';
import { getAvatarImageSource, toAbsoluteAvatarUrl } from '@/utils';
import { Avatar, AvatarFallback, avatarFallbackTextVariants, AvatarImage } from '@/components/ui/avatar';

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
	const imageSrc = rawSrc ? (toAbsoluteAvatarUrl(rawSrc, ApiConfig.baseUrl) ?? rawSrc) : undefined;

	useEffect(() => {
		logger.userDebug('UserAvatar image source', {
			imageSrc,
			rawSrc,
			avatarUrl,
			avatar: avatarId ?? null,
			src: src ?? null,
		});
	}, [imageSrc, rawSrc, avatarUrl, avatarId, src]);

	const effectiveSize = size ?? AvatarSize.MD;
	const initials = useMemo(() => {
		const name = nameProp ?? getDisplayNameFromUserFields(source);
		const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
		const first = parts[0];
		const last = parts.length >= 2 ? parts[parts.length - 1] : undefined;
		if (first != null && last != null) {
			return (first.charAt(0) + last.charAt(0)).toUpperCase();
		}
		if (first != null) {
			return first.charAt(0).toUpperCase();
		}
		return fallbackLetter;
	}, [nameProp, source, fallbackLetter]);

	return (
		<Avatar key={imageSrc ?? 'no-image'} size={effectiveSize} variant={variant} pointerEventsNone={pointerEventsNone}>
			{imageSrc && (
				<AvatarImage
					src={imageSrc}
					onError={() => {
						logger.mediaWarn('Avatar image failed to load', {
							url: imageSrc,
							...(avatarId != null && { avatar: avatarId }),
							baseUrl: avatarUrl,
						});
					}}
				/>
			)}
			<AvatarFallback className={avatarFallbackTextVariants({ size: effectiveSize })}>{initials}</AvatarFallback>
		</Avatar>
	);
});
