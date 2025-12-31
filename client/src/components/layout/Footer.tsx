import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

import { NAVIGATION_LINKS, SOCIAL_DATA } from '@/constants';
import { NavLink } from '@/components';
import { cn, isSocialLinkItem } from '@/utils';

export default function Footer() {
	const currentYear = new Date().getFullYear();

	const socialLinks = SOCIAL_DATA.filter(isSocialLinkItem);

	return (
		<motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='border-t border-border bg-card'>
			<div className='container mx-auto px-4 py-4'>
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
					<div className='flex flex-col gap-2'>
						<h5 className='text-sm font-semibold text-muted-foreground mb-2'>Follow Us:</h5>
						<div className='grid grid-cols-3 gap-4'>
							{socialLinks.map(link => {
								const Icon = link.icon || Share2;
								return (
									<a
										key={link.name}
										href={link.url}
										target='_blank'
										rel='noopener noreferrer'
										className={cn('text-muted-foreground transition-all duration-200 ease-in-out', link.hoverColor)}
									>
										<Icon className='w-5 h-5' />
									</a>
								);
							})}
						</div>
					</div>
					<div className='flex flex-col gap-2'>
						<h5 className='text-sm font-semibold text-muted-foreground mb-2'>Quick Links</h5>
						<div className='flex flex-col gap-2'>
							{NAVIGATION_LINKS.footer.quick.map(link => (
								<NavLink
									key={link.path}
									to={link.path}
									className='text-xs text-muted-foreground hover:text-foreground transition-colors'
								>
									{link.label}
								</NavLink>
							))}
						</div>
					</div>
					<div className='flex flex-col gap-2'>
						<h5 className='text-sm font-semibold text-muted-foreground mb-2'>Legal</h5>
						<div className='flex flex-col gap-2'>
							{NAVIGATION_LINKS.footer.legal.map(link => (
								<NavLink
									key={link.path}
									to={link.path}
									className='text-xs text-muted-foreground hover:text-foreground transition-colors'
								>
									{link.label}
								</NavLink>
							))}
						</div>
					</div>
					<div className='flex flex-col gap-2'>
						<h5 className='text-sm font-semibold text-muted-foreground mb-2'>Company</h5>
						<p className='text-xs text-muted-foreground mt-2'>© {currentYear} RubinshDesign Inc</p>
					</div>
				</div>
			</div>
		</motion.footer>
	);
}
