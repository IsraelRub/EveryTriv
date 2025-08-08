import { motion } from 'framer-motion';
import { displayDifficulty } from '../utils/customDifficulty.utils';
import { staggerContainer } from './animations';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import { useUIAudio } from '../audio/hooks';

interface FavoriteTopicsProps {
	favorites: Array<{ topic: string; difficulty: string }>;
	onRemove: (index: number) => void;
	onSelect?: (favorite: { topic: string; difficulty: string }) => void;
}

// Individual Favorite Card component with gesture support
const FavoriteCard = ({ 
	fav, 
	index, 
	onSelect, 
	onRemove 
}: { 
	fav: { topic: string; difficulty: string }; 
	index: number; 
	onSelect?: (favorite: { topic: string; difficulty: string }) => void;
	onRemove: (index: number) => void;
}) => {
	const { playSwipe, playClick, playPop, playWhoosh } = useUIAudio();
	
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
			// Play whoosh sound when card is dismissed
			playWhoosh();
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
			className={`group relative glass-morphism rounded-lg p-3 cursor-pointer transition-all duration-200 ${
				fav.difficulty === 'easy' ? 'hover:border-green-400/50' :
				fav.difficulty === 'medium' ? 'hover:border-yellow-400/50' :
				fav.difficulty === 'hard' ? 'hover:border-red-400/50' :
				'hover:border-blue-400/50'
			}`}
			onClick={() => {
				playClick();
				onSelect && onSelect(fav);
			}}
			title={`Click to use: ${fav.topic} - ${displayDifficulty(fav.difficulty)} | Swipe to remove`}
		>
			<div className='flex flex-col'>
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<div className='font-semibold text-white text-sm mb-1 truncate'>
							{fav.topic}
						</div>
						<div className={`text-xs px-2 py-1 rounded-full inline-block ${
							fav.difficulty === 'easy' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
							fav.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
							fav.difficulty === 'hard' ? 'bg-red-500/20 text-red-300 border border-red-400/30' :
							'bg-blue-500/20 text-blue-300 border border-blue-400/30'
						}`}>
							{displayDifficulty(fav.difficulty).length > 20 ? 
								displayDifficulty(fav.difficulty).substring(0, 20) + '...' : 
								displayDifficulty(fav.difficulty)
							}
						</div>
					</div>
					<button
						className='opacity-0 group-hover:opacity-100 text-white/60 hover:text-red-400 transition-all p-1 ml-2'
						onClick={(e) => {
							e.stopPropagation();
							playPop();
							onRemove(index);
						}}
						title="Remove favorite"
					>
						×
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
				<div className="flex items-center justify-between mb-4">
					<h3 className='text-lg font-semibold text-white'>⭐ Favorites</h3>
				</div>
				<div className="glass-morphism rounded-lg p-6 text-center">
					<p className='text-white/70 mb-2'>
						No favorites yet!
					</p>
					<p className='text-white/50 text-sm'>
						Add some topic and difficulty combinations to access them quickly.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className='mt-6'>
			<div className="flex items-center justify-between mb-4">
				<h3 className='text-lg font-semibold text-white'>⭐ Favorites</h3>
				<span className='bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-400/30'>
					{favorites.length}
				</span>
			</div>
			<motion.div 
				className='flex flex-wrap gap-3'
				variants={staggerContainer}
				initial="hidden"
				animate="visible"
				transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
			>
				{favorites.map((fav, i) => (
					<FavoriteCard
						key={`fav-${i}`}
						fav={fav}
						index={i}
						onSelect={onSelect}
						onRemove={onRemove}
					/>
				))}
			</motion.div>
			{favorites.some(fav => fav.difficulty.startsWith('custom:')) && (
				<div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
					<p className='text-blue-300 text-sm'>
						💡 Custom difficulties are shown with their full descriptions
					</p>
				</div>
			)}
		</div>
	);
}