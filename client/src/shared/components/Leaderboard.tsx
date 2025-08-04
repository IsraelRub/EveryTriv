import { useEffect, useState } from 'react';
import axios from 'axios';
import { LeaderboardEntry } from '../types';

export default function Leaderboard({ userId }: LeaderboardProps) {
	const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

	useEffect(() => {
		axios.get('/trivia/leaderboard').then((res) => setEntries(res.data));
	}, []);

	return (
		<div className='mt-5 bg-white bg-opacity-10 rounded p-4 shadow glass-morphism'>
			<h2 className='h4 text-white mb-4'>Leaderboard</h2>
			<ol className='list-group list-group-numbered'>
				{entries.map((entry, i) => (
					<li
						key={i}
						className={`list-group-item d-flex justify-content-between align-items-center ${
							entry.userId === userId ? 'active' : ''
						}`}
					>
						<span className='ms-2 me-auto'>{entry.userId === userId ? 'You' : entry.userId}</span>
						<span className='badge bg-primary rounded-pill'>{entry.score} pts</span>
					</li>
				))}
			</ol>
		</div>
	);
}
