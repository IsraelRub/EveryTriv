import { motion } from 'framer-motion';
import { displayDifficulty } from '../utils/customDifficulty.utils';

interface FavoriteTopicsProps {
	favorites: Array<{ topic: string; difficulty: string }>;
	onRemove: (index: number) => void;
	onSelect?: (favorite: { topic: string; difficulty: string }) => void;
}

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
			<div className='flex flex-wrap gap-3'>
				{favorites.map((fav, i) => (
					<motion.div
						key={i}
						className={`group relative glass-morphism rounded-lg p-3 cursor-pointer transition-all duration-200 hover:scale-105 ${
							fav.difficulty === 'easy' ? 'hover:border-green-400/50' :
							fav.difficulty === 'medium' ? 'hover:border-yellow-400/50' :
							fav.difficulty === 'hard' ? 'hover:border-red-400/50' :
							'hover:border-blue-400/50'
						}`}
						style={{ 
							maxWidth: '280px',
						}}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, delay: i * 0.1 }}
						whileHover={{ 
							scale: 1.05,
							boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
						}}
						onClick={() => onSelect && onSelect(fav)}
						title={`Click to use: ${fav.topic} - ${displayDifficulty(fav.difficulty)}`}
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
									onClick={(e) => {
										e.stopPropagation();
										onRemove(i);
									}}
									className='ml-2 w-6 h-6 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-colors duration-200 flex items-center justify-center text-xs opacity-70 group-hover:opacity-100'
									aria-label='Remove favorite'
									title='Remove from favorites'
								>
									×
								</button>
							</div>
						</div>
					</motion.div>
				))}
			</div>
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