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
 * @used_by client/src/components/layout/Footer.tsx (Footer component)
 */
export interface SocialLinkItem {
	name: string;
	url: string;
	hoverColor: string;
	shareColor: string;
}
