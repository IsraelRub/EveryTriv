import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { AlertCircle, Clock, FileQuestion, Loader2, Play, Sliders, X } from 'lucide-react';

import { DifficultyLevel, GameMode } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';

import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CloseButton,
	Label,
	NumberInput,
	Slider,
} from '@/components';
import { ButtonSize } from '@/constants';
import { useAppDispatch, useValidateCustomDifficulty } from '@/hooks';
import { setGameMode } from '@/redux/slices';

interface CustomSettings {
	questionCount: number;
	timePerQuestion: number;
	difficultyValue: number;
}

function getDifficultyLabel(value: number): DifficultyLevel {
	if (value < 33) return DifficultyLevel.EASY;
	if (value < 66) return DifficultyLevel.MEDIUM;
	return DifficultyLevel.HARD;
}

function getDifficultyColor(value: number): string {
	if (value < 33) return 'text-green-500';
	if (value < 66) return 'text-yellow-500';
	return 'text-red-500';
}

export function CustomDifficultyView() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const validateCustomDifficulty = useValidateCustomDifficulty();

	const [settings, setSettings] = useState<CustomSettings>({
		questionCount: 10,
		timePerQuestion: 30,
		difficultyValue: 50,
	});
	const [isValidating, setIsValidating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const difficultyLevel = getDifficultyLabel(settings.difficultyValue);

	const handleSettingChange = useCallback((key: keyof CustomSettings, value: number[] | number) => {
		const numValue = Array.isArray(value) ? value[0] : value;
		setSettings(prev => ({ ...prev, [key]: numValue }));
		setError(null);
	}, []);

	const handleStartGame = async () => {
		setError(null);
		setIsValidating(true);

		try {
			// Validate custom difficulty settings
			const customText = `${settings.questionCount} questions, ${settings.timePerQuestion}s per question, ${difficultyLevel} difficulty`;

			logger.gameInfo('Starting custom difficulty game');

			// Validate the settings
			const validationResult = await validateCustomDifficulty(customText);

			if (!validationResult.isValid) {
				setError('Invalid settings. Please adjust your configuration.');
				return;
			}

			// Set game mode with custom settings
			dispatch(
				setGameMode({
					mode: GameMode.QUESTION_LIMITED,
					topic: '',
					difficulty: difficultyLevel,
					maxQuestionsPerGame: settings.questionCount,
					timeLimit: settings.timePerQuestion * settings.questionCount,
				})
			);

			logger.gameInfo('Custom game mode set, navigating to game');

			// Navigate to game session
			navigate('/game/play');
		} catch (err) {
			logger.gameError('Failed to start custom game', {
				error: err instanceof Error ? err.message : 'Unknown error',
			});
			setError('Failed to start game. Please try again.');
		} finally {
			setIsValidating(false);
		}
	};

	const handleCancel = () => {
		logger.gameInfo('Custom difficulty cancelled');
		navigate('/');
	};

	// Calculate estimated game time
	const estimatedTime = Math.ceil((settings.questionCount * settings.timePerQuestion) / 60);

	return (
		<motion.main
			role='main'
			aria-label='Custom Difficulty'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
			className='min-h-screen py-12 px-4'
		>
			<div className='max-w-2xl mx-auto'>
				<Card className='relative'>
					<CloseButton className='absolute top-4 right-4' />
					<CardHeader className='text-center'>
						<CardTitle className='text-3xl font-bold flex items-center justify-center gap-2'>
							<Sliders className='h-8 w-8' />
							Custom Difficulty
						</CardTitle>
						<CardDescription>Tailor your trivia game experience</CardDescription>
					</CardHeader>

					<CardContent className='space-y-8'>
						{error && (
							<Alert variant='destructive'>
								<AlertCircle className='h-4 w-4' />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{/* Settings Grid */}
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
							{/* Number of Questions */}
							<div className='space-y-4'>
								<Label className='flex items-center gap-2'>
									<FileQuestion className='h-4 w-4 text-muted-foreground' />
									Number of Questions
								</Label>
								<div className='flex justify-start'>
									<NumberInput
										value={settings.questionCount}
										onChange={value => handleSettingChange('questionCount', value)}
										min={5}
										max={50}
										step={5}
									/>
								</div>
								<p className='text-sm text-muted-foreground'>Choose between 5 and 50 questions</p>
							</div>

							{/* Time Per Question */}
							<div className='space-y-4'>
								<Label className='flex items-center gap-2'>
									<Clock className='h-4 w-4 text-muted-foreground' />
									Time Per Question (seconds)
								</Label>
								<div className='flex justify-start'>
									<NumberInput
										value={settings.timePerQuestion}
										onChange={value => handleSettingChange('timePerQuestion', value)}
										min={10}
										max={60}
										step={5}
									/>
								</div>
								<p className='text-sm text-muted-foreground'>10 to 60 seconds per question</p>
							</div>
						</div>

						{/* Difficulty Level */}
						<div className='space-y-4'>
							<div className='flex justify-between items-center'>
								<Label className='flex items-center gap-2'>
									<Sliders className='h-4 w-4 text-muted-foreground' />
									Difficulty Level
								</Label>
								<span className={`text-2xl font-bold ${getDifficultyColor(settings.difficultyValue)}`}>
									{difficultyLevel}
								</span>
							</div>
							<Slider
								value={[settings.difficultyValue]}
								onValueChange={value => handleSettingChange('difficultyValue', value)}
								min={0}
								max={100}
								step={1}
								className='cursor-pointer'
							/>
							<div className='flex justify-between text-sm text-muted-foreground'>
								<span className='text-green-500'>Easy</span>
								<span className='text-yellow-500'>Medium</span>
								<span className='text-red-500'>Hard</span>
							</div>
						</div>

						{/* Game Summary */}
						<Card className='bg-muted/50'>
							<CardContent className='pt-6'>
								<h3 className='font-semibold mb-4'>Game Summary</h3>
								<div className='grid grid-cols-2 gap-4 text-sm'>
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>Questions:</span>
										<span className='font-medium'>{settings.questionCount}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>Time/Question:</span>
										<span className='font-medium'>{settings.timePerQuestion}s</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>Difficulty:</span>
										<span className={`font-medium ${getDifficultyColor(settings.difficultyValue)}`}>
											{difficultyLevel}
										</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>Est. Time:</span>
										<span className='font-medium'>~{estimatedTime} min</span>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Action Buttons */}
						<div className='flex gap-4'>
							<Button className='flex-1' size={ButtonSize.LG} onClick={handleStartGame} disabled={isValidating}>
								{isValidating ? (
									<>
										<Loader2 className='h-5 w-5 mr-2 animate-spin' />
										Validating...
									</>
								) : (
									<>
										<Play className='h-5 w-5 mr-2' />
										Start Game
									</>
								)}
							</Button>
							<Button variant='outline' size={ButtonSize.LG} onClick={handleCancel} disabled={isValidating}>
								<X className='h-5 w-5 mr-2' />
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</motion.main>
	);
}
