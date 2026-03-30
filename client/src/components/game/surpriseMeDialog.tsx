import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wand2 } from 'lucide-react';

import { DifficultyLevel, SurpriseScope } from '@shared/constants';
import { extractCustomDifficultyText, isCustomDifficulty } from '@shared/validation';

import { ButtonSize, ComponentSize, DialogContentSize, GameKey, SURPRISE_SCOPE_LABEL_KEYS, VariantBase } from '@/constants';
import type { SurpriseMeDialogProps } from '@/types';
import { gameHistoryService } from '@/services';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Spinner } from '@/components';
import { useAppSelector } from '@/hooks';
import { selectLocale } from '@/redux/selectors';

export function SurpriseMeDialog({
	onTopicChange,
	onDifficultyChange,
	onCustomDifficultyChange,
	onCustomDifficultyErrorChange,
}: SurpriseMeDialogProps): JSX.Element {
	const { t } = useTranslation('game');
	const locale = useAppSelector(selectLocale);

	const [open, setOpen] = useState(false);
	const [surpriseTopicChosen, setSurpriseTopicChosen] = useState(true);
	const [surpriseLevelChosen, setSurpriseLevelChosen] = useState(false);
	const [surpriseLoading, setSurpriseLoading] = useState(false);

	const surpriseScope: SurpriseScope =
		surpriseTopicChosen && surpriseLevelChosen
			? SurpriseScope.BOTH
			: surpriseTopicChosen
				? SurpriseScope.TOPIC
				: SurpriseScope.DIFFICULTY;

	return (
		<>
			<Button
				type='button'
				variant={VariantBase.SECONDARY}
				size={ButtonSize.SM}
				onClick={() => setOpen(true)}
				className='gap-2'
			>
				<Wand2 className='h-4 w-4' />
				{t(GameKey.SURPRISE_ME)}
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent size={DialogContentSize.SM} className='max-w-sm'>
					<DialogHeader>
						<DialogTitle>{t(GameKey.SURPRISE_ME)}</DialogTitle>
					</DialogHeader>
					<div className='space-y-4 py-2'>
						<p className='text-sm text-muted-foreground'>{t(GameKey.HOW_WOULD_YOU_LIKE_TO_PLAY)}</p>
						<div className='flex flex-wrap gap-2'>
							<Button
								type='button'
								variant={surpriseTopicChosen ? VariantBase.DEFAULT : VariantBase.OUTLINE}
								size={ButtonSize.SM}
								onClick={() =>
									setSurpriseTopicChosen(prev => {
										const next = !prev;
										if (!next && !surpriseLevelChosen) setSurpriseLevelChosen(true);
										return next;
									})
								}
								disabled={surpriseLoading}
							>
								{t(SURPRISE_SCOPE_LABEL_KEYS[SurpriseScope.TOPIC])}
							</Button>
							<Button
								type='button'
								variant={surpriseLevelChosen ? VariantBase.DEFAULT : VariantBase.OUTLINE}
								size={ButtonSize.SM}
								onClick={() =>
									setSurpriseLevelChosen(prev => {
										const next = !prev;
										if (!next && !surpriseTopicChosen) setSurpriseTopicChosen(true);
										return next;
									})
								}
								disabled={surpriseLoading}
							>
								{t(SURPRISE_SCOPE_LABEL_KEYS[SurpriseScope.DIFFICULTY])}
							</Button>
						</div>
					</div>
					<DialogFooter>
						<Button
							type='button'
							variant={VariantBase.SECONDARY}
							size={ButtonSize.SM}
							onClick={async () => {
								setSurpriseLoading(true);
								try {
									const data = await gameHistoryService.getSurprisePick(surpriseScope, locale);
									if (data.topic !== undefined) {
										onTopicChange(data.topic);
									}
									if (data.difficulty !== undefined) {
										onDifficultyChange(DifficultyLevel.CUSTOM);
										onCustomDifficultyChange(
											isCustomDifficulty(data.difficulty)
												? extractCustomDifficultyText(data.difficulty)
												: data.difficulty
										);
										onCustomDifficultyErrorChange('');
									}
									setOpen(false);
								} finally {
									setSurpriseLoading(false);
								}
							}}
							disabled={surpriseLoading}
							className='min-w-[6rem] gap-2'
						>
							{!surpriseLoading ? (
								t(GameKey.OK)
							) : (
								<>
									<Spinner size={ComponentSize.SM} />
									{t(GameKey.SURPRISE_PICK_LOADING)}
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
