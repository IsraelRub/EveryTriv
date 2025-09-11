/**
 * Avatar Component
 *
 * @module Avatar
 * @description Advanced avatar component with fallback system, error handling, and performance optimizations
 * @used_by client/src/components/navigation/Navigation.tsx, client/src/views/user/UserProfile.tsx, client/src/components/leaderboard/Leaderboard.tsx
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { combineClassNames } from '../../utils/combineClassNames';
import { AVATAR_SIZES, AVATAR_BACKGROUND_COLORS, AVATAR_CONFIG } from '../../constants/ui';
import { AvatarProps } from '../../types';


export const Avatar = memo(function Avatar({
	src,
	username,
	fullName,
	firstName,
	lastName,
	size = 'md',
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

	// Generate initials from available name data
	const initials = useMemo(() => {
		if (fullName) {
			const names = fullName.trim().split(' ');
			if (names.length >= 2) {
				return (names[0][0] + names[names.length - 1][0]).toUpperCase();
			}
			return names[0][0].toUpperCase();
		}

		if (firstName && lastName) {
			return (firstName[0] + lastName[0]).toUpperCase();
		}

		if (username) {
			return username.substring(0, 2).toUpperCase();
		}

		return '?';
	}, [fullName, firstName, lastName, username]);

	// Generate background color based on initials
	const backgroundColor = useMemo(() => {
		const hash = initials.charCodeAt(0) + initials.charCodeAt(1);
		return AVATAR_BACKGROUND_COLORS[hash % AVATAR_BACKGROUND_COLORS.length];
	}, [initials]);

	// Handle image load success
	const handleImageLoad = useCallback(() => {
		setImageLoading(false);
		setImageError(false);
		setRetryCount(0);
	}, []);

	// Handle image load error with retry logic
	const handleImageError = useCallback(() => {
		if (retryCount < AVATAR_CONFIG.MAX_RETRIES) {
			setRetryCount(prev => prev + 1);
			setImageLoading(true);
			// Trigger re-render to retry loading
			setTimeout(() => {
				setImageError(false);
			}, AVATAR_CONFIG.RETRY_DELAY * retryCount); // Exponential backoff
		} else {
			setImageError(true);
			setImageLoading(false);
		}
	}, [retryCount]);

	// Determine what to display
	const shouldShowImage = src && !imageError && retryCount <= AVATAR_CONFIG.MAX_RETRIES;
	const shouldShowInitials = !shouldShowImage || imageError;

	// Calculate size
	const avatarSize = customSize || AVATAR_SIZES[size].pixels;
	const sizeClass = customSize ? '' : AVATAR_SIZES[size].classes;

	// Generate Gravatar URL as fallback
	const gravatarUrl = useMemo(() => {
		if (!username && !fullName) return null;
		
		const email = username ? `${username}@example.com` : fullName?.toLowerCase().replace(/\s+/g, '') + '@example.com';
		const hash = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
		return `${AVATAR_CONFIG.GRAVATAR_BASE_URL}/${hash}?d=${AVATAR_CONFIG.GRAVATAR_DEFAULT}&s=${avatarSize}`;
	}, [username, fullName, avatarSize]);

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
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
				</div>
			)}

			{/* Image */}
			{shouldShowImage && (
				<img
					src={src}
					alt={alt || `Avatar for ${username || fullName || 'user'}`}
					className="w-full h-full object-cover"
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
					alt={alt || `Gravatar for ${username || fullName || 'user'}`}
					className="w-full h-full object-cover"
					loading={lazy ? 'lazy' : 'eager'}
					onError={() => setImageError(true)}
				/>
			)}

			{/* Initials fallback */}
			{shouldShowInitials && (!gravatarUrl || imageError) && (
				<div className={`w-full h-full flex items-center justify-center ${backgroundColor}`}>
					<span className="text-white font-bold">
						{initials}
					</span>
				</div>
			)}

			{/* Error indicator */}
			{imageError && retryCount >= AVATAR_CONFIG.MAX_RETRIES && (
				<div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-white" />
			)}
		</motion.div>
	);
});
