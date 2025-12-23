import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

import {
	FOOTER_COPYRIGHT_TEXT,
	FOOTER_SOCIAL_HEADING,
	FOOTER_SOCIAL_ICON_BASE,
	FOOTER_SOCIAL_ICON_MAP,
	FOOTER_SOCIAL_LINKS,
	FOOTER_SOCIAL_ORDER,
	FOOTER_SOCIAL_ROW_FIRST,
	FOOTER_SOCIAL_ROW_SECOND,
	ROUTES,
} from '@/constants';

import type { SocialLinkItem } from '@/types';

import { isSocialLinkItem } from '@/utils';

export default function Footer() {
	const currentYear = new Date().getFullYear();

	const firstRowLinks = useMemo(() => {
		return FOOTER_SOCIAL_ORDER.firstRow.reduce<SocialLinkItem[]>((acc, name) => {
			const link = FOOTER_SOCIAL_LINKS.find(link => link.name === name);
			if (isSocialLinkItem(link)) {
				acc.push(link);
			}
			return acc;
		}, []);
	}, []);

	const secondRowLinks = useMemo(() => {
		return FOOTER_SOCIAL_ORDER.secondRow.reduce<SocialLinkItem[]>((acc, name) => {
			const link = FOOTER_SOCIAL_LINKS.find(link => link.name === name);
			if (isSocialLinkItem(link)) {
				acc.push(link);
			}
			return acc;
		}, []);
	}, []);

	const getIcon = useCallback((linkName: string) => {
		return FOOTER_SOCIAL_ICON_MAP[linkName] || Share2;
	}, []);

	const renderSocialLinks = useCallback(
		(links: SocialLinkItem[], rowClassName: string) => {
			return (
				<div className={rowClassName}>
					{links.map(link => {
						const Icon = getIcon(link.name);
						return (
							<a
								key={link.name}
								href={link.url}
								target='_blank'
								rel='noopener noreferrer'
								className={`${FOOTER_SOCIAL_ICON_BASE} ${link.hoverColor}`}
							>
								<Icon className='w-5 h-5' />
							</a>
						);
					})}
				</div>
			);
		},
		[getIcon]
	);

	return (
		<motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='border-t border-border bg-card'>
			<div className='container mx-auto px-4 py-6'>
				<div className='flex flex-col gap-4'>
					<h5 className={FOOTER_SOCIAL_HEADING}>Follow Us:</h5>
					<div className='flex flex-col gap-2'>
						{renderSocialLinks(firstRowLinks, FOOTER_SOCIAL_ROW_FIRST)}
						{renderSocialLinks(secondRowLinks, FOOTER_SOCIAL_ROW_SECOND)}
					</div>
					<div className='flex flex-wrap gap-4 mt-2'>
						<Link to={ROUTES.PRIVACY} className='text-xs text-muted-foreground hover:text-foreground transition-colors'>
							Privacy Policy
						</Link>
						<Link to={ROUTES.TERMS} className='text-xs text-muted-foreground hover:text-foreground transition-colors'>
							Terms of Service
						</Link>
						<Link to={ROUTES.CONTACT} className='text-xs text-muted-foreground hover:text-foreground transition-colors'>
							Contact
						</Link>
					</div>
					<p className={FOOTER_COPYRIGHT_TEXT}>© {currentYear} Company ,RubinshDesign Inc</p>
				</div>
			</div>
		</motion.footer>
	);
}
