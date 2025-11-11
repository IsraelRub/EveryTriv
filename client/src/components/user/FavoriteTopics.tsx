import { animated, useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { motion } from 'framer-motion';

import { CUSTOM_DIFFICULTY_PREFIX, DifficultyLevel } from '@shared/constants';
import type { FavoriteTopic } from '@shared/types';
import { getDifficultyDisplayText } from '@shared/validation';

import { AudioKey, ComponentSize } from '../../constants';
import { audioService } from '../../services';
import { FavoriteTopicsProps } from '../../types';
import { createStaggerContainer } from '../animations';
import { Icon } from '../IconLibrary';

// Individual Favorite Card component with gesture support
const FavoriteCard = ({
	fav,
	index,
	onSelect,
	onRemove,
}: {
	fav: FavoriteTopic;
	index: number;
	onSelect?: (favorite: FavoriteTopic) => void;
	onRemove: (index: number) => void;
}) => {
	// Audio hooks for user interactions
	const playSwipe = () => {
		audioService.play(AudioKey.SWIPE);
	};
	const playClick = () => {
		audioService.play(AudioKey.BUTTON_CLICK);
	};
	const playPop = () => {
		audioService.play(AudioKey.POP);
	};

	const [springs, api] = useSpring(() => ({
		x: 0,
		scale: 1,
		rotateZ: 0,
	}));

	const bind = useDrag(({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
		const trigger = vx > 0.2; // Trigger threshold
		const dir = xDir < 0 ? -1 : 1;
		const isGone = !active && trigger;
		const x = isGone ? (200 + window.innerWidth) * dir : active ? mx : 0;
		const rot = mx / 100 + (isGone ? dir * 10 * vx : 0);
		const scale = active ? 1.1 : 1;

		api.start({
			x,
			rotateZ: rot,
			scale,
			immediate: false,
		});

		// Play sound effects
		if (active && Math.abs(mx) > 10) {
			// Play swipe sound when dragging starts
			playSwipe();
		}

		if (isGone) {
			// Play pop sound when card is dismissed
			playPop();
			setTimeout(() => onRemove(index), 300);
		}
	});

	return (
		<animated.div
			{...bind()}
			style={{
				...springs,
				touchAction: 'none',
				maxWidth: '280px',
			}}
			className={`group relative glass rounded-lg p-3 cursor-pointer transition-all duration-200 ${
				fav.difficulty === DifficultyLevel.EASY
					? 'hover:border-green-400/50'
					: fav.difficulty === DifficultyLevel.MEDIUM
						? 'hover:border-yellow-400/50'
						: fav.difficulty === DifficultyLevel.HARD
							? 'hover:border-red-400/50'
							: 'hover:border-blue-400/50'
			}`}
			onClick={() => {
				playClick();
				onSelect?.(fav);
			}}
			title={`Click to use: ${fav.topic} - ${getDifficultyDisplayText(fav.difficulty)} | Swipe to remove`}
		>
			<div className='flex flex-col'>
				<div className='flex items-start justify-between'>
					<div className='flex-1 min-w-0'>
						<div className='font-semibold text-white text-sm mb-1 truncate'>{fav.topic}</div>
						<div
							className={`text-xs px-2 py-1 rounded-full inline-block ${
								fav.difficulty === DifficultyLevel.EASY
									? 'bg-green-500/20 text-green-300 border border-green-400/30'
									: fav.difficulty === DifficultyLevel.MEDIUM
										? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
										: fav.difficulty === DifficultyLevel.HARD
											? 'bg-red-500/20 text-red-300 border border-red-400/30'
											: 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
							}`}
						>
							{getDifficultyDisplayText(fav.difficulty).length > 20
								? `${getDifficultyDisplayText(fav.difficulty).substring(0, 20)}...`
								: getDifficultyDisplayText(fav.difficulty)}
						</div>
					</div>
					<button
						className='opacity-0 group-hover:opacity-100 text-white/60 hover:text-red-400 transition-all p-1 ml-2'
						onClick={e => {
							e.stopPropagation();
							playPop();
							onRemove(index);
						}}
						title='Remove favorite'
					>
						<Icon name='close' size={ComponentSize.SM} className='text-current' />
					</button>
				</div>
			</div>
		</animated.div>
	);
};

export default function FavoriteTopics({ favorites, onRemove, onSelect }: FavoriteTopicsProps) {
	if (favorites.length === 0) {
		return (
			<div className='mt-6'>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-lg font-semibold text-white'>
						<Icon name='star' size={ComponentSize.SM} className='mr-1' /> Favorites
					</h3>
				</div>
				<div className='glass rounded-lg p-6 text-center'>
					<p className='text-white/70 mb-2'>No favorites yet!</p>
					<p className='text-white/50 text-sm'>Add some topic and difficulty combinations to access them quickly.</p>
				</div>
			</div>
		);
	}

	return (
		<div className='mt-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-semibold text-white'>
					<Icon name='star' size={ComponentSize.SM} className='mr-1' /> Favorites
				</h3>
				<span className='bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-400/30'>
					{favorites.length}
				</span>
			</div>
			<motion.div
				variants={createStaggerContainer(0.1)}
				initial='hidden'
				animate='visible'
				className='flex flex-wrap gap-3'
			>
				{favorites.map((fav, i) => (
					<FavoriteCard key={`fav-${i}`} fav={fav} index={i} onSelect={onSelect} onRemove={onRemove} />
				))}
			</motion.div>
			{favorites.some(fav => fav.difficulty.startsWith(CUSTOM_DIFFICULTY_PREFIX)) && (
				<div className='mt-4 p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg'>
					<p className='text-blue-300 text-sm'>
						<Icon name='lightbulb' size={ComponentSize.SM} className='mr-1' /> Custom difficulties are shown with their
						full descriptions
					</p>
				</div>
			)}
		</div>
	);
}
