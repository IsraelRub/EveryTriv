import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Facebook, Linkedin, MessageCircle, Send, Share2, Twitter, X, Zap } from 'lucide-react';

import { DifficultyLevel, SHARE_PLATFORMS } from '@shared/constants';
import { calculatePercentage, getErrorMessage } from '@shared/utils';

import { ButtonSize, ButtonVariant, ToastVariant } from '@/constants';

import { Button } from '@/components';

import { useToast } from '@/hooks';

import { clientLogger as logger } from '@/services';

import type { SocialShareProps } from '@/types';

const PLATFORM_ICONS: Record<string, typeof Twitter> = {
	Twitter: Twitter,
	Facebook: Facebook,
	LinkedIn: Linkedin,
	WhatsApp: MessageCircle,
	Telegram: Send,
};

/**
 * Social Share Component
 * Allows users to share their game results on social media
 */
export function SocialShare({
	score,
	total,
	topic = 'Trivia',
	difficulty = DifficultyLevel.MEDIUM,
	className = '',
}: SocialShareProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const { toast } = useToast();

	const percentage = calculatePercentage(score ?? 0, total ?? 0);
	const scoreText = `Just scored ${score}/${total} (${percentage}%) on ${topic} ${difficulty} difficulty in EveryTriv!`;

	const shareUrl = `${window.location.origin}?challenge=${encodeURIComponent(topic)}&difficulty=${difficulty}`;

	const socialPlatforms = SHARE_PLATFORMS.map(platform => ({
		...platform,
		url: platform.getUrl(scoreText, shareUrl),
		Icon: PLATFORM_ICONS[platform.name] || Share2,
	}));

	const handleShare = (url: string, platformName: string) => {
		window.open(url, '_blank', 'width=600,height=400');
		setIsOpen(false);

		toast({
			title: 'Sharing...',
			description: `Opening ${platformName} to share your score`,
		});
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(`${scoreText} ${shareUrl}`);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);

			toast({
				title: 'Copied!',
				description: 'Link copied to clipboard',
			});
		} catch (error) {
			logger.userError('Failed to copy link to clipboard', {
				error: getErrorMessage(error),
			});

			toast({
				title: 'Failed to copy',
				description: 'Could not copy to clipboard',
				variant: ToastVariant.DESTRUCTIVE,
			});
		}
	};

	// Don't show if no game played
	if (total === 0) return null;

	return (
		<div className={`relative ${className}`}>
			{/* Share Button */}
			<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
				<Button
					onClick={() => setIsOpen(!isOpen)}
					className='bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg'
				>
					<Share2 className='w-4 h-4 mr-2' />
					Share Score
				</Button>
			</motion.div>

			{/* Share Options Panel */}
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 bg-black/20 backdrop-blur-sm z-40'
							onClick={() => setIsOpen(false)}
						/>

						{/* Share Panel */}
						<motion.aside
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							transition={{ type: 'spring', duration: 0.3 }}
							className='absolute top-full mt-2 right-0 bg-card border rounded-xl shadow-2xl p-6 w-80 z-50'
						>
							{/* Header */}
							<div className='flex items-center justify-between mb-4'>
								<h3 className='font-semibold'>Share Your Achievement!</h3>
								<Button
									variant={ButtonVariant.GHOST}
									size={ButtonSize.ICON}
									className='h-8 w-8'
									onClick={() => setIsOpen(false)}
								>
									<X className='h-4 w-4' />
								</Button>
							</div>

							{/* Score Summary */}
							<div className='bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 mb-4 border border-blue-500/20'>
								<div className='text-center'>
									<div className='text-2xl font-bold mb-1'>
										{score}/{total}
									</div>
									<div className='text-lg text-primary mb-2'>{percentage}% Correct</div>
									<div className='text-sm text-muted-foreground flex items-center justify-center gap-2'>
										<span>{topic}</span>
										<span className='text-muted-foreground/50'>•</span>
										<span className='capitalize'>{difficulty}</span>
									</div>
								</div>
							</div>

							{/* Social Platforms */}
							<div className='space-y-2 mb-4'>
								<p className='text-sm text-muted-foreground mb-3'>Share on:</p>
								<div className='grid grid-cols-2 gap-2'>
									{socialPlatforms.map((platform, index) => {
										const Icon = platform.Icon;
										return (
											<motion.div
												key={platform.name}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.05 }}
											>
												<Button
													variant={ButtonVariant.OUTLINE}
													className={`w-full ${platform.color} text-white border-0`}
													onClick={() => handleShare(platform.url, platform.name)}
												>
													<Icon className='w-4 h-4 mr-2' />
													{platform.name}
												</Button>
											</motion.div>
										);
									})}
								</div>
							</div>

							{/* Copy Link */}
							<Button variant={ButtonVariant.SECONDARY} className='w-full' onClick={handleCopyLink}>
								{copied ? (
									<>
										<Check className='w-4 h-4 mr-2 text-green-500' />
										Copied!
									</>
								) : (
									<>
										<Copy className='w-4 h-4 mr-2' />
										Copy to Clipboard
									</>
								)}
							</Button>

							{/* Challenge Friends */}
							<div className='mt-4 pt-4 border-t'>
								<p className='text-xs text-muted-foreground text-center flex items-center justify-center gap-1'>
									<Zap className='w-3 h-3' />
									Challenge your friends to beat your score!
								</p>
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
