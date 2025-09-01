import { VALID_GAME_MODES, VALID_QUESTION_COUNTS } from 'everytriv-shared/constants';
import { GameMode as GameModeEnum } from 'everytriv-shared/types/game.types';
import { useState } from 'react';

import { GameModeUIProps } from '../../types';
import { FadeInUp, ScaleIn } from '../animations';
import { Icon } from '../icons';
import { Button } from '../ui';

export default function GameMode({ isVisible, onSelectMode, onCancel }: GameModeUIProps) {
	const [mode, setMode] = useState<GameModeEnum>(GameModeEnum.CLASSIC);
	const [timeLimit, setTimeLimit] = useState(60); // Default 1 minute
	const [questionLimit, setQuestionLimit] = useState(20); // Default 20 questions

	// Validate game mode
	const isValidGameMode = (mode: GameModeEnum): boolean => {
		return VALID_GAME_MODES.includes(mode);
	};

	// Validate question count
	const isValidQuestionCount = (count: number): boolean => {
		return VALID_QUESTION_COUNTS.includes(count as typeof VALID_QUESTION_COUNTS[number]);
	};

	if (!isVisible) return null;

	return (
		<div className='fixed inset-0 flex items-center justify-center z-50 bg-black/50'>
			<ScaleIn className='bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md glass'>
				<h2 className='text-2xl font-bold text-white mb-4'>Select Game Mode</h2>

				<div className='space-y-6'>
					{/* Game mode buttons */}
					<div className='flex flex-col gap-3'>
						<Button
							variant={mode === GameModeEnum.TIME_ATTACK ? 'primary' : 'ghost'}
							className='w-full justify-between items-center flex'
							onClick={() => {
								if (isValidGameMode(GameModeEnum.TIME_ATTACK)) {
									setMode(GameModeEnum.TIME_ATTACK);
								}
							}}
						>
							<span>
								<Icon name='timer' size='sm' className='mr-1' /> Time Limited
							</span>
							<span className='text-sm opacity-80'>
								{timeLimit >= 60 ? `${Math.floor(timeLimit / 60)}m ${timeLimit % 60}s` : `${timeLimit}s`}
							</span>
						</Button>

						{mode === GameModeEnum.TIME_LIMITED && (
							<FadeInUp className='pl-8 flex items-center gap-2'>
								<input
									type='range'
									min={10}
									max={300}
									step={10}
									value={timeLimit}
									onChange={(e) => setTimeLimit(parseInt(e.target.value))}
									className='w-full'
								/>
								<span className='text-white min-w-[60px] text-center'>
									{timeLimit >= 60
										? `${Math.floor(timeLimit / 60)}:${(timeLimit % 60).toString().padStart(2, '0')}`
										: `0:${timeLimit.toString().padStart(2, '0')}`}
								</span>
							</FadeInUp>
						)}

						<Button
							variant={mode === GameModeEnum.QUESTION_LIMITED ? 'primary' : 'ghost'}
							className='w-full justify-between items-center flex'
							onClick={() => {
								if (isValidGameMode(GameModeEnum.QUESTION_LIMITED)) {
									setMode(GameModeEnum.QUESTION_LIMITED);
								}
							}}
						>
							<span>
								<Icon name='list' size='sm' className='mr-1' /> Question Limited
							</span>
							<span className='text-sm opacity-80'>{questionLimit} questions</span>
						</Button>

						{mode === GameModeEnum.QUESTION_LIMITED && (
							<FadeInUp className='pl-8 flex items-center gap-2'>
								<input
									type='range'
									min={5}
									max={50}
									step={5}
									value={questionLimit}
									onChange={(e) => {
										const newCount = parseInt(e.target.value);
										if (isValidQuestionCount(newCount)) {
											setQuestionLimit(newCount);
										}
									}}
									className='w-full'
								/>
								<span className='text-white min-w-[40px] text-center'>{questionLimit}</span>
							</FadeInUp>
						)}

						<Button
							variant={mode === GameModeEnum.UNLIMITED ? 'primary' : 'ghost'}
							className='w-full text-left'
							onClick={() => {
								if (isValidGameMode(GameModeEnum.UNLIMITED)) {
									setMode(GameModeEnum.UNLIMITED);
								}
							}}
						>
							<span>
								<Icon name='infinity' size='sm' className='mr-1' /> Unlimited
							</span>
						</Button>

						{mode === GameModeEnum.UNLIMITED && (
							<FadeInUp className='pl-8 text-white/70 text-sm'>
								<p>Play as many questions as you want. Game continues until you stop.</p>
							</FadeInUp>
						)}
					</div>

					{/* Description */}
					<div className='p-3 bg-white/10 rounded-lg'>
						<p className='text-white/80 text-sm'>
							{mode === GameModeEnum.TIME_LIMITED
								? 'Answer as many questions as you can before time runs out!'
								: mode === GameModeEnum.QUESTION_LIMITED
									? 'Complete a set number of questions to finish the game.'
									: 'Keep playing as long as you want with no limits!'}
						</p>
					</div>

					{/* Action buttons */}
					<div className='flex gap-3 justify-end'>
						<Button variant='ghost' onClick={onCancel}>
							Cancel
						</Button>
						<Button
							variant='primary'
							onClick={() =>
								onSelectMode?.({
									mode,
									timeLimit: mode === GameModeEnum.TIME_LIMITED ? timeLimit : undefined,
									questionLimit: mode === GameModeEnum.QUESTION_LIMITED ? questionLimit : undefined,
								})
							}
						>
							Start Game
						</Button>
					</div>
				</div>
			</ScaleIn>
		</div>
	);
}
