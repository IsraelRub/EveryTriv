import { useMemo, type ReactNode } from 'react';
import { Share2 } from 'lucide-react';

import { isSocialLinkItem } from '@shared/utils';

import { FOOTER_SECTIONS, SOCIAL_DATA } from '@/constants';
import { NavLink } from '@/components';
import { cn } from '@/utils';

export default function Footer() {
	const socialLinks = useMemo(() => SOCIAL_DATA.filter(isSocialLinkItem), []);
	const socialCells = useMemo((): ReactNode[] => {
		const cells: ReactNode[] = [];
		let iconIndex = 0;
		const totalSlots = Math.ceil(socialLinks.length / 3) * 4;
		for (let slot = 0; slot < totalSlots; slot++) {
			if ((slot + 1) % 4 === 0) {
				cells.push(<div key={`empty-${slot}`} />);
			} else {
				const link = socialLinks[iconIndex];
				if (link) {
					const Icon = link.icon ?? Share2;
					cells.push(
						<a
							key={link.name}
							href={link.url}
							target='_blank'
							rel='noopener noreferrer'
							className={cn('text-muted-foreground transition-colors duration-200 ease-in-out', link.hoverColor)}
						>
							<Icon className='w-5 h-5' />
						</a>
					);
					iconIndex++;
				}
			}
		}
		return cells;
	}, [socialLinks]);

	return (
		<footer className='border-t border-border bg-card animate-fade-in-only'>
			<div className='container mx-auto px-4 py-4'>
				<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
					{FOOTER_SECTIONS.map(section => (
						<div key={section.title} className='flex flex-col gap-2'>
							<h5 className='text-sm font-semibold text-muted-foreground mb-2'>{section.title}</h5>
							{section.type === 'social' && <div className='grid grid-cols-4 gap-3'>{socialCells}</div>}
							{section.type === 'links' && (
								<div className='flex flex-col gap-2'>
									{section.links.map(link => (
										<NavLink
											key={link.path}
											to={link.path}
											className='text-xs text-muted-foreground hover:text-foreground transition-colors'
										>
											{link.label}
										</NavLink>
									))}
								</div>
							)}
							{section.type === 'copyright' && (
								<p className='text-xs text-muted-foreground mt-2'>© {new Date().getFullYear()} RubinshDesign Inc</p>
							)}
						</div>
					))}
				</div>
			</div>
		</footer>
	);
}
