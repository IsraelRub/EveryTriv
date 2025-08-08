import { FormEvent, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CustomDifficultySuggestions from './CustomDifficultySuggestions';
import GameModeSelection from './GameModeSelection';
import { 
  isCustomDifficulty as isCustomDifficultyUtil, 
  extractCustomDifficultyText, 
  createCustomDifficulty,
  validateCustomDifficultyText 
} from '../utils/customDifficulty.utils';
import { Button, Select } from '../styles/ui';
import { QuestionCount } from '../types';

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
	onGameModeSelect: (config: {
		mode: 'time-limited' | 'question-limited' | 'unlimited';
		timeLimit?: number;
		questionLimit?: number;
	}) => void;
	showGameModeSelector?: boolean;
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
	onGameModeSelect,
	showGameModeSelector = false,
}: TriviaFormProps) {
	const [isCustomDifficulty, setIsCustomDifficulty] = useState(false);
	const [customDifficultyText, setCustomDifficultyText] = useState('');
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string; suggestions?: string[] } | null>(null);

	// בדיקה אם הקושי הנוכחי הוא מותאם אישית
	useEffect(() => {
		if (isCustomDifficultyUtil(difficulty)) {
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
		return isCustomDifficultyUtil(difficulty) ? 'custom' : difficulty;
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
		<form onSubmit={onSubmit} className='space-y-6'>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-white/80 mb-2">
						Topic
					</label>
					<input
						className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200"
						placeholder="Enter a topic (e.g. Science, Sports, History)"
						value={topic}
						onChange={(e: FormEvent) => onTopicChange((e.target as HTMLInputElement).value)}
						required
					/>
				</div>
				
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="sm:col-span-2">
						<label className="block text-sm font-medium text-white/80 mb-2">
							Difficulty Level
						</label>
						<Select
							options={[
								{ value: 'easy', label: 'Easy - Perfect for beginners' },
								{ value: 'medium', label: 'Medium - General knowledge level' },
								{ value: 'hard', label: 'Hard - Expert level questions' },
								{ value: 'custom', label: 'Custom - Describe your own difficulty' }
							]}
							value={getCurrentDifficultyValue()}
							onChange={(_, value) => handleDifficultyChange(value as string)}
							isGlassy
							className="w-full"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-white/80 mb-2">
							Questions
						</label>
						<Select
							options={[
								{ value: '3', label: '3 Questions' },
								{ value: '4', label: '4 Questions' },
								{ value: '5', label: '5 Questions' }
							]}
							value={questionCount.toString()}
							onChange={(_, value) => onQuestionCountChange(Number(value) as QuestionCount)}
							isGlassy
							className="w-full"
						/>
					</div>
				</div>
			</div>

			{isCustomDifficulty && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					exit={{ opacity: 0, height: 0 }}
					transition={{ duration: 0.3 }}
					className="space-y-3"
				>
					<div>
						<label className="block text-sm font-medium text-white/80 mb-2">
							Custom Difficulty Description
						</label>
						<textarea
							placeholder='Describe the difficulty level in detail (e.g., "university level quantum physics", "professional chef techniques", "elementary school basic math")'
							value={customDifficultyText}
							onChange={(e) => handleCustomDifficultyChange((e.target as HTMLTextAreaElement).value)}
							onFocus={() => setShowSuggestions(true)}
							rows={3}
							required
							className={`w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 resize-y ${validationResult?.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : 'border-white/20 focus:border-blue-400/50'}`}
						/>
						{validationResult?.error && (
							<p className="text-red-400 text-sm mt-2 flex items-center">
								<span className="mr-1">⚠️</span>
								{validationResult.error}
							</p>
						)}
						{validationResult?.suggestions?.length && (
							<div className="text-blue-300 text-sm mt-2">
								<span className="font-medium">💡 Suggestions:</span>
								<div className="mt-1 space-y-1">
									{validationResult.suggestions.map((suggestion, index) => (
										<div key={index} className="ml-4">• {suggestion}</div>
									))}
								</div>
							</div>
						)}
					</div>
					
					<div className='flex justify-between items-center pt-2 border-t border-white/10'>
						<small className='text-white/70'>
							<strong>💡 Tip:</strong> Be specific! Examples: "high school chemistry", "beginner yoga poses", "expert wine knowledge"
						</small>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowSuggestions(!showSuggestions)}
							title={showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
							className="text-white/70 hover:text-white"
						>
							{showSuggestions ? '🔼 Hide' : '🔽 Show'} Suggestions
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

			{showGameModeSelector && (
				<GameModeSelection onSelect={onGameModeSelect} />
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
				<Button
					type='submit'
					variant='primary'
					size='lg'
					disabled={loading || !isFormValid()}
					title='Generate a new trivia question about your chosen topic and difficulty level'
					className='w-full font-semibold py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
					isGlassy
				>
					{loading ? (
						<span className="flex items-center justify-center">
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
							Generating...
						</span>
					) : '🎮 Generate Trivia'}
				</Button>
				
				<Button
					type='button'
					variant='secondary'
					size='lg'
					onClick={onAddFavorite}
					disabled={!isFormValid()}
					title='Save this topic and difficulty combination to your favorites for quick access'
					className='w-full font-semibold py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200'
					isGlassy
				>
					⭐ Add to Favorites
				</Button>
			</div>
		</form>
	);
}