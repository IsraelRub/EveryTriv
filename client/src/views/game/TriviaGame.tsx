import { TriviaAnswer, TriviaQuestion } from '@/shared/types';
import { motion } from 'framer-motion';
import { fadeInVariants, popVariants, staggerContainer, PulseEffect } from '@/shared/components/animations';
import { useParticleSystem } from '@/shared/hooks/useAdvancedAnimations';
import { useEffect } from 'react';

interface TriviaGameProps {
	trivia: TriviaQuestion;
	selected: number | null;
	onAnswer: (index: number) => void;
}

export default function TriviaGame({ trivia, selected, onAnswer }: TriviaGameProps) {
	const { particles, addParticle } = useParticleSystem();

	// Add particles when a correct answer is selected
	useEffect(() => {
		if (selected !== null && trivia.answers[selected]?.isCorrect) {
			// Add multiple particles for celebration
			for (let i = 0; i < 10; i++) {
				setTimeout(() => {
					addParticle(
						Math.random() * window.innerWidth,
						Math.random() * window.innerHeight,
						{
							color: '#10b981',
							size: 3,
							life: 2000,
						}
					);
				}, i * 50);
			}
		}
	}, [selected, trivia.answers, addParticle]);

	return (
		<div className="relative">
			{/* Particle System */}
			{particles.map(particle => (
				<motion.div
					key={particle.id}
					className="absolute rounded-full pointer-events-none z-10"
					style={{
						left: particle.x,
						top: particle.y,
						width: particle.size,
						height: particle.size,
						backgroundColor: particle.color,
					}}
					initial={{ opacity: 1, scale: 1 }}
					animate={{ 
						opacity: 0, 
						scale: 0,
						y: particle.y - 100,
					}}
					transition={{ duration: particle.life / 1000 }}
				/>
			))}

			{/* Main Game Content */}
		<motion.div
			className='mt-4 bg-white bg-opacity-20 rounded p-4 glass-morphism'
			variants={fadeInVariants}
			initial="hidden"
			animate="visible"
			transition={{ duration: 0.8, ease: 'easeOut' }}
		>
			<motion.h3
				className='text-2xl font-bold mb-3 text-white'
				variants={fadeInVariants}
				initial="hidden"
				animate="visible"
				transition={{ duration: 0.6, delay: 0.2 }}
			>
				{trivia.question}
			</motion.h3>
			<motion.div 
				className='grid grid-cols-1 md:grid-cols-2 gap-3'
				variants={staggerContainer}
				initial="hidden"
				animate="visible"
				transition={{ 
					staggerChildren: 0.1,
					delayChildren: 0.3 
				}}
			>
				{trivia.answers.map((a: TriviaAnswer, i: number) => (
					<motion.div
						key={i}
						className='w-full'
						variants={popVariants}
						transition={{ 
							type: 'spring', 
							stiffness: 300, 
							damping: 15,
							delay: i * 0.1 
						}}
					>
						{a.isCorrect && selected === i ? (
							<PulseEffect>
								<motion.button
									className={`w-full p-3 text-lg rounded transition-colors ${
										selected !== null
											? a.isCorrect
												? 'bg-green-600 text-white'
												: selected === i
													? 'bg-red-600 text-white'
													: 'bg-gray-300 text-gray-500 cursor-not-allowed'
											: 'bg-white text-gray-900 hover:bg-gray-100'
									}`}
									onClick={() => onAnswer(i)}
									disabled={selected !== null}
									title={
										selected === null ? 'Click to select your answer' : a.isCorrect ? 'Correct answer!' : 'Wrong answer'
									}
									whileHover={
										selected === null
											? {
													scale: 1.05,
													boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
												}
											: {}
									}
									whileTap={selected === null ? { scale: 0.95 } : {}}
								>
									{a.text}
								</motion.button>
							</PulseEffect>
						) : (
							<motion.button
								className={`w-full p-3 text-lg rounded transition-colors ${
									selected !== null
										? a.isCorrect
											? 'bg-green-600 text-white'
											: selected === i
												? 'bg-red-600 text-white'
												: 'bg-gray-300 text-gray-500 cursor-not-allowed'
										: 'bg-white text-gray-900 hover:bg-gray-100'
								}`}
								onClick={() => onAnswer(i)}
								disabled={selected !== null}
								title={
									selected === null ? 'Click to select your answer' : a.isCorrect ? 'Correct answer!' : 'Wrong answer'
								}
								whileHover={
									selected === null
										? {
												scale: 1.05,
												boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
											}
										: {}
								}
								whileTap={selected === null ? { scale: 0.95 } : {}}
							>
								{a.text}
							</motion.button>
						)}
					</motion.div>
				))}
			</motion.div>
		</motion.div>
		</div>
	);
}
