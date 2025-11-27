/**
 * Question Timer Component
 *
 * @module QuestionTimer
 * @description Displays countdown timer for current question in multiplayer game
 * @used_by client/src/views/multiplayer
 */
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import { fadeInUp } from '../animations';

interface QuestionTimerProps {
	timeRemaining: number;
	totalTime: number;
	onTimeout?: () => void;
	className?: string;
}

export default function QuestionTimer({ timeRemaining, totalTime, onTimeout, className = '' }: QuestionTimerProps) {
	const [displayTime, setDisplayTime] = useState(timeRemaining);

	useEffect(() => {
		setDisplayTime(timeRemaining);
	}, [timeRemaining]);

	useEffect(() => {
		if (timeRemaining <= 0 && onTimeout) {
			onTimeout();
		}
	}, [timeRemaining, onTimeout]);

	const percentage = (displayTime / totalTime) * 100;
	const isLowTime = displayTime <= 10;

	return (
		<motion.div variants={fadeInUp} initial='hidden' animate='visible' className={`${className} relative`}>
			<div className='flex items-center justify-center gap-4'>
				<div className='relative w-24 h-24'>
					<svg className='transform -rotate-90 w-24 h-24'>
						<circle
							cx='48'
							cy='48'
							r='40'
							stroke='currentColor'
							strokeWidth='8'
							fill='transparent'
							className='text-gray-700'
						/>
						<circle
							cx='48'
							cy='48'
							r='40'
							stroke='currentColor'
							strokeWidth='8'
							fill='transparent'
							strokeDasharray={`${2 * Math.PI * 40}`}
							strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
							className={`transition-all duration-1000 ${isLowTime ? 'text-red-500' : 'text-green-500'}`}
						/>
					</svg>
					<div className='absolute inset-0 flex items-center justify-center'>
						<span className={`text-2xl font-bold ${isLowTime ? 'text-red-500 animate-pulse' : 'text-white'}`}>
							{displayTime}
						</span>
					</div>
				</div>
				<div>
					<div className='text-sm text-gray-400'>Time Remaining</div>
					<div className={`text-lg font-semibold ${isLowTime ? 'text-red-500' : 'text-white'}`}>{displayTime}s</div>
				</div>
			</div>
		</motion.div>
	);
}
