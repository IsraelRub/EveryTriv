import { clientLogger,escapeHtml, truncateText  } from '@shared';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { TriviaGameProps } from '../../types';
import { createStaggerContainer, fadeInDown, fadeInUp, hoverScale, scaleIn } from '../animations';
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
  // Simple particle state for animations
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      type: string;
      color: string;
      size: number;
      life: number;
    }>
  >([]);

  const addParticle = (
    x: number,
    y: number,
    config: { color: string; size: number; life: { min: number; max: number } }
  ) => {
    const newParticle = {
      id: Date.now(),
      x,
      y,
      type: 'particle',
      color: config.color,
      size: config.size,
      life: config.life.min,
    };
    setParticles(prev => [...prev, newParticle]);
    // Remove particle after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, newParticle.life);
  };

  const staggerVariants = createStaggerContainer(0.1);

  const handleAnswerClick = (index: number) => {
    if (selected !== null) return;

    clientLogger.user(`🎯 Answer selected`, {
      questionText: truncateText(escapeHtml(trivia.question), 100),
      answerIndex: index,
      answerText: truncateText(escapeHtml(trivia.answers[index].text), 50),
      difficulty: ((trivia as Record<string, unknown>).difficulty as string) || 'unknown',
      topic: ((trivia as Record<string, unknown>).topic as string) || 'unknown',
      isCorrect: trivia.answers[index].isCorrect,
      timestamp: new Date().toISOString(),
    });

    onAnswer(index);
  };

  useEffect(() => {
    if (selected !== null && selected !== undefined && trivia.answers[selected]?.isCorrect) {
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
      {particles.map(particle => (
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
      <motion.div
        variants={fadeInUp}
        initial='hidden'
        animate='visible'
        className='mt-4 bg-white bg-opacity-20 rounded p-4 glass'
      >
        <motion.div
          variants={fadeInDown}
          initial='hidden'
          animate='visible'
          className='text-2xl font-bold mb-3 text-white'
        >
          {trivia.question}
        </motion.div>
        <motion.div variants={staggerVariants} initial='hidden' animate='visible'>
          <GridLayout variant='game' gap='md'>
            {trivia.answers.map((a: { text: string; isCorrect: boolean }, i: number) => (
              <motion.div
                key={i}
                variants={scaleIn}
                initial='hidden'
                animate='visible'
                className='w-full'
              >
                {a.isCorrect && selected === i ? (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <motion.div variants={hoverScale} initial='initial' whileHover='hover'>
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
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div variants={hoverScale} initial='initial' whileHover='hover'>
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
                  </motion.div>
                )}
              </motion.div>
            ))}
          </GridLayout>
        </motion.div>
      </motion.div>
    </div>
  );
}
