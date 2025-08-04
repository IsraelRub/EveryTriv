import { FormEvent, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CustomDifficultySuggestions from './CustomDifficultySuggestions';
import { 
  isCustomDifficulty, 
  extractCustomDifficultyText, 
  createCustomDifficulty,
  validateCustomDifficultyText 
} from '../utils/customDifficulty.utils';

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
		<form onSubmit={onSubmit} className='d-flex flex-column gap-3'>
			<input
				className='form-control form-control-lg'
				placeholder='Enter a topic (e.g. Science, Sports)'
				value={topic}
				onChange={(e) => onTopicChange(e.target.value)}
				required
			/>
			
			<div className="d-flex gap-3">
				<select
					className='form-select form-select-lg'
					value={getCurrentDifficultyValue()}
					onChange={(e) => handleDifficultyChange(e.target.value)}
					title='Choose difficulty level'
				>
					<option value='easy'>Easy - Perfect for beginners</option>
					<option value='medium'>Medium - General knowledge level</option>
					<option value='hard'>Hard - Expert level questions</option>
					<option value='custom'>Custom - Describe your own difficulty</option>
				</select>

				<select
					className='form-select form-select-lg'
					value={questionCount}
					onChange={(e) => onQuestionCountChange(Number(e.target.value) as QuestionCount)}
					title='Number of questions'
					style={{ width: '140px' }}
				>
					<option value={3}>3 Questions</option>
					<option value={4}>4 Questions</option>
					<option value={5}>5 Questions</option>
				</select>
			</div>

			{isCustomDifficulty && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					exit={{ opacity: 0, height: 0 }}
					transition={{ duration: 0.3 }}
				>
					<div className='position-relative'>
						<textarea
							className={`form-control ${validationResult?.error ? 'is-invalid' : validationResult?.isValid ? 'is-valid' : ''}`}
							placeholder='Describe the difficulty level in detail (e.g., "university level quantum physics", "professional chef techniques", "elementary school basic math")'
							value={customDifficultyText}
							onChange={(e) => handleCustomDifficultyChange(e.target.value)}
							onFocus={() => setShowSuggestions(true)}
							rows={3}
							required
							style={{ resize: 'vertical' }}
						/>
						{validationResult?.error && (
							<div className='invalid-feedback'>
								{validationResult.error}
							</div>
						)}
						{validationResult?.suggestions && validationResult.suggestions.length > 0 && (
							<div className='mt-1'>
								{validationResult.suggestions.map((suggestion, index) => (
									<small key={index} className='form-text text-info d-block'>
										💡 {suggestion}
									</small>
								))}
							</div>
						)}
					</div>
					
					<div className='mt-2 d-flex justify-content-between align-items-center'>
						<small className='form-text text-muted'>
							<strong>Be specific!</strong> Examples: "high school chemistry", "beginner yoga poses", "expert wine knowledge"
						</small>
						<button
							type='button'
							className='btn btn-outline-light btn-sm'
							onClick={() => setShowSuggestions(!showSuggestions)}
							title={showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
						>
							{showSuggestions ? '🔼 Hide' : '🔽 Suggestions'}
						</button>
					</div>

					<CustomDifficultySuggestions
						topic={topic}
						onSuggestionClick={handleSuggestionClick}
						isVisible={showSuggestions}
						currentText={customDifficultyText}
					/>
				</motion.div>
			)}

			<motion.button
				type='submit'
				className='btn btn-primary btn-lg shadow'
				disabled={loading || !isFormValid()}
				title='Generate a new trivia question about your chosen topic and difficulty level'
				whileHover={!loading && isFormValid() ? { scale: 1.05, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' } : {}}
				whileTap={!loading && isFormValid() ? { scale: 0.95 } : {}}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.6 }}
			>
				{loading ? 'Generating...' : 'Generate Trivia'}
			</motion.button>
			
			<motion.button
				type='button'
				className='btn btn-secondary btn-lg mt-2'
				onClick={onAddFavorite}
				disabled={!isFormValid()}
				title='Save this topic and difficulty combination to your favorites for quick access'
				whileHover={isFormValid() ? { scale: 1.05, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' } : {}}
				whileTap={isFormValid() ? { scale: 0.95 } : {}}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.7 }}
			>
				+ Add to Favorites
			</motion.button>
		</form>
	);
}