import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';

import {
	ButtonSize,
	ComponentSize,
	GameKey,
	GameSessionHudCounterLayout,
	LoadingKey,
	TimerMode,
	VariantBase,
} from '@/constants';
import type { UseSingleSessionReturn } from '@/types';
import { getDifficultyDisplayLabel } from '@/utils';
import { AnswerButton, Button, Card, ExitGameButton, GameSessionHud, Progress, Spinner } from '@/components';

export function SingleSessionPlayArea(session: UseSingleSessionReturn) {
	const { t } = useTranslation();
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
		handleExitGame,
		score,
	} = session;

	return (
		<main className='view-main animate-fade-in-up-simple relative'>
			{isFetchingMoreQuestions && (
				<div className='absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
					<Card className='p-6 flex flex-col items-center gap-4 max-w-sm mx-4'>
						<Spinner size={ComponentSize.LG} className='text-primary' />
						<p className='text-foreground font-medium text-center'>{t(LoadingKey.FETCHING_QUESTIONS)}</p>
						<p className='text-sm text-muted-foreground text-center'>{t(LoadingKey.FETCHING_QUESTIONS_HINT)}</p>
					</Card>
				</div>
			)}
			<div className='container mx-auto max-w-4xl h-full flex flex-col'>
				<div className='mb-4 flex-shrink-0'>
					<GameSessionHud
						questionCurrent={currentQuestionIndex + 1}
						questionTotal={hasQuestionLimit ? gameQuestionCount : undefined}
						counterLayout={GameSessionHudCounterLayout.SINGLE}
						showCreditBadge={isUnlimited && !isAdmin}
						totalCredits={creditBalanceTotal}
						timerKey='game-timer'
						mode={isTimeLimited ? TimerMode.COUNTDOWN : TimerMode.ELAPSED}
						initialTime={isTimeLimited ? timeLimit : undefined}
						label={isTimeLimited ? t(GameKey.GAME_TIME) : t(GameKey.TIME_ELAPSED)}
						showProgressBar={isTimeLimited}
						startTime={gameStartTime ?? undefined}
						onTimeout={isTimeLimited ? handleGameTimeout : undefined}
						timerAside={
							hasQuestionLimit ? (
								<span className='text-sm font-bold text-primary'>
									{t(GameKey.SCORE_LABEL)}: {score}
								</span>
							) : undefined
						}
					/>

					{hasQuestionLimit && (
						<div className='mb-3'>
							<Progress value={progress} className='h-2' />
						</div>
					)}

					<div className='mb-3 text-center'>
						<div className='flex items-center justify-center gap-2 text-xs text-muted-foreground flex-wrap'>
							<span>
								{t(GameKey.TOPIC_LABEL)}: {currentTopic ?? t(GameKey.DEFAULT_TOPIC)}
							</span>
							<span className='text-muted-foreground/50'>•</span>
							<span>
								{t(GameKey.DIFFICULTY_LABEL)}: {getDifficultyDisplayLabel(currentDifficulty, t)}
							</span>
							{streak > 1 && (
								<>
									<span className='text-muted-foreground/50'>•</span>
									<span className='flex items-center gap-1 text-primary font-medium'>
										<Zap className='h-3.5 w-3.5' />
										{t(GameKey.STREAK)}: {streak}
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

					{selectedAnswer !== null && (
						<Button
							onClick={handleSubmit}
							disabled={answered}
							size={ButtonSize.LG}
							className='w-full py-4 text-base mb-3 flex-shrink-0'
						>
							{answered ? t(LoadingKey.PROCESSING) : t(GameKey.SUBMIT_ANSWER)}
						</Button>
					)}

					<div className='text-center flex-shrink-0'>
						{isUnlimited && currentQuestionIndex > 0 ? (
							<Button
								onClick={handleFinishUnlimitedGame}
								variant={VariantBase.DEFAULT}
								size={ButtonSize.SM}
								className='text-xs'
							>
								{t(GameKey.FINISH_GAME)}
							</Button>
						) : (
							!isUnlimited && <ExitGameButton onConfirm={handleExitGame} />
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
