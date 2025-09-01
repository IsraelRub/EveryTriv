/**
 * Technology constants for EveryTriv
 * Defines technology stack and technical information
 *
 * @module TechConstants
 * @description Technology stack and technical configuration constants
 * @used_by client/src/components/layout/Footer.tsx, docs/README.md
 */

// Technology stack item type
export interface TechStackItem {
	name: string;
	title: string;
}

// Technology stack
export const TECH_STACK: TechStackItem[] = [
	{ name: 'React', title: 'React' },
	{ name: 'TypeScript', title: 'TypeScript' },
	{ name: 'Tailwind CSS', title: 'Tailwind CSS' },
	{ name: 'Node.js', title: 'Node.js' },
	{ name: 'NestJS', title: 'NestJS' },
	{ name: 'PostgreSQL', title: 'PostgreSQL' },
];
