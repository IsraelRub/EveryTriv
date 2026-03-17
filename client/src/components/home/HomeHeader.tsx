import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, History, Trophy } from 'lucide-react';

import { APP_NAME } from '@shared/constants';

import { ANIMATION_CONFIG, ANIMATION_DELAYS, HomeKey, ROUTES, VariantBase } from '@/constants';
import type { HomeHeaderProps } from '@/types';
import { Button, Card } from '@/components';

export function HomeHeader({ isAuthenticated, firstName, showWelcome, showGuestContent, action }: HomeHeaderProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<div className='space-y-3 md:space-y-4 lg:space-y-6 flex-shrink-0'>
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: ANIMATION_CONFIG.DURATION.NORMAL }}
				className='text-center space-y-2 md:space-y-3 lg:space-y-4'
			>
				<div className='flex flex-wrap items-center justify-center gap-3 md:gap-4'>
					<img
						src='/assets/logo.svg'
						alt=''
						aria-hidden='true'
						className='h-24 w-24 shrink-0 object-contain md:h-28 md:w-28 lg:h-32 lg:w-32'
						width={128}
						height={128}
					/>
					<h1 className='text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary leading-tight py-1 md:py-2 lg:py-3'>
						<span className='bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
							{APP_NAME}
						</span>
					</h1>
				</div>
				<p className='text-base md:text-lg lg:text-xl text-muted-foreground view-centered-2xl'>{t(HomeKey.TAGLINE)}</p>
			</motion.div>
			{showWelcome && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: ANIMATION_DELAYS.SEQUENCE_MEDIUM }}
					className={action ? 'flex flex-col items-center justify-center gap-4 text-center' : 'text-center mb-6'}
				>
					<h2 className='text-xl md:text-2xl lg:text-3xl font-medium text-muted-foreground'>
						{isAuthenticated && firstName ? (
							<>
								{t(HomeKey.WELCOME_BACK_PREFIX)}
								<span className='text-blue-600 font-medium'>{firstName}</span>!
							</>
						) : (
							t(HomeKey.GUEST_CTA)
						)}
					</h2>
					{action && <div className='flex items-center justify-center gap-4 flex-wrap'>{action}</div>}
				</motion.div>
			)}
			{showGuestContent && !isAuthenticated && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: ANIMATION_DELAYS.SEQUENCE_LARGE }}
					className='mt-8'
				>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<Card className='p-6 card-primary-tint backdrop-blur-sm'>
							<div className='flex flex-col items-center text-center space-y-4'>
								<div className='p-3 rounded-full bg-primary/10'>
									<BarChart3 className='w-8 h-8 text-primary' />
								</div>
								<h3 className='text-lg font-semibold'>{t(HomeKey.TRACK_STATS_TITLE)}</h3>
								<p className='text-sm text-muted-foreground'>{t(HomeKey.TRACK_STATS_DESC)}</p>
							</div>
						</Card>

						<Card className='p-6 card-primary-tint backdrop-blur-sm'>
							<div className='flex flex-col items-center text-center space-y-4'>
								<div className='p-3 rounded-full bg-primary/10'>
									<Trophy className='w-8 h-8 text-primary' />
								</div>
								<h3 className='text-lg font-semibold'>{t(HomeKey.COMPETE_TITLE)}</h3>
								<p className='text-sm text-muted-foreground'>{t(HomeKey.COMPETE_DESC)}</p>
							</div>
						</Card>

						<Card className='p-6 card-primary-tint backdrop-blur-sm'>
							<div className='flex flex-col items-center text-center space-y-4'>
								<div className='p-3 rounded-full bg-primary/10'>
									<History className='w-8 h-8 text-primary' />
								</div>
								<h3 className='text-lg font-semibold'>{t(HomeKey.SAVE_HISTORY_TITLE)}</h3>
								<p className='text-sm text-muted-foreground'>{t(HomeKey.SAVE_HISTORY_DESC)}</p>
							</div>
						</Card>

						<div className='col-span-full text-center mt-4'>
							<p className='text-muted-foreground mb-4'>{t(HomeKey.CREATE_ACCOUNT_CTA)}</p>
							<div className='flex justify-center gap-4'>
								<Button onClick={() => navigate(ROUTES.REGISTER)}>{t(HomeKey.REGISTER_NOW)}</Button>
								<Button variant={VariantBase.OUTLINE} onClick={() => navigate(ROUTES.LOGIN)}>
									{t(HomeKey.LOGIN)}
								</Button>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</div>
	);
}
