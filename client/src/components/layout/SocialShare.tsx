import { DifficultyLevel } from '@shared';
import { calculatePercentage } from '@shared';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { clientLogger } from '@shared';

import { SHARE_PLATFORMS } from '../../constants';
import { SocialShareProps } from '../../types';
import { motion } from 'framer-motion';
import { fadeInUp, hoverScale, scaleIn, createStaggerContainer } from '../animations';
import { Icon } from '../icons';
import { ResponsiveGrid } from './GridLayout';

export default function SocialShare({
	score,
	total,
	topic = 'Trivia',
	difficulty = DifficultyLevel.MEDIUM,
	className = '',
}: SocialShareProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	const percentage = calculatePercentage(score || 0, total || 0);
	const scoreText = `Just scored ${score}/${total} (${percentage}%) on ${topic} ${difficulty} difficulty in EveryTriv!`;

	const shareUrl = `${window.location.origin}?challenge=${encodeURIComponent(topic)}&difficulty=${difficulty}`;

	const socialPlatforms = SHARE_PLATFORMS.map((platform) => ({
		...platform,
		url: platform.getUrl(scoreText, shareUrl),
		icon: getIconForPlatform(platform.name),
	}));

	function getIconForPlatform(platformName: string): string {
		switch (platformName) {
			case 'Twitter':
				return 'twitter';
			case 'Facebook':
				return 'facebook';
			case 'LinkedIn':
				return 'linkedin';
			case 'WhatsApp':
				return 'message-circle';
			case 'Telegram':
				return 'send';
			default:
				return 'link';
		}
	}

	const handleShare = (url: string) => {
		window.open(url, '_blank', 'width=600,height=400');
		setIsOpen(false);
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(`${scoreText} ${shareUrl}`);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			clientLogger.userError('Failed to copy link to clipboard', { 
				error: error instanceof Error ? error.message : String(error) 
			});
		}
	};

	// Don't show if no game played
	if (total === 0) return null;

	return (
		<div className={`relative ${className}`}>
			{/* Share Button */}
			<motion.div
				variants={hoverScale}
				initial="normal"
				whileHover="hover"
			>
				<button
					onClick={() => setIsOpen(!isOpen)}
					className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 
                   hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-medium 
                   shadow-lg transition-all duration-200'
				>
					<Icon name='share' size='sm' />
					<span>Share Score</span>
				</button>
			</motion.div>

			{/* Share Options Panel */}
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop */}
						<div className='fixed inset-0 bg-black/20 backdrop-blur-sm z-40' onClick={() => setIsOpen(false)} />

						{/* Share Panel */}
						<motion.div
							variants={scaleIn}
							initial="hidden"
							animate="visible"
							className='absolute top-full mt-2 right-0 bg-slate-800/95 backdrop-blur-lg 
                         border border-slate-600 rounded-xl shadow-2xl p-6 w-80 z-50'
						>
							{/* Header */}
							<div className='flex items-center justify-between mb-4'>
								<h3 className='text-white font-semibold'>Share Your Achievement!</h3>
								<button onClick={() => setIsOpen(false)} className='text-slate-400 hover:text-white transition-colors'>
									<Icon name='x' size='sm' />
								</button>
							</div>

							{/* Score Summary */}
							<div
								className='bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 mb-4 
                            border border-blue-500/30'
							>
								<div className='text-center'>
									<div className='text-2xl font-bold text-white mb-1'>
										{score}/{total}
									</div>
									<div className='text-lg text-blue-300 mb-2'>{percentage}% Correct</div>
									<div className='text-sm text-slate-300'>
										{topic} • {difficulty} difficulty
									</div>
								</div>
							</div>

							{/* Social Platforms */}
							<div className='space-y-2 mb-4'>
								<p className='text-sm text-slate-400 mb-3'>Share on:</p>
								<motion.div
									variants={createStaggerContainer(0.05)}
									initial="hidden"
									animate="visible"
								>
									<ResponsiveGrid minWidth='120px' gap='sm'>
										{socialPlatforms.map((platform, index) => (
											<motion.div 
												key={platform.name} 
												variants={fadeInUp}
												initial="hidden"
												animate="visible"
												transition={{ delay: index * 0.05 }}
											>
												<motion.div
													variants={hoverScale}
													initial="normal"
													whileHover="hover"
												>
													<button
														onClick={() => handleShare(platform.url)}
														className={`${platform.color} text-white p-3 rounded-lg flex items-center 
                                         justify-center space-x-2 text-sm font-medium transition-colors`}
													>
														<Icon name={platform.icon} size='sm' />
														<span>{platform.name}</span>
													</button>
												</motion.div>
											</motion.div>
										))}
									</ResponsiveGrid>
								</motion.div>
							</div>

							{/* Copy Link */}
							<motion.div
								variants={hoverScale}
								initial="normal"
								whileHover="hover"
							>
								<button
									onClick={handleCopyLink}
									className='w-full p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg 
                         flex items-center justify-center space-x-2 transition-colors'
								>
									<Icon name={copied ? 'checkcircle' : 'copy'} size='sm' />
									<span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
								</button>
							</motion.div>

							{/* Challenge Friends */}
							<div className='mt-4 pt-4 border-t border-slate-600'>
								<p className='text-xs text-slate-400 text-center'>
									<Icon name='zap' size='sm' className='mr-1' /> Challenge your friends to beat your score!
								</p>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}

