import { ChangeEvent, useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import { CUSTOM_DIFFICULTY_KEYWORDS, CUSTOM_DIFFICULTY_PREFIX, DifficultyLevel } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { SimpleValidationResult } from '@shared/types';
import {
	extractCustomDifficultyText,
	isCustomDifficulty as isCustomDifficultyUtil,
	validateCustomDifficultyText,
} from '@shared/validation';

import { ButtonVariant, ComponentSize } from '../../constants';
import { useDebounce } from '../../hooks';
import { TriviaFormProps } from '../../types';
import { fadeInUp } from '../animations';
import GameModeSelection from '../GameMode';
import { Icon } from '../IconLibrary';
import { Button, Select } from '../ui';

/**
 * Trivia form component for topic and difficulty selection
 *
 * @component TriviaForm
 * @description Form component for trivia game configuration with topic input, difficulty selection, and custom difficulty support
 * @param topic - Current topic input value
 * @param difficulty - Selected difficulty level
 * @param questionCount - Number of questions to generate
 * @param loading - Loading state for form submission
 * @param onTopicChange - Callback for topic input changes
 * @param onDifficultyChange - Callback for difficulty selection changes
 * @param onQuestionCountChange - Callback for question count changes
 * @param onSubmit - Form submission handler
 * @param onGameModeSelect - Game mode selection handler
 * @param showGameModeSelector - Whether to show game mode selector
 * @param onGameModeSelectorClose - Game mode selector close handler
 * @returns JSX.Element The rendered trivia configuration form
 */
export default function TriviaForm({
	topic,
	difficulty,
	questionCount,
	loading,
	onTopicChange,
	onDifficultyChange,
	onQuestionCountChange,
	onSubmit,
	onGameModeSelect,
	showGameModeSelector = false,
	onGameModeSelectorClose,
}: TriviaFormProps) {
	const [isCustomDifficulty, setIsCustomDifficulty] = useState(false);
	const [customDifficultyText, setCustomDifficultyText] = useState('');
	const [validationResult, setValidationResult] = useState<SimpleValidationResult | null>(null);

	const debouncedTopic = useDebounce(topic, 500);

	const detectCustomDifficultyFromTopic = (topicText: string): string | null => {
		const lowerTopic = topicText.toLowerCase();
		for (const [keyword, difficulty] of Object.entries(CUSTOM_DIFFICULTY_KEYWORDS)) {
			if (lowerTopic.includes(keyword.toLowerCase())) {
				return `${CUSTOM_DIFFICULTY_PREFIX}${difficulty}`;
			}
		}
		return null;
	};

	useEffect(() => {
		if (topic && !isCustomDifficulty) {
			const detectedDifficulty = detectCustomDifficultyFromTopic(topic);
			if (detectedDifficulty) {
				setIsCustomDifficulty(true);
				setCustomDifficultyText(detectedDifficulty.replace(CUSTOM_DIFFICULTY_PREFIX, ''));
				onDifficultyChange?.(detectedDifficulty);
			}
		}
	}, [topic, isCustomDifficulty, onDifficultyChange]);

	useEffect(() => {
		if (difficulty && isCustomDifficultyUtil(difficulty)) {
			setIsCustomDifficulty(true);
			setCustomDifficultyText(extractCustomDifficultyText(difficulty));
		} else {
			setIsCustomDifficulty(false);
			setCustomDifficultyText('');
		}
	}, [difficulty]);

	useEffect(() => {
		if (isCustomDifficulty && customDifficultyText) {
			const result = validateCustomDifficultyText(customDifficultyText);
			setValidationResult(result);
		} else {
			setValidationResult(null);
		}
	}, [isCustomDifficulty, customDifficultyText]);

	useEffect(() => {
		if (debouncedTopic && debouncedTopic !== topic) {
			logger.userDebug(`Topic search: ${debouncedTopic}`);
		}
	}, [debouncedTopic, topic]);

	const handleDifficultyChange = (value: string) => {
		if (value === DifficultyLevel.CUSTOM) {
			setIsCustomDifficulty(true);
			if (customDifficultyText.trim()) {
				onDifficultyChange?.(`${CUSTOM_DIFFICULTY_PREFIX}${customDifficultyText}`);
			}
		} else {
			setIsCustomDifficulty(false);
			onDifficultyChange?.(value);
		}
	};

	const handleCustomDifficultyChange = (text: string) => {
		setCustomDifficultyText(text);
		if (text.trim()) {
			onDifficultyChange?.(`${CUSTOM_DIFFICULTY_PREFIX}${text}`);
		}
	};

	const getCurrentDifficultyValue = () => {
		if (isCustomDifficulty) return DifficultyLevel.CUSTOM;
		return difficulty && isCustomDifficultyUtil(difficulty)
			? DifficultyLevel.CUSTOM
			: difficulty || DifficultyLevel.EASY;
	};

	const isFormValid = () => {
		if (!topic?.trim()) return false;
		if (isCustomDifficulty) {
			const validation = validateCustomDifficultyText(customDifficultyText);
			return validation.isValid && customDifficultyText.trim().length > 0;
		}
		return true;
	};

	return (
		<form onSubmit={onSubmit} className='space-y-6'>
			<div className='space-y-4'>
				<fieldset>
					<legend className='sr-only'>Topic Field</legend>
					<label className='block text-sm font-medium text-white/80 mb-2'>Topic</label>
					<input
						type='text'
						placeholder='Enter a topic'
						value={topic}
						onChange={e => onTopicChange?.(e.target.value)}
						required
						className='w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200'
					/>
				</fieldset>

				<fieldset>
					<legend className='sr-only'>Difficulty Field</legend>
					<label className='block text-sm font-medium text-white/80 mb-2'>Difficulty Level</label>
					<Select
						options={[
							{ value: DifficultyLevel.EASY, label: 'Easy' },
							{ value: DifficultyLevel.MEDIUM, label: 'Medium' },
							{ value: DifficultyLevel.HARD, label: 'Hard' },
							{ value: DifficultyLevel.CUSTOM, label: 'Custom' },
						]}
						value={getCurrentDifficultyValue() || DifficultyLevel.EASY}
						onChange={(e: ChangeEvent<HTMLSelectElement>) => handleDifficultyChange(e.target.value)}
						isGlassy
						className='w-full'
					/>
				</fieldset>

				{isCustomDifficulty && (
					<motion.div variants={fadeInUp} initial='hidden' animate='visible' className='space-y-3'>
						<div>
							<label className='block text-sm font-medium text-white/80 mb-2'>Custom Difficulty Description</label>
							<textarea
								placeholder='Describe the difficulty level in detail'
								value={customDifficultyText}
								onChange={e => handleCustomDifficultyChange((e.target as HTMLTextAreaElement).value)}
								rows={3}
								required
								className={`w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 resize-y ${validationResult && !validationResult.isValid && validationResult.errors.length > 0 ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-white/20 focus:border-blue-400/50'}`}
							/>
							{validationResult && !validationResult.isValid && validationResult.errors.length > 0 && (
								<div role='alert' className='mt-2 space-y-1'>
									{validationResult.errors.map((error, index) => (
										<p key={index} className='text-red-400 text-sm flex items-center'>
											<Icon name='alerttriangle' size={ComponentSize.SM} className='mr-1' />
											{error}
										</p>
									))}
								</div>
							)}
						</div>

						<div className='pt-2 border-t border-white/10'>
							<small className='text-white/70'>
								<strong>
									<Icon name='lightbulb' size={ComponentSize.SM} className='mr-1' /> Tip:
								</strong>{' '}
								Be specific about the difficulty level you want
							</small>
						</div>
					</motion.div>
				)}

				<fieldset>
					<legend className='sr-only'>Question Count Field</legend>
					<label className='block text-sm font-medium text-white/80 mb-2'>Number of Questions</label>
					<Select
						options={[
							{ value: '3', label: '3 Questions' },
							{ value: '4', label: '4 Questions' },
							{ value: '5', label: '5 Questions' },
						]}
						value={questionCount?.toString() || '3'}
						onChange={(e: ChangeEvent<HTMLSelectElement>) => onQuestionCountChange?.(Number(e.target.value))}
						isGlassy
						className='w-full'
					/>
				</fieldset>
			</div>

			<GameModeSelection
				isVisible={showGameModeSelector}
				// onSelectMode={onGameModeSelect}
				onCancel={
					onGameModeSelectorClose ||
					(() => {
						// Default no-op cancel handler
					})
				}
				onModeSelect={(mode: string) => onGameModeSelect?.(mode)}
			/>

			<div className='pt-4'>
				<Button
					type='submit'
					variant={ButtonVariant.PRIMARY}
					size={ComponentSize.LG}
					disabled={loading || !isFormValid()}
					title='Generate a new trivia question about your chosen topic and difficulty level'
					className='w-full font-semibold py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
					isGlassy
				>
					{loading ? (
						<span className='flex items-center justify-center'>
							<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
							Generating...
						</span>
					) : (
						<>
							<Icon name='gamepad' size={ComponentSize.SM} className='mr-1' /> Generate Trivia
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
