import { Coins, Zap } from 'lucide-react';

import { GAME_STATE_DEFAULTS } from '@shared/constants';
import { formatDifficulty } from '@shared/utils';

import { ButtonSize, Colors, ComponentSize, LoadingMessages, TimerMode, VariantBase } from '@/constants';
import { AnswerButton, Button, Card, GameTimer, Progress, QuestionCounter, Spinner } from '@/components';
import type { UseSingleSessionReturn } from '@/types';
import { cn } from '@/utils';

export function SingleSessionPlayArea(session: UseSingleSessionReturn) {
	const {
		isFetchingMoreQuestions,
		isTimeLimited,
		timeLimit,
		gameStartTime,
		handleGameTimeout,
		isUnlimited,
		currentQuestionIndex,
		isAdmin,
		creditBalanceTotal,
		hasQuestionLimit,
		gameQuestionCount,
		progress,
		currentTopic,
		currentDifficulty,
		streak,
		currentQuestion,
		answered,
		selectedAnswer,
		handleAnswerSelect,
		handleSubmit,
		handleFinishUnlimitedGame,
		setShowExitDialog,
		score,
	} = session;

	return (
		<main className='view-main animate-fade-in-up-simple relative'>
			{isFetchingMoreQuestions && (
				<div className='absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
					<Card className='p-6 flex flex-col items-center gap-4 max-w-sm mx-4'>
						<Spinner size={ComponentSize.LG} className='text-primary' />
						<p className='text-foreground font-medium text-center'>{LoadingMessages.FETCHING_QUESTIONS}</p>
						<p className='text-sm text-muted-foreground text-center'>{LoadingMessages.FETCHING_QUESTIONS_HINT}</p>
					</Card>
				</div>
			)}
			<div className='container mx-auto max-w-4xl h-full flex flex-col'>
				<div className='flex-shrink-0 mb-4'>
					<div className='flex items-center justify-between gap-4 mb-3'>
						<div className='flex-1'>
							<GameTimer
								key='game-timer'
								mode={isTimeLimited ? TimerMode.COUNTDOWN : TimerMode.ELAPSED}
								initialTime={isTimeLimited ? timeLimit : undefined}
								startTime={gameStartTime ?? undefined}
								onTimeout={isTimeLimited ? handleGameTimeout : undefined}
								label={isTimeLimited ? 'Game Time' : 'Time Elapsed'}
								showProgressBar={isTimeLimited}
							/>
						</div>
						{isUnlimited && (
							<div className='flex items-center gap-3 text-sm'>
								<span className='text-foreground font-medium'>Question {currentQuestionIndex + 1}</span>
								{!isAdmin && (
									<div className='flex items-center gap-1.5 text-muted-foreground'>
										<Coins className={cn('w-3.5 h-3.5', Colors.YELLOW_500.text)} />
										<span className='text-xs'>{creditBalanceTotal}</span>
									</div>
								)}
							</div>
						)}
					</div>

					{hasQuestionLimit && (
						<div className='mt-3 mb-3'>
							<div className='flex justify-between items-center mb-1.5'>
								<QuestionCounter current={currentQuestionIndex + 1} total={gameQuestionCount} size={ComponentSize.SM} />
								<span className='text-primary font-bold text-sm'>Score: {score}</span>
							</div>
							<Progress value={progress} className='h-2' />
						</div>
					)}

					<div className='mb-3 text-center'>
						<div className='flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap'>
							<span>Topic: {currentTopic ?? GAME_STATE_DEFAULTS.TOPIC}</span>
							<span className='text-muted-foreground/50'>•</span>
							<span>Difficulty: {formatDifficulty(currentDifficulty ?? GAME_STATE_DEFAULTS.DIFFICULTY)}</span>
							{streak > 1 && (
								<>
									<span className='text-muted-foreground/50'>•</span>
									<span className='flex items-center gap-1 text-primary font-medium'>
										<Zap className='h-3.5 w-3.5' />
										Streak: {streak}
									</span>
								</>
							)}
						</div>
					</div>
				</div>

				<div className='flex-1 flex flex-col min-h-0'>
					<Card className='p-4 mb-4 flex-shrink-0'>
						<p className='text-xl text-foreground font-medium text-center leading-tight'>{currentQuestion?.question}</p>
					</Card>

					<div className='mb-4'>
						<AnswerButton
							answers={currentQuestion?.answers}
							answered={answered}
							selectedAnswer={selectedAnswer}
							currentQuestion={currentQuestion}
							onAnswerClick={handleAnswerSelect}
							showResult={answered}
						/>
					</div>

					<Button
						onClick={handleSubmit}
						disabled={selectedAnswer === null || answered}
						size={ButtonSize.LG}
						className='w-full py-4 text-base mb-3 flex-shrink-0'
					>
						{answered ? LoadingMessages.PROCESSING : 'Submit Answer'}
					</Button>

					<div className='text-center flex-shrink-0 flex justify-center gap-4'>
						{isUnlimited && currentQuestionIndex > 0 && (
							<Button
								onClick={handleFinishUnlimitedGame}
								variant={VariantBase.DEFAULT}
								size={ButtonSize.SM}
								className='text-xs'
							>
								Finish Game
							</Button>
						)}
						<Button
							onClick={() => setShowExitDialog(true)}
							size={ButtonSize.SM}
							variant={VariantBase.MINIMAL}
							className='text-xs'
						>
							Exit Game
						</Button>
					</div>
				</div>
			</div>
		</main>
	);
}
