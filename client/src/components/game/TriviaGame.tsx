import { escapeHtml,truncateText } from 'everytriv-shared/utils';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

import { useOptimizedAnimations } from '../../hooks';
import { logger } from '../../services';
import { TriviaGameProps } from '../../types';
import { createStaggerContainer,FadeInDown, FadeInUp, HoverScale, PulseEffect, ScaleIn } from '../animations';
import { GridLayout } from '../layout';

/**
 * Trivia game component with enhanced animations and particle effects
 * 
 * @component TriviaGame
 * @description Main trivia game component with question display, answer selection, and visual feedback
 * @param trivia - Trivia question and answer data
 * @param selected - Currently selected answer index
 * @param onAnswer - Callback function for answer selection
 * @returns JSX.Element The rendered trivia game interface
 */
export default function TriviaGame({ trivia, selected, onAnswer }: TriviaGameProps) {
	const { particles, addParticle } = useOptimizedAnimations(0, { 
		enableParticles: true, 
		enableScoreAnimations: true,
	});
	
	const staggerVariants = createStaggerContainer(0.1);

	const handleAnswerClick = (index: number) => {
		if (selected !== null) return;

		logger.user(`🎯 Answer selected`, {
			questionText: truncateText(escapeHtml(trivia.question), 100),
			answerIndex: index,
			answerText: truncateText(escapeHtml(trivia.answers[index].text), 50),
			difficulty: trivia.difficulty,
			topic: trivia.topic,
			isCorrect: trivia.answers[index].isCorrect,
			timestamp: new Date().toISOString(),
		});

		onAnswer(0, index);
	};

	useEffect(() => {
		if (selected !== null && trivia.answers[selected]?.isCorrect) {
			for (let i = 0; i < 10; i++) {
				setTimeout(() => {
					addParticle(Math.random() * window.innerWidth, Math.random() * window.innerHeight, {
						color: '#10b981',
						size: 3,
						life: { min: 2000, max: 2000 },
					});
				}, i * 50);
			}
		}
	}, [selected, trivia.answers, addParticle]);

	return (
		<div className='relative'>
			{/* Particle System */}
			{particles.map((particle) => (
				<div
					key={particle.id}
					className='absolute rounded-full pointer-events-none z-10'
					style={{
						left: particle.x,
						top: particle.y,
						width: particle.size,
						height: particle.size,
						backgroundColor: particle.color,
						animation: `fadeOut ${particle.life / 1000}s ease-out forwards`,
					}}
				/>
			))}

			{/* Main Game Content */}
			<FadeInUp className='mt-4 bg-white bg-opacity-20 rounded p-4 glass'>
				<FadeInDown className='text-2xl font-bold mb-3 text-white'>{trivia.question}</FadeInDown>
				<motion.div variants={staggerVariants} initial="hidden" animate="visible">
					<GridLayout variant='game' gap='md'>
						{trivia.answers.map((a, i: number) => (
							<ScaleIn key={i} className='w-full'>
								{a.isCorrect && selected === i ? (
									<PulseEffect>
										<HoverScale>
											<button
												className={`w-full p-3 text-lg rounded transition-colors ${
													selected !== null
														? a.isCorrect
															? 'bg-green-600 text-white'
															: selected === i
																? 'bg-red-600 text-white'
																: 'bg-gray-300 text-gray-500 cursor-not-allowed'
														: 'bg-white text-gray-900 hover:bg-gray-100'
												}`}
												onClick={() => handleAnswerClick(i)}
												disabled={selected !== null}
												title={
													selected === null
														? 'Click to select your answer'
														: a.isCorrect
															? 'Correct answer!'
															: 'Wrong answer'
												}
											>
												{a.text}
											</button>
										</HoverScale>
									</PulseEffect>
								) : (
									<HoverScale>
										<button
											className={`w-full p-3 text-lg rounded transition-colors ${
												selected !== null
													? a.isCorrect
														? 'bg-green-600 text-white'
														: selected === i
															? 'bg-red-600 text-white'
															: 'bg-gray-300 text-gray-500 cursor-not-allowed'
													: 'bg-white text-gray-900 hover:bg-gray-100'
											}`}
											onClick={() => handleAnswerClick(i)}
											disabled={selected !== null}
											title={
												selected === null
													? 'Click to select your answer'
													: a.isCorrect
														? 'Correct answer!'
														: 'Wrong answer'
											}
										>
											{a.text}
										</button>
									</HoverScale>
								)}
							</ScaleIn>
						))}
					</GridLayout>
				</motion.div>
			</FadeInUp>
		</div>
	);
}
