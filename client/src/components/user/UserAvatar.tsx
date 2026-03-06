import { memo, useMemo } from 'react';
import { cva } from 'class-variance-authority';

import { AvatarSize, DISPLAY_NAME_FALLBACKS } from '@/constants';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserAvatarProps } from '@/types';
import { cn, getAvatarUrl, getDisplayNameFromPlayer, getDisplayNameFromUser } from '@/utils';

const userAvatarSizeVariants = cva('rounded-full', {
	variants: {
		size: {
			[AvatarSize.SM]: 'h-6 w-6',
			[AvatarSize.NAV]: 'h-9 w-9',
			[AvatarSize.MD]: 'h-10 w-10',
			[AvatarSize.LG]: 'h-12 w-12',
			[AvatarSize.XL]: 'h-20 w-20',
		},
	},
	defaultVariants: { size: AvatarSize.MD },
});

function UserAvatarComponent({
	className,
	fallbackClassName,
	size,
	user,
	player,
	name: nameProp,
	fallbackLetter = DISPLAY_NAME_FALLBACKS.PLAYER_SHORT,
	avatarId: avatarIdProp,
	src,
}: UserAvatarProps) {
	const { name, avatarId } = useMemo(() => {
		const derivedName =
			user != null
				? getDisplayNameFromUser(user)
				: player != null
					? getDisplayNameFromPlayer(player, DISPLAY_NAME_FALLBACKS.EMPTY)
					: '';
		const derivedAvatarId = user?.avatar ?? player?.avatar ?? undefined;
		return {
			name: nameProp ?? derivedName,
			avatarId: avatarIdProp ?? derivedAvatarId,
		};
	}, [user, player, nameProp, avatarIdProp]);

	const imageSrc = src ?? (avatarId != null ? getAvatarUrl(avatarId) : undefined);

	const trimmed = name?.trim();
	const parts = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
	const first = parts[0];
	const last = parts.length >= 2 ? parts[parts.length - 1] : undefined;

	const initials =
		first && last
			? `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
			: first
				? first.charAt(0).toUpperCase()
				: fallbackLetter;

	const sizeClass = userAvatarSizeVariants({ size: size ?? AvatarSize.MD });

	return (
		<Avatar className={cn(sizeClass, className)}>
			{imageSrc && <AvatarImage src={imageSrc} />}
			<AvatarFallback className={cn('text-sm', fallbackClassName)}>{initials}</AvatarFallback>
		</Avatar>
	);
}

export const UserAvatar = memo(UserAvatarComponent);
