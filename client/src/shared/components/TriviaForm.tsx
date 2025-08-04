import { FormEvent, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CustomDifficultySuggestions from './CustomDifficultySuggestions';
import { 
  isCustomDifficulty, 
  extractCustomDifficultyText, 
  createCustomDifficulty,
  validateCustomDifficultyText 
} from '../utils/customDifficulty.utils';
import { Button, Input, Select } from './ui';
import { QuestionCount, TriviaFormProps } from '../types';

interface TriviaFormProps {
	topic: string;
	difficulty: string;
	questionCount: QuestionCount;
	loading: boolean;
	onTopicChange: (topic: string) => void;
	onDifficultyChange: (difficulty: string) => void;
	onQuestionCountChange: (count: QuestionCount) => void;
	onSubmit: (e: FormEvent) => Promise<void>;
	onAddFavorite: () => void;
}

export default function TriviaForm({
	topic,
	difficulty,
	questionCount,
	loading,
	onTopicChange,
	onDifficultyChange,
	onQuestionCountChange,
	onSubmit,
	onAddFavorite,
}: TriviaFormProps) {
	const [isCustomDifficulty, setIsCustomDifficulty] = useState(false);
	const [customDifficultyText, setCustomDifficultyText] = useState('');
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string; suggestions?: string[] } | null>(null);

	// בדיקה אם הקושי הנוכחי הוא מותאם אישית
	useEffect(() => {
		if (isCustomDifficulty(difficulty)) {
			setIsCustomDifficulty(true);
			setCustomDifficultyText(extractCustomDifficultyText(difficulty));
		} else {
			setIsCustomDifficulty(false);
			setCustomDifficultyText('');
		}
	}, [difficulty]);

	// ולידציה של טקסט מותאם בזמן אמת
	useEffect(() => {
		if (isCustomDifficulty && customDifficultyText) {
			const result = validateCustomDifficultyText(customDifficultyText);
			setValidationResult(result);
		} else {
			setValidationResult(null);
		}
	}, [isCustomDifficulty, customDifficultyText]);

	const handleDifficultyChange = (value: string) => {
		if (value === 'custom') {
			setIsCustomDifficulty(true);
			setShowSuggestions(true);
			if (customDifficultyText.trim()) {
				onDifficultyChange(createCustomDifficulty(customDifficultyText));
			}
		} else {
			setIsCustomDifficulty(false);
			setShowSuggestions(false);
			onDifficultyChange(value);
		}
	};

	const handleCustomDifficultyChange = (text: string) => {
		setCustomDifficultyText(text);
		if (text.trim()) {
			onDifficultyChange(createCustomDifficulty(text));
		}
	};

	const handleSuggestionClick = (suggestion: string) => {
		setCustomDifficultyText(suggestion);
		onDifficultyChange(createCustomDifficulty(suggestion));
		setShowSuggestions(false);
	};

	const getCurrentDifficultyValue = () => {
		if (isCustomDifficulty) return 'custom';
		return isCustomDifficulty(difficulty) ? 'custom' : difficulty;
	};

	const isFormValid = () => {
		if (!topic.trim()) return false;
		if (isCustomDifficulty) {
			const validation = validateCustomDifficultyText(customDifficultyText);
			return validation.isValid && customDifficultyText.trim().length > 0;
		}
		return true;
	};

	return (
		<form onSubmit={onSubmit} className='flex flex-col space-y-4'>
			<Input
				placeholder='Enter a topic (e.g. Science, Sports)'
				value={topic}
				onChange={(e) => onTopicChange(e.target.value)}
				required
			/>
			
			<div className="flex gap-4">
				<Select
					options={[
						{ value: 'easy', label: 'Easy - Perfect for beginners' },
						{ value: 'medium', label: 'Medium - General knowledge level' },
						{ value: 'hard', label: 'Hard - Expert level questions' },
						{ value: 'custom', label: 'Custom - Describe your own difficulty' }
					]}
					value={getCurrentDifficultyValue()}
					onChange={handleDifficultyChange}
					className="flex-1"
				/>

				<Select
					options={[
						{ value: '3', label: '3 Questions' },
						{ value: '4', label: '4 Questions' },
						{ value: '5', label: '5 Questions' }
					]}
					value={questionCount.toString()}
					onChange={(value) => onQuestionCountChange(Number(value) as QuestionCount)}
					className="w-40"
				/>
			</div>

			{isCustomDifficulty && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					exit={{ opacity: 0, height: 0 }}
					transition={{ duration: 0.3 }}
				>
					<div className='position-relative'>
						<Input
							as="textarea"
							placeholder='Describe the difficulty level in detail (e.g., "university level quantum physics", "professional chef techniques", "elementary school basic math")'
							value={customDifficultyText}
							onChange={(e) => handleCustomDifficultyChange(e.target.value)}
							onFocus={() => setShowSuggestions(true)}
							rows={3}
							required
							error={validationResult?.error}
							helperText={validationResult?.suggestions?.join('\n')}
							className="resize-y"
						/>
					</div>
					
					<div className='mt-2 flex justify-between items-center'>
						<small className='text-white/70'>
							<strong>Be specific!</strong> Examples: "high school chemistry", "beginner yoga poses", "expert wine knowledge"
						</small>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowSuggestions(!showSuggestions)}
							title={showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
						>
							{showSuggestions ? '🔼 Hide' : '🔽 Suggestions'}
						</Button>
					</div>

					<CustomDifficultySuggestions
						topic={topic}
						onSuggestionClick={handleSuggestionClick}
						isVisible={showSuggestions}
						currentText={customDifficultyText}
					/>
				</motion.div>
			)}

			<Button
				type='submit'
				variant='primary'
				size='lg'
				disabled={loading || !isFormValid()}
				title='Generate a new trivia question about your chosen topic and difficulty level'
				className='w-full'
				isLoading={loading}
			>
				{loading ? 'Generating...' : 'Generate Trivia'}
			</Button>
			
			<Button
				type='button'
				variant='secondary'
				size='lg'
				onClick={onAddFavorite}
				disabled={!isFormValid()}
				title='Save this topic and difficulty combination to your favorites for quick access'
				className='w-full'
			>
				+ Add to Favorites
			</Button>
		</form>
	);
}