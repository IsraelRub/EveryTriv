import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Hash, Share2 } from 'lucide-react';

import { APP_NAME } from '@shared/constants';
import { calculatePercentage, formatTitle, getErrorMessage } from '@shared/utils';

import {
	ANIMATION_DELAYS,
	ButtonSize,
	GameKey,
	SEMANTIC_ICON_TEXT,
	SOCIAL_DATA,
	SocialKey,
	SocialShareMode,
	VariantBase,
} from '@/constants';
import type { SocialShareProps } from '@/types';
import { clientLogger as logger } from '@/services';
import { cn, getDifficultyDisplayLabel, isSocialSharePlatform } from '@/utils';
import {
	AnimatedCopyFeedbackIcon,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components';
import { useClipboardCopy } from '@/hooks';

export function SocialShare({ score, total, topic, difficulty, mode, shareText: shareTextOverride }: SocialShareProps) {
	const { t } = useTranslation(['social', 'game']);
	const [isOpen, setIsOpen] = useState(false);

	const percentage = calculatePercentage(score ?? 0, total ?? 0);
	const difficultyDisplay = getDifficultyDisplayLabel(difficulty, t);
	const topicDisplay = formatTitle(topic);

	const scoreText =
		shareTextOverride ??
		t(GameKey.SHARE_SINGLE_SCORE, {
			score: score ?? 0,
			total: total ?? 0,
			percentage,
			topic: topicDisplay,
			difficulty: difficultyDisplay,
			appName: APP_NAME,
		});

	const { copied, copy: copyShareText } = useClipboardCopy({
		text: scoreText,
		onSuccess: () => {
			logger.userSuccess('Link copied to clipboard');
		},
		onError: (error: unknown) => {
			logger.userError('Failed to copy link to clipboard', {
				errorInfo: { message: getErrorMessage(error) },
			});
		},
	});

	// Share URL: home page
	const shareUrl = window.location.origin;

	const shareablePlatforms = SOCIAL_DATA.filter(isSocialSharePlatform);

	const socialPlatforms = shareablePlatforms.map(platform => {
		const originalPlatform = SOCIAL_DATA.find(p => p.name === platform.name);
		return {
			...platform,
			url: platform.getShareUrl(scoreText, shareUrl),
			color: platform.shareColor,
			Icon: originalPlatform?.icon ?? Share2,
		};
	});

	const handleShare = (url: string, platformName: string) => {
		window.open(url, '_blank', 'width=600,height=400');
		setIsOpen(false);
		logger.userInfo(`Sharing score on ${platformName}`, { platform: platformName, score, gameQuestionCount: total });
	};

	return (
		<div className='relative'>
			{/* Share Button */}
			<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
				<Button variant={VariantBase.DEFAULT} size={ButtonSize.LG} onClick={() => setIsOpen(!isOpen)}>
					<Share2 className='w-4 h-4 me-2' />
					{t(SocialKey.SHARE_RESULT)}
				</Button>
			</motion.div>

			{/* Share Dialog */}
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>
							{mode === SocialShareMode.MULTIPLAYER
								? t(SocialKey.SHARE_YOUR_MULTIPLAYER_RESULT)
								: t(SocialKey.SHARE_YOUR_RESULT)}
						</DialogTitle>
						<DialogDescription className='flex items-center justify-center gap-1.5'>
							<Hash className={cn('w-4 h-4', SEMANTIC_ICON_TEXT.warning)} />
							{mode === SocialShareMode.MULTIPLAYER
								? t(SocialKey.CHALLENGE_FRIENDS_MULTIPLAYER)
								: t(SocialKey.CHALLENGE_FRIENDS)}
						</DialogDescription>
					</DialogHeader>

					{/* Score Summary */}
					<div
						className={cn(
							'bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 mb-4 border',
							'border-primary/20'
						)}
					>
						<div className='text-center'>
							<div className='text-2xl font-bold mb-1'>
								{score} <span className='text-muted-foreground font-normal'>/</span> {total}
							</div>
							<div className='text-lg text-primary mb-2'>
								{Number.isFinite(percentage) ? percentage : 0}% {t(SocialKey.CORRECT)}
							</div>
							<div className='text-sm text-muted-foreground flex items-center justify-center gap-2'>
								<span>{topicDisplay}</span>
								<span className='text-muted-foreground/50'>•</span>
								<span className='capitalize'>{difficulty}</span>
							</div>
						</div>
					</div>

					{/* Copy Link - Moved up for better UX */}
					<Button
						variant={VariantBase.SECONDARY}
						className='mb-4 flex w-full items-center justify-center gap-2'
						onClick={() => void copyShareText()}
					>
						<AnimatedCopyFeedbackIcon success={copied} />
						{copied ? t(SocialKey.COPIED) : t(SocialKey.COPY_TO_CLIPBOARD)}
					</Button>

					{/* Social Platforms */}
					<div className='space-y-2 mb-4'>
						<p className='text-sm text-muted-foreground mb-3'>{t(SocialKey.SHARE_ON)}</p>
						<div className='grid grid-cols-2 gap-2'>
							{socialPlatforms.map((platform, index) => {
								const Icon = platform.Icon;
								return (
									<motion.div
										key={platform.name}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * ANIMATION_DELAYS.STAGGER_SMALL }}
									>
										<Button
											variant={VariantBase.OUTLINE}
											className={cn('w-full text-white border-0', platform.color)}
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
				</DialogContent>
			</Dialog>
		</div>
	);
}
