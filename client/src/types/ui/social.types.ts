/**
 * Social Component Types for EveryTriv Client
 *
 * @module SocialComponentTypes
 * @description Social media and sharing component types
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Social link item interface
 * @interface SocialLinkItem
 * @description Social media link configuration for sharing and navigation
 * @used_by client/src/components/layout/Footer.tsx (Footer component)
 */
export interface SocialLinkItem {
	name: string;
	url: string;
	hoverColor: string;
	shareColor: string;
	icon?: LucideIcon;
}

/**
 * Social platform with sharing capability
 * @interface SocialSharePlatform
 * @description Social media platform configuration with sharing functionality
 * @used_by client/src/components/social/SocialShare.tsx
 */
export interface SocialSharePlatform {
	name: string;
	url: string;
	hoverColor: string;
	shareColor: string;
	icon?: LucideIcon;
	getShareUrl: (text: string, url: string) => string;
}

/**
 * Social platform data item (can be either link or share platform)
 * @interface SocialPlatformData
 * @description Base social media platform data structure
 * @used_by client/src/constants/core/ui/social.constants.ts
 */
export interface SocialPlatformData {
	name: string;
	url: string;
	hoverColor: string;
	shareColor: string;
	icon?: LucideIcon;
	getShareUrl?: (text: string, url: string) => string;
}

/**
 * Social share component props
 * @interface SocialShareProps
 * @description Props for the SocialShare component
 * @used_by client/src/components/social/SocialShare.tsx
 */
export interface SocialShareProps {
	score: number;
	total: number;
	topic?: string;
	difficulty?: string;
	className?: string;
}
