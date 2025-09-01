/**
 * UI types for EveryTriv
 * Shared between client and server
 *
 * @module UITypes
 * @description User interface related type definitions
 */

/**
 * Social link item interface
 * @interface SocialLinkItem
 * @description Social media link structure
 * @used_by client/src/components/layout/Footer.tsx (Footer component)
 */
export interface SocialLinkItem {
	/** Social platform name */
	name: string;
	/** Social platform URL */
	url: string;
	/** Hover color class */
	hoverColor: string;
	/** Share button color class */
	shareColor: string;
}
