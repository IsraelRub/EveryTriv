import { Achievement, GameState } from '../types';
import { motion } from 'framer-motion';

interface AchievementsProps {
	stats: GameStats;
	achievements: Achievement[];
}

export default function Achievements({ stats, achievements }: AchievementsProps) {
	return (
		<div className='card bg-dark text-white mt-4'>
			<div className='card-body'>
				<h5 className='card-title mb-4'>Achievements</h5>
				<div className='row g-3'>
					{achievements.map((achievement) => {
						const progress = achievement.progress(stats);
						const isCompleted = achievement.condition(stats);
						const progressPercent = Math.min((progress / achievement.target) * 100, 100);

						return (
							<motion.div
								key={achievement.id}
								className='col-12 col-md-6'
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5 }}
							>
								<div className={`card ${isCompleted ? 'bg-success' : 'bg-secondary'} bg-opacity-25`}>
									<div className='card-body'>
										<div className='d-flex align-items-center gap-2 mb-2'>
											<span className='fs-4'>{achievement.icon}</span>
											<h6 className='card-title mb-0'>{achievement.title}</h6>
											{isCompleted && <span className='badge bg-success ms-auto'>Completed!</span>}
										</div>
										<p className='card-text small mb-2'>{achievement.description}</p>
										<div className='progress' style={{ height: '10px' }}>
											<div
												className='progress-bar bg-info'
												role='progressbar'
												style={{ width: `${progressPercent}%` }}
												aria-valuenow={progressPercent}
												aria-valuemin={0}
												aria-valuemax={100}
											/>
										</div>
										<small className='text-white-50'>
											Progress: {progress.toFixed(1)}/{achievement.target}
										</small>
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
