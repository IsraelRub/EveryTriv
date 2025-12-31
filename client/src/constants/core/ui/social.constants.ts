import { Facebook, Instagram, MessageCircle, Send, Twitter, Youtube } from 'lucide-react';

import type { SocialPlatformData } from '@/types';

/**
 * Social media constants for EveryTriv Client
 * Defines social media platforms and sharing functionality
 *
 * @module SocialConstants
 * @description Social media and sharing configuration constants
 * @used_by client/src/components/layout/Footer.tsx, client/src/components/social/SocialShare.tsx
 */

// Social media links
export const SOCIAL_DATA: SocialPlatformData[] = [
	{
		name: 'Facebook',
		url: 'https://www.facebook.com/',
		hoverColor: 'hover:text-blue-600',
		shareColor: 'bg-blue-600 hover:bg-blue-700',
		icon: Facebook,
		getShareUrl: (text: string, url: string) =>
			`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
	},
	{
		name: 'X',
		url: 'https://twitter.com/netanyahu',
		hoverColor: 'hover:text-white',
		shareColor: 'bg-blue-400 hover:bg-blue-500',
		icon: Twitter,
		getShareUrl: (text: string, url: string) =>
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=EveryTriv,Trivia,Quiz`,
	},
	{
		name: 'YouTube',
		url: 'https://www.youtube.com/@amits24',
		hoverColor: 'hover:text-red-600',
		shareColor: 'bg-red-500 hover:bg-red-600',
		icon: Youtube,
	},
	{
		name: 'Instagram',
		url: 'https://www.instagram.com/idfonline/',
		hoverColor: 'hover:text-purple-500',
		shareColor: 'bg-pink-500 hover:bg-pink-600',
		icon: Instagram,
	},
	{
		name: 'Telegram',
		url: 'https://t.me/s/yinonews',
		hoverColor: 'hover:text-cyan-400',
		shareColor: 'bg-blue-500 hover:bg-blue-600',
		icon: Send,
		getShareUrl: (text: string, url: string) =>
			`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
	},
	{
		name: 'WhatsApp',
		url: 'https://wa.me/',
		hoverColor: 'hover:text-green-500',
		shareColor: 'bg-green-500 hover:bg-green-600',
		icon: MessageCircle,
		getShareUrl: (text: string, url: string) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
	},
];
