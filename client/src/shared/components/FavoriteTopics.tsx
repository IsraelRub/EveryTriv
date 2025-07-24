import { motion } from 'framer-motion';

interface FavoriteTopicsProps {
	favorites: Array<{ topic: string; difficulty: string }>;
	onRemove: (index: number) => void;
}

export default function FavoriteTopics({ favorites, onRemove }: FavoriteTopicsProps) {
	return (
		<div className='mt-4'>
			<h2 className='h4 text-white mb-3'>Favorites</h2>
			<div className='d-flex flex-wrap gap-2'>
				{favorites.map((fav, i) => (
					<motion.span
						key={i}
						className='badge bg-primary d-flex align-items-center'
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3 }}
					>
						<span>
							{fav.topic} ({fav.difficulty})
						</span>
						<button
							onClick={() => onRemove(i)}
							className='btn-close btn-close-white ms-2'
							aria-label='Remove favorite'
						/>
					</motion.span>
				))}
			</div>
		</div>
	);
}
