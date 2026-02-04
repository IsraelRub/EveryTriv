export type FooterSection =
	| { title: string; type: 'social' }
	| { title: string; type: 'links'; links: readonly { label: string; path: string }[] }
	| { title: string; type: 'copyright' };
