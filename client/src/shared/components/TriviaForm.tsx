import { FormEvent } from 'react';
import { motion } from 'framer-motion';

interface TriviaFormProps {
	topic: string;
	difficulty: string;
	loading: boolean;
	onTopicChange: (topic: string) => void;
	onDifficultyChange: (difficulty: string) => void;
	onSubmit: (e: FormEvent) => Promise<void>;
	onAddFavorite: () => void;
}

export default function TriviaForm({
	topic,
	difficulty,
	loading,
	onTopicChange,
	onDifficultyChange,
	onSubmit,
	onAddFavorite,
}: TriviaFormProps) {
	return (
		<form onSubmit={onSubmit} className='d-flex flex-column gap-3'>
			<input
				className='form-control form-control-lg'
				placeholder='Enter a topic (e.g. Science, Sports)'
				value={topic}
				onChange={(e) => onTopicChange(e.target.value)}
				required
			/>
			<select
				className='form-select form-select-lg'
				value={difficulty}
				onChange={(e) => onDifficultyChange(e.target.value)}
				title='Choose difficulty level: Easy for beginners, Medium for general knowledge, Hard for experts'
			>
				<option value='easy'>Easy - Perfect for beginners</option>
				<option value='medium'>Medium - General knowledge level</option>
				<option value='hard'>Hard - Expert level questions</option>
			</select>
			<motion.button
				type='submit'
				className='btn btn-primary btn-lg shadow'
				disabled={loading}
				title='Generate a new trivia question about your chosen topic and difficulty level'
				whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
				whileTap={{ scale: 0.95 }}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.6 }}
			>
				{loading ? 'Generating...' : 'Generate Trivia'}
			</motion.button>
			<motion.button
				type='button'
				className='btn btn-secondary btn-lg mt-2'
				onClick={onAddFavorite}
				title='Save this topic and difficulty combination to your favorites for quick access'
				whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
				whileTap={{ scale: 0.95 }}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.7 }}
			>
				+ Add to Favorites
			</motion.button>
		</form>
	);
}
