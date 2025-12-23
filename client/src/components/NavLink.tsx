import { useCallback, type MouseEvent } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';

import { AudioKey } from '@/constants';

import { useAudio } from '@/hooks';

import type { NavLinkProps } from '@/types';

import { cn } from '@/utils';

export function NavLink({ className, activeClassName, onClick, ...props }: NavLinkProps) {
	const audioService = useAudio();

	const handleClick = useCallback(
		(e: MouseEvent<HTMLAnchorElement>) => {
			audioService.play(AudioKey.PAGE_CHANGE);
			onClick?.(e);
		},
		[onClick, audioService]
	);

	return (
		<RouterNavLink
			className={({ isActive }) => cn(className, isActive && activeClassName)}
			onClick={handleClick}
			{...props}
		/>
	);
}
