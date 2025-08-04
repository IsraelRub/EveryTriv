import { motion } from 'framer-motion';

interface FavoriteTopicsProps {
	favorites: Array<{ topic: string; difficulty: string }>;
	onRemove: (index: number) => void;
	onSelect?: (favorite: { topic: string; difficulty: string }) => void;
}

// פונקציה להצגת רמת הקושי בצורה ידידותית למשתמש
const displayDifficulty = (difficulty: string) => {
	if (difficulty.startsWith('custom:')) {
		const customText = difficulty.substring(7);
		// נקצר טקסט ארוך לתצוגה
		if (customText.length > 35) {
			return `Custom: ${customText.substring(0, 35)}...`;
		}
		return `Custom: ${customText}`;
	}
	
	// רמות קושי רגילות
	switch (difficulty) {
		case 'easy':
			return 'Easy';
		case 'medium':
			return 'Medium';
		case 'hard':
			return 'Hard';
		default:
			return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
	}
};

// פונקציה לקבלת צבע תג לפי רמת קושי
const getDifficultyBadgeClass = (difficulty: string) => {
	if (difficulty.startsWith('custom:')) {
		return 'bg-info';
	}
	
	switch (difficulty) {
		case 'easy':
			return 'bg-success';
		case 'medium':
			return 'bg-warning';
		case 'hard':
			return 'bg-danger';
		default:
			return 'bg-primary';
	}
};

export default function FavoriteTopics({ favorites, onRemove, onSelect }: FavoriteTopicsProps) {
	if (favorites.length === 0) {
		return (
			<div className='mt-4'>
				<h2 className='h4 text-white mb-3'>Favorites</h2>
				<p className='text-white-50'>
					No favorites yet. Add some topic and difficulty combinations to access them quickly!
				</p>
			</div>
		);
	}

	return (
		<div className='mt-4'>
			<h2 className='h4 text-white mb-3'>
				Favorites 
				<span className='badge bg-secondary ms-2'>{favorites.length}</span>
			</h2>
			<div className='d-flex flex-wrap gap-2'>
				{favorites.map((fav, i) => (
					<motion.div
						key={i}
						className={`badge ${getDifficultyBadgeClass(fav.difficulty)} d-flex align-items-center position-relative`}
						style={{ 
							fontSize: '0.875rem',
							padding: '0.5rem 0.75rem',
							maxWidth: '300px',
							cursor: onSelect ? 'pointer' : 'default'
						}}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, delay: i * 0.1 }}
						whileHover={{ 
							scale: 1.05,
							boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
						}}
						onClick={() => onSelect && onSelect(fav)}
						title={`Click to use: ${fav.topic} - ${displayDifficulty(fav.difficulty)}`}
					>
						<div className='d-flex flex-column align-items-start'>
							<span className='fw-bold'>{fav.topic}</span>
							<small className='opacity-75'>{displayDifficulty(fav.difficulty)}</small>
						</div>
						<button
							onClick={(e) => {
								e.stopPropagation();
								onRemove(i);
							}}
							className='btn-close btn-close-white ms-2'
							style={{ fontSize: '0.7rem' }}
							aria-label='Remove favorite'
							title='Remove from favorites'
						/>
					</motion.div>
				))}
			</div>
			{favorites.some(fav => fav.difficulty.startsWith('custom:')) && (
				<small className='text-white-50 mt-2 d-block'>
					💡 Custom difficulties are shown with their full descriptions
				</small>
			)}
		</div>
	);
}