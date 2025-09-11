/**
 * Social media constants for EveryTriv
 * Defines social media platforms and sharing functionality
 *
 * @module SocialConstants
 * @description Social media and sharing configuration constants
 * @used_by client/src/components/layout/SocialShare.tsx, client/src/components/layout/Footer.tsx
 */

// Social media platforms for sharing
export const SHARE_PLATFORMS = [
	{
		name: 'Twitter',
		color: 'bg-blue-400 hover:bg-blue-500',
		getUrl: (text: string, url: string) =>
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=EveryTriv,Trivia,Quiz`,
	},
	{
		name: 'Facebook',
		color: 'bg-blue-600 hover:bg-blue-700',
		getUrl: (text: string, url: string) =>
			`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
	},
	{
		name: 'LinkedIn',
		color: 'bg-blue-700 hover:bg-blue-800',
		getUrl: (text: string, url: string) =>
			`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`,
	},
	{
		name: 'WhatsApp',
		color: 'bg-green-500 hover:bg-green-600',
		getUrl: (text: string, url: string) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
	},
	{
		name: 'Telegram',
		color: 'bg-blue-500 hover:bg-blue-600',
		getUrl: (text: string, url: string) =>
			`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
	},
] as const;

// Social media links
export const SOCIAL_LINKS = [
	{
		name: 'Facebook',
		url: 'https://facebook.com/everytrivia',
		hoverColor: 'hover:text-blue-500',
		shareColor: 'bg-blue-600 hover:bg-blue-700',
	},
	{
		name: 'Twitter',
		url: 'https://twitter.com/everytrivia',
		hoverColor: 'hover:text-sky-400',
		shareColor: 'bg-blue-400 hover:bg-blue-500',
	},
	{
		name: 'Instagram',
		url: 'https://instagram.com/everytrivia',
		hoverColor: 'hover:text-pink-500',
		shareColor: 'bg-pink-500 hover:bg-pink-600',
	},
	{
		name: 'YouTube',
		url: 'https://youtube.com/@everytrivia',
		hoverColor: 'hover:text-red-500',
		shareColor: 'bg-red-500 hover:bg-red-600',
	},
	{
		name: 'LinkedIn',
		url: 'https://linkedin.com/company/everytrivia',
		hoverColor: 'hover:text-blue-600',
		shareColor: 'bg-blue-700 hover:bg-blue-800',
	},
] as const;
