import type { IconType } from 'react-icons';

export interface SocialLinkItem {
	name: string;
	url: string;
	hoverColor: string;
	shareColor: string;
	icon?: IconType;
}

export interface SocialSharePlatform {
	name: string;
	url: string;
	hoverColor: string;
	shareColor: string;
	icon?: IconType;
	getShareUrl: (text: string, url: string) => string;
}

export interface SocialPlatformData {
	name: string;
	url: string;
	hoverColor: string;
	shareColor: string;
	icon?: IconType;
	getShareUrl?: (text: string, url: string) => string;
}

export interface SocialShareProps {
	score: number;
	total: number;
	topic?: string;
	difficulty?: string;
	className?: string;
}
