import { motion } from 'framer-motion';
import { TriviaGameProps, TriviaAnswer } from '../types';
import { Button } from '../styles/ui/Button';
import { cn } from '../utils/cn';
import { useAudioContext } from '../audio';
import { AudioKey } from '../audio/constants';

export default function TriviaGame({ trivia, selected, onAnswer }: TriviaGameProps) {
  const { playSound } = useAudioContext();

  const handleAnswer = (index: number) => {
    const isCorrect = trivia.answers[index].isCorrect;
    playSound(isCorrect ? AudioKey.CORRECT_ANSWER : AudioKey.WRONG_ANSWER);
    onAnswer(index);
  };

	return (
		<motion.div
			initial={{ opacity: 0, y: 30, scale: 0.9 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.8, ease: 'easeOut' }}
			className="mt-4"
		>
			<div className="glass-morphism rounded-lg p-6">
				<motion.h2
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className="text-xl font-semibold mb-6"
				>
					{trivia.question}
				</motion.h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{trivia.answers.map((answer: TriviaAnswer, index: number) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 20, scale: 0.8 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
						>
							<Button
								variant={
									selected !== null
										? answer.isCorrect
											? 'primary'
											: selected === index
												? 'secondary'
												: 'ghost'
										: 'ghost'
								}
								size="lg"
								isGlassy
								className={cn(
									'w-full h-full min-h-[80px] text-lg',
									selected !== null && (
										answer.isCorrect
											? 'bg-green-500/20 hover:bg-green-500/20'
											: selected === index
												? 'bg-red-500/20 hover:bg-red-500/20'
												: 'opacity-50'
									)
								)}
								onClick={() => handleAnswer(index)}
								disabled={selected !== null}
								title={
									selected === null
										? 'Click to select your answer'
										: answer.isCorrect
											? 'Correct answer!'
											: 'Wrong answer'
								}
							>
								{answer.text}
							</Button>
						</motion.div>
					))}
				</div>
			</div>
		</motion.div>
	);
}
