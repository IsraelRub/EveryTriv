import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import { Progress } from '@/components';

interface GameTimerProps {
	duration: number;
	onTimeUp?: () => void;
}

export default function GameTimer({ duration, onTimeUp }: GameTimerProps) {
	const [timeLeft, setTimeLeft] = useState(duration);
	const progress = (timeLeft / duration) * 100;

	useEffect(() => {
		if (timeLeft <= 0) {
			onTimeUp?.();
			return;
		}

		const timer = setInterval(() => {
			setTimeLeft(prev => prev - 1);
		}, 1000);

		return () => clearInterval(timer);
	}, [timeLeft, onTimeUp]);

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='space-y-2'>
			<div className='flex justify-between items-center'>
				<span className='text-sm font-medium text-muted-foreground'>Time Remaining</span>
				<span className='text-lg font-bold text-foreground'>{timeLeft}s</span>
			</div>
			<Progress value={progress} className='h-2' />
		</motion.div>
	);
}
