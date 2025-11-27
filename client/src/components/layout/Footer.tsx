import { Fragment } from 'react';
import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';

import { APP_NAME } from '@shared/constants';

import {
	ComponentSize,
	ContainerSize,
	FOOTER_CLASSNAMES,
	FOOTER_CONTACT,
	FOOTER_GRADIENTS,
	FOOTER_LINK_GROUPS,
	FOOTER_SOCIAL_LINKS,
	Spacing,
} from '../../constants';
import type { SocialLinkItem } from '../../types';
import { fadeInUp } from '../animations';
import { Icon } from '../ui/IconLibrary';
import { LayoutContainer as Container, GridLayout } from './GridLayout';

export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className={FOOTER_CLASSNAMES.wrapper}>
			<Container size={ContainerSize.XL} padding={Spacing.LG}>
				<GridLayout variant='balanced' gap={Spacing.LG}>
					{/* Company Info */}
					<motion.div variants={fadeInUp} initial='hidden' animate='visible'>
						<div className={FOOTER_CLASSNAMES.infoRow}>
							<div className={FOOTER_CLASSNAMES.brandBadge}>
								<Icon name='brain' size={ComponentSize.XL} className='text-white' />
							</div>
							<div>
								<h3 className='text-2xl font-semibold text-white' title={APP_NAME}>
									{APP_NAME}
								</h3>
								<p className='text-sm text-slate-400'>{FOOTER_CONTACT.description}</p>
							</div>
						</div>
						<p className={FOOTER_CLASSNAMES.description}>
							{FOOTER_CONTACT.tagline}. {FOOTER_CONTACT.features.join(', ')}.
						</p>
						<div className='space-y-3 text-sm'>
							<div className={FOOTER_CLASSNAMES.contactRow}>
								<Icon name='mail' size={ComponentSize.SM} className='mr-3 text-slate-400 group-hover:text-slate-200' />
								<span>{FOOTER_CONTACT.email}</span>
							</div>
							<div className='flex items-center text-slate-400'>
								<Icon name='globe' size={ComponentSize.SM} className='mr-3 text-slate-400' />
								<span>
									Made with <Icon name='heart' size={ComponentSize.SM} className='mx-1 text-red-400' /> for trivia
									enthusiasts worldwide
								</span>
							</div>
						</div>
					</motion.div>

					{/* Quick Links */}
					<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay: 0.1 }}>
						<h4 className='relative mb-6 text-sm font-semibold uppercase tracking-wide text-slate-300'>
							<span className={FOOTER_GRADIENTS.quick}>Quick Links</span>
							<div className={FOOTER_CLASSNAMES.titleUnderline}></div>
						</h4>
						<ul className='space-y-3'>
							{FOOTER_LINK_GROUPS.quick.map((link, index) => (
								<li key={index}>
									<Link to={link.path} className={FOOTER_CLASSNAMES.quickLink}>
										<Icon name='arrow-right' size={ComponentSize.XS} className='mr-2 text-slate-500' />
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</motion.div>

					{/* Social Links */}
					<motion.div variants={fadeInUp} initial='hidden' animate='visible' transition={{ delay: 0.2 }}>
						<h4 className='relative mb-6 text-sm font-semibold uppercase tracking-wide text-slate-300'>
							<span className={FOOTER_GRADIENTS.connect}>Connect</span>
							<div className={FOOTER_CLASSNAMES.titleUnderline}></div>
						</h4>
						<div className='flex flex-wrap gap-4'>
							{FOOTER_SOCIAL_LINKS.map((social: SocialLinkItem, index: number) => (
								<a
									key={index}
									href={social.url}
									target='_blank'
									rel='noopener noreferrer'
									className={FOOTER_CLASSNAMES.socialButton}
									title={social.name}
								>
									<Icon name={social.name.toLowerCase()} size={ComponentSize.LG} className='text-current' />
								</a>
							))}
						</div>
						<p className='text-slate-400 text-sm mt-4 leading-relaxed'>
							Follow us for updates, tips, and the latest trivia challenges!
						</p>
					</motion.div>
				</GridLayout>

				{/* Copyright */}
				<motion.div
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.3 }}
					className={FOOTER_CLASSNAMES.divider}
				>
					<div className={FOOTER_CLASSNAMES.copyright}>
						<p className='flex items-center gap-2 text-slate-400'>
							<Icon name='copyright' size={ComponentSize.XS} className='text-slate-500' />
							<span>{currentYear}</span>
							<span className='font-medium text-slate-300'>{APP_NAME}</span>
							<span>. All rights reserved.</span>
						</p>
						<div className={FOOTER_CLASSNAMES.metaLinks}>
							{FOOTER_LINK_GROUPS.meta.map((item, index) => (
								<Fragment key={item.path}>
									<Link to={item.path} className='hover:text-slate-300 transition-colors'>
										{item.label}
									</Link>
									{index < FOOTER_LINK_GROUPS.meta.length - 1 && (
										<Icon name='dot' size={ComponentSize.XS} className='text-slate-500' />
									)}
								</Fragment>
							))}
							<Icon name='dot' size={ComponentSize.XS} className='text-slate-500' />
							<span>
								Made with <Icon name='heart' size={ComponentSize.XS} className='inline text-red-400' /> for trivia
								lovers
							</span>
						</div>
					</div>
				</motion.div>
			</Container>
		</footer>
	);
}
