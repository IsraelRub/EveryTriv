/**
 * Social Component Types for EveryTriv Client
 *
 * @module SocialComponentTypes
 * @description Social media and sharing component types
 */

/**
 * Social link item interface
 * @interface SocialLinkItem
 * @description Social media link configuration for sharing and navigation
 * @used_by client/src/components/layout/Footer.tsx (Footer component), client/src/components/social/SocialShare.tsx
 */
export interface SocialLinkItem {
	name: string;
	url: string;
	hoverColor: string;
	shareColor: string;
	iconName?: string;
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
