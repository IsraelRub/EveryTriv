/**
 * Custom Difficulty View
 *
 * @module CustomDifficultyView
 * @description Manage custom difficulty levels
 */

import { useState } from 'react';

import { motion } from 'framer-motion';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { AlertModal, Button, Card, ConfirmModal, Container, fadeInUp, scaleIn } from '../../components';
import { AlertVariant, AudioKey, ButtonVariant, CardVariant, ContainerSize, Spacing } from '../../constants';
import { useValidateCustomDifficulty } from '../../hooks';
import { audioService } from '../../services';

export default function CustomDifficultyView() {
	const [customText, setCustomText] = useState('');
	const [savedDifficulties, setSavedDifficulties] = useState<string[]>([]);
	const [isCreating, setIsCreating] = useState(false);
	const [alertModal, setAlertModal] = useState<{
		open: boolean;
		title: string;
		message: string;
		variant: AlertVariant;
	}>({
		open: false,
		title: '',
		message: '',
		variant: AlertVariant.INFO,
	});
	const [confirmModal, setConfirmModal] = useState<{
		open: boolean;
		difficulty: string;
	}>({
		open: false,
		difficulty: '',
	});

	const validateDifficulty = useValidateCustomDifficulty();

	const handleCreate = async () => {
		if (!customText.trim()) {
			audioService.play(AudioKey.ERROR);
			setAlertModal({
				open: true,
				title: 'Input Required',
				message: 'Please enter a custom difficulty description',
				variant: AlertVariant.ERROR,
			});
			return;
		}

		try {
			setIsCreating(true);
			audioService.play(AudioKey.BUTTON_CLICK);

			// Validate the custom difficulty
			await validateDifficulty(customText);

			// If validation succeeds, add to list
			setSavedDifficulties(prev => [...prev, customText]);
			setCustomText('');

			audioService.play(AudioKey.SUCCESS);
			logger.gameInfo('Custom difficulty created', { customText });
			setAlertModal({
				open: true,
				title: 'Success',
				message: 'Custom difficulty level created successfully!',
				variant: AlertVariant.SUCCESS,
			});
		} catch (error) {
			audioService.play(AudioKey.ERROR);
			logger.gameError('Failed to create custom difficulty', { error: getErrorMessage(error) });
			setAlertModal({
				open: true,
				title: 'Error',
				message: 'Failed to create custom difficulty. Please try again.',
				variant: AlertVariant.ERROR,
			});
		} finally {
			setIsCreating(false);
		}
	};

	const handleDelete = (difficulty: string) => {
		audioService.play(AudioKey.BUTTON_CLICK);
		setConfirmModal({
			open: true,
			difficulty,
		});
	};

	const confirmDelete = () => {
		const { difficulty } = confirmModal;
		setSavedDifficulties(prev => prev.filter(d => d !== difficulty));
		audioService.play(AudioKey.SUCCESS);
		logger.gameInfo('Custom difficulty deleted', { customText: difficulty });
		setConfirmModal({ open: false, difficulty: '' });
	};

	return (
		<main role='main' aria-label='Custom Difficulty'>
			<Container size={ContainerSize.XL} className='min-h-screen py-8'>
				{/* Header */}
				<motion.header variants={fadeInUp} initial='hidden' animate='visible' className='text-center mb-12'>
					<h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>Custom Difficulty Levels</h1>
					<p className='text-xl text-slate-300'>Create your own difficulty levels with custom descriptions</p>
				</motion.header>

				{/* Create Form */}
				<motion.section
					variants={scaleIn}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.2 }}
					className='mb-12'
					aria-label='Create Custom Difficulty'
				>
					<Card variant={CardVariant.GLASS} padding={Spacing.XL} className='rounded-lg'>
						<h2 className='text-2xl font-bold text-white mb-6'>Create New Level</h2>

						<div className='space-y-4'>
							<div>
								<label className='block text-white font-medium mb-2'>Difficulty Description</label>
								<textarea
									value={customText}
									onChange={e => setCustomText(e.target.value)}
									placeholder='E.g., "Questions about advanced quantum physics" or "Easy questions for beginners"'
									className='w-full p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]'
									maxLength={200}
								/>
								<p className='text-sm text-slate-400 mt-2'>{customText.length}/200 characters</p>
							</div>

							<Button
								onClick={handleCreate}
								disabled={isCreating || !customText.trim()}
								variant={ButtonVariant.PRIMARY}
								className='w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
							>
								{isCreating ? 'Creating...' : 'Create Difficulty Level'}
							</Button>
						</div>
					</Card>
				</motion.section>

				{/* Saved Difficulties List */}
				<motion.section
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.4 }}
					aria-label='Saved Custom Difficulties'
				>
					<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg'>
						<h2 className='text-2xl font-bold text-white mb-6'>Your Custom Levels</h2>

						{savedDifficulties.length === 0 ? (
							<div className='text-center py-12'>
								<div className='text-6xl mb-4'>🎯</div>
								<p className='text-slate-400 text-lg'>No custom difficulty levels yet</p>
								<p className='text-slate-500 text-sm mt-2'>Create your first custom level above</p>
							</div>
						) : (
							<div className='space-y-4'>
								{savedDifficulties.map((difficulty, index) => (
									<motion.div
										key={index}
										variants={fadeInUp}
										initial='hidden'
										animate='visible'
										transition={{ delay: 0.1 * index }}
										className='flex items-start justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors'
									>
										<div className='flex-1'>
											<p className='text-white'>{difficulty}</p>
											<p className='text-sm text-slate-400 mt-1'>Created by you</p>
										</div>
										<button
											onClick={() => handleDelete(difficulty)}
											className='ml-4 text-red-400 hover:text-red-300 transition-colors'
											aria-label='Delete difficulty'
										>
											<svg
												className='w-5 h-5'
												fill='none'
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth='2'
												viewBox='0 0 24 24'
												stroke='currentColor'
											>
												<path d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
											</svg>
										</button>
									</motion.div>
								))}
							</div>
						)}
					</Card>
				</motion.section>

				{/* Info Section */}
				<motion.footer
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.6 }}
					className='mt-8'
				>
					<Card variant={CardVariant.GLASS} padding={Spacing.MD} className='rounded-lg'>
						<h3 className='text-lg font-semibold text-white mb-3'>💡 Tips</h3>
						<ul className='space-y-2 text-slate-300 text-sm'>
							<li>• Be specific about the topic and difficulty level</li>
							<li>• Use clear and descriptive language</li>
							<li>• Examples: "Basic math for elementary school", "Advanced programming concepts"</li>
							<li>• Your custom levels can be used in future games</li>
						</ul>
					</Card>
				</motion.footer>
			</Container>

			{/* Alert Modal */}
			<AlertModal
				open={alertModal.open}
				onClose={() => setAlertModal(prev => ({ ...prev, open: false }))}
				title={alertModal.title}
				message={alertModal.message}
				variant={alertModal.variant}
			/>

			{/* Confirm Modal */}
			<ConfirmModal
				open={confirmModal.open}
				onClose={() => setConfirmModal({ open: false, difficulty: '' })}
				onConfirm={confirmDelete}
				title='Delete Difficulty'
				message={`Are you sure you want to delete "${confirmModal.difficulty}"?`}
				confirmText='Delete'
				cancelText='Cancel'
				variant={AlertVariant.ERROR}
			/>
		</main>
	);
}
