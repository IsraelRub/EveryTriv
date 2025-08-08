import { TriviaAnswer, TriviaQuestion } from '@/shared/types';
import { motion } from 'framer-motion';

interface TriviaGameProps {
	trivia: TriviaQuestion;
	selected: number | null;
	onAnswer: (index: number) => void;
}

export default function TriviaGame({ trivia, selected, onAnswer }: TriviaGameProps) {
	return (
		<motion.div
			className='mt-4 bg-white bg-opacity-20 rounded p-4 glass-morphism'
			initial={{ opacity: 0, y: 30, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.8, ease: 'easeOut' }}
		>
			<motion.h3
				className='h3 fw-bold mb-3 text-white'
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.6, delay: 0.2 }}
			>
				{trivia.question}
			</motion.h3>
			<div className='row g-3'>
				{trivia.answers.map((a: TriviaAnswer, i: number) => (
					<motion.div
						key={i}
						className='col-12 col-md-6'
						initial={{ opacity: 0, y: 20, scale: 0.8 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
					>
						<motion.button
							className={`btn btn-light w-100 p-3 fs-5 ${
								selected !== null
									? a.isCorrect
										? 'btn-success'
										: selected === i
											? 'btn-danger'
											: 'btn-light disabled'
									: 'btn-light'
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
					</motion.div>
				))}
			</div>
		</motion.div>
	);
}
