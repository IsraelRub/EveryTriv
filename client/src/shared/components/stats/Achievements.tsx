import { Achievement, GameStats } from '../../types';
import { motion } from 'framer-motion';
import { achievementIcons } from '../icons';

interface AchievementsProps {
	stats: GameStats;
	achievements: Achievement[];
}

export default function Achievements({ stats, achievements }: AchievementsProps) {
	return (
		<div className='bg-gray-800 text-white mt-4 rounded-lg border border-gray-700'>
			<div className='p-6'>
				<h5 className='text-xl font-semibold mb-4'>Achievements</h5>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
					{achievements.map((achievement) => {
						const progress = achievement.progress(stats);
						const isCompleted = achievement.condition(stats);
						const progressPercent = Math.min((progress / achievement.target) * 100, 100);
						const AchievementIcon = achievementIcons[achievement.icon];

						return (
							<motion.div
								key={achievement.id}
								className='w-full'
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5 }}
							>
								<div className={`rounded-lg border p-4 ${isCompleted ? 'bg-green-600 bg-opacity-25 border-green-500' : 'bg-gray-600 bg-opacity-25 border-gray-500'}`}>
									<div className='flex items-center gap-2 mb-2'>
										<span className='text-2xl'>
											{AchievementIcon && <AchievementIcon size={24} />}
										</span>
										<h6 className='font-semibold mb-0 flex-1'>{achievement.title}</h6>
										{isCompleted && <span className='bg-green-500 text-white text-sm px-2 py-1 rounded'>Completed!</span>}
									</div>
									<p className='text-sm mb-2 text-gray-300'>{achievement.description}</p>
									<div className='w-full bg-gray-700 rounded-full h-2.5 mb-2'>
										<div
											className='bg-blue-500 h-2.5 rounded-full transition-all duration-300'
											style={{ width: `${progressPercent}%` }}
										/>
									</div>
									<small className='text-gray-400'>
										Progress: {progress.toFixed(1)}/{achievement.target}
									</small>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
