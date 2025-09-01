import type { TechStackItem } from 'everytriv-shared/constants';
import type { SocialLinkItem } from 'everytriv-shared/types';
import { Link } from 'react-router-dom';

import { APP_NAME, CONTACT_INFO, NAVIGATION_LINKS, SOCIAL_LINKS, TECH_STACK } from '../../constants';
import { FadeInUp } from '../animations';
import { Icon } from '../icons';
import { Container, GridLayout } from './index';

export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className='bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl text-white py-16 mt-20 border-t border-white/20 shadow-2xl'>
			<Container size='xl'>
				<GridLayout variant='content' gap='xl' className='grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
					{/* Company Info */}
					<FadeInUp className='col-span-1 md:col-span-2 lg:col-span-1'>
						<div className='flex items-center space-x-4 mb-6'>
							<div className='w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30'>
								<Icon name='brain' size='xl' className='text-white' />
							</div>
							<div>
								<h3 className='text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
									{APP_NAME}
								</h3>
								<p className='text-sm text-slate-400'>{CONTACT_INFO.description}</p>
							</div>
						</div>
						<p className='text-slate-300 mb-6 leading-relaxed'>
							{CONTACT_INFO.tagline}. {CONTACT_INFO.features.join(', ')}.
						</p>
						<div className='space-y-3 text-sm'>
							<div className='flex items-center text-slate-300 hover:text-white transition-colors group'>
								<Icon name='mail' size='sm' className='mr-3 text-blue-400 group-hover:text-blue-300' />
								<span>{CONTACT_INFO.email}</span>
							</div>
							<div className='flex items-center text-slate-300'>
								<Icon name='globe' size='sm' className='mr-3 text-purple-400' />
								<span>
									Made with <Icon name='heart' size='sm' className='mx-1 text-red-400' /> for trivia enthusiasts
									worldwide
								</span>
							</div>
						</div>
					</FadeInUp>

					{/* Quick Links */}
					<FadeInUp delay={0.1}>
						<h4 className='text-xl font-semibold text-white mb-6 relative'>
							<span className='bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
								Quick Links
							</span>
							<div className='absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full'></div>
						</h4>
						<ul className='space-y-3'>
							{NAVIGATION_LINKS.footer.quick.map((link, index) => (
								<li key={index}>
									<Link
										to={link.path}
										className='text-slate-300 hover:text-white hover:translate-x-2 transition-all duration-300 text-sm flex items-center group'
									>
										<Icon
											name='arrow-right'
											size='xs'
											className='mr-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity'
										/>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</FadeInUp>

					{/* Tech Stack */}
					<FadeInUp delay={0.2}>
						<h4 className='text-xl font-semibold text-white mb-6 relative'>
							<span className='bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent'>
								Built With
							</span>
							<div className='absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-green-400 to-blue-400 rounded-full'></div>
						</h4>
						<div className='flex flex-wrap gap-3'>
							        {TECH_STACK.map((tech: TechStackItem, index: number) => (
								<span
									key={index}
									className='bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-md text-slate-300 px-3 py-2 rounded-lg text-xs flex items-center border border-white/10 hover:border-white/20 hover:text-white transition-all duration-300 shadow-lg'
								>
									<Icon name={tech.name.toLowerCase().replace(/\s+/g, '')} size='sm' className='mr-2 text-blue-400' />
									{tech.name}
								</span>
							))}
						</div>
					</FadeInUp>

					{/* Social Links */}
					<FadeInUp delay={0.3}>
						<h4 className='text-xl font-semibold text-white mb-6 relative'>
							<span className='bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent'>
								Connect
							</span>
							<div className='absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full'></div>
						</h4>
						<div className='flex flex-wrap gap-4'>
							{SOCIAL_LINKS.map((social: SocialLinkItem, index: number) => (
								<a
									key={index}
									href={social.url}
									target='_blank'
									rel='noopener noreferrer'
									className='group bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-md p-3 rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110'
									title={social.name}
								>
									<Icon
										name={social.name.toLowerCase()}
										size='lg'
										className='text-slate-400 group-hover:text-white transition-colors'
									/>
								</a>
							))}
						</div>
						<p className='text-slate-400 text-sm mt-4 leading-relaxed'>
							Follow us for updates, tips, and the latest trivia challenges!
						</p>
					</FadeInUp>
				</GridLayout>

				{/* Copyright */}
				<FadeInUp className='border-t border-white/20 mt-12 pt-8 text-center' delay={0.4}>
					<div className='flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-6'>
						<p className='text-slate-400 text-sm'>
							© {currentYear} <span className='font-medium text-slate-300'>{APP_NAME}</span>. All rights reserved.
						</p>
						<div className='flex items-center space-x-4 text-xs text-slate-500'>
							<Link to='/privacy' className='hover:text-slate-300 transition-colors'>
								Privacy Policy
							</Link>
							<span>•</span>
							<Link to='/terms' className='hover:text-slate-300 transition-colors'>
								Terms of Service
							</Link>
							<span>•</span>
							<span>Made with <Icon name='heart' size='xs' className='inline text-red-400' /> for trivia lovers</span>
						</div>
					</div>
				</FadeInUp>
			</Container>
		</footer>
	);
}
