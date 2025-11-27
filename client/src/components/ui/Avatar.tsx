/**
 * Avatar Component
 *
 * @module Avatar
 * @description Advanced avatar component with fallback system, error handling, and performance optimizations
 * @used_by client/src/components/navigation, client/src/views/user, client/src/components/leaderboard
 */

import { memo, useCallback, useMemo, useState } from 'react';

import { motion } from 'framer-motion';

import { HTTP_CLIENT_CONFIG } from '@shared/constants';

import { AVATAR_BACKGROUND_COLORS, AVATAR_CONFIG, AVATAR_SIZES, ComponentSize } from '../../constants';
import { AvatarProps } from '../../types';
import { combineClassNames } from '../../utils';

export const Avatar = memo(function Avatar({
	src,
	email,
	firstName,
	lastName,
	size = ComponentSize.MD,
	customSize,
	className,
	alt,
	showLoading = true,
	lazy = true,
	onClick,
	clickable = false,
}: AvatarProps) {
	const [imageError, setImageError] = useState(false);
	const [imageLoading, setImageLoading] = useState(true);
	const [retryCount, setRetryCount] = useState(0);

	const initials = useMemo(() => {
		if (firstName && lastName) {
			return (firstName[0] + lastName[0]).toUpperCase();
		}

		if (firstName) {
			return firstName[0].toUpperCase();
		}

		if (email) {
			return email.substring(0, 2).toUpperCase();
		}

		return '?';
	}, [firstName, lastName, email]);

	const backgroundColor = useMemo(() => {
		const hash = initials.charCodeAt(0) + initials.charCodeAt(1);
		return AVATAR_BACKGROUND_COLORS[hash % AVATAR_BACKGROUND_COLORS.length];
	}, [initials]);

	const handleImageLoad = useCallback(() => {
		setImageLoading(false);
		setImageError(false);
		setRetryCount(0);
	}, []);

	const handleImageError = useCallback(() => {
		if (retryCount < AVATAR_CONFIG.MAX_RETRIES) {
			setRetryCount(prev => prev + 1);
			setImageLoading(true);
			setTimeout(() => {
				setImageError(false);
			}, HTTP_CLIENT_CONFIG.RETRY_DELAY * retryCount);
		} else {
			setImageError(true);
			setImageLoading(false);
		}
	}, [retryCount]);

	const shouldShowImage = src && !imageError && retryCount <= AVATAR_CONFIG.MAX_RETRIES;
	const shouldShowInitials = !shouldShowImage || imageError;

	const avatarSize = customSize ?? AVATAR_SIZES[size]?.pixels ?? AVATAR_SIZES[ComponentSize.MD].pixels;
	const sizeClass = customSize ? '' : AVATAR_SIZES[size].classes;

	const gravatarUrl = useMemo(() => {
		if (!email?.trim() && !firstName?.trim()) return null;

		const gravatarEmail =
			email || `${firstName}${lastName ? lastName : ''}`.toLowerCase().replace(/\s+/g, '') + '@example.com';
		const hash = btoa(gravatarEmail)
			.replace(/[^a-zA-Z0-9]/g, '')
			.substring(0, 32);
		return `${AVATAR_CONFIG.GRAVATAR_BASE_URL}/${hash}?d=${AVATAR_CONFIG.GRAVATAR_DEFAULT}&s=${avatarSize}`;
	}, [email, firstName, lastName, avatarSize]);

	const avatarClasses = combineClassNames(
		'relative inline-flex items-center justify-center rounded-full border-2 border-white/20 overflow-hidden',
		'bg-gradient-to-br from-slate-600 to-slate-700',
		'text-white font-semibold select-none',
		sizeClass,
		clickable || onClick ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : '',
		className
	);

	return (
		<motion.div
			className={avatarClasses}
			style={customSize ? { width: customSize, height: customSize } : undefined}
			onClick={onClick}
			whileHover={clickable || onClick ? { scale: 1.05 } : undefined}
			whileTap={clickable || onClick ? { scale: 0.95 } : undefined}
		>
			{/* Loading state */}
			{showLoading && imageLoading && shouldShowImage && (
				<div className='absolute inset-0 flex items-center justify-center'>
					<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
				</div>
			)}

			{/* Image */}
			{shouldShowImage && (
				<img
					src={src}
					alt={
						alt ?? `Avatar for ${email ?? (firstName && lastName ? `${firstName} ${lastName}` : firstName) ?? 'user'}`
					}
					className='w-full h-full object-cover'
					loading={lazy ? 'lazy' : 'eager'}
					onLoad={handleImageLoad}
					onError={handleImageError}
					style={{ display: imageLoading ? 'none' : 'block' }}
				/>
			)}

			{/* Gravatar fallback */}
			{shouldShowInitials && gravatarUrl && retryCount === 0 && (
				<img
					src={gravatarUrl}
					alt={
						alt ?? `Gravatar for ${email ?? (firstName && lastName ? `${firstName} ${lastName}` : firstName) ?? 'user'}`
					}
					className='w-full h-full object-cover'
					loading={lazy ? 'lazy' : 'eager'}
					onError={() => setImageError(true)}
				/>
			)}

			{/* Initials fallback */}
			{shouldShowInitials && (!gravatarUrl || imageError) && (
				<div className={`w-full h-full flex items-center justify-center ${backgroundColor}`}>
					<span className='text-white font-bold'>{initials}</span>
				</div>
			)}

			{/* Error indicator */}
			{imageError && retryCount >= AVATAR_CONFIG.MAX_RETRIES && (
				<div className='absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-white' />
			)}
		</motion.div>
	);
});
