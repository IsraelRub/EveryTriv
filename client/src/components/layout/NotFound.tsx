import { useEffect } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';

import { clientLogger } from '@shared';
import { motion } from 'framer-motion';
import { fadeInUp, hoverScale, scaleIn } from '../animations';
import { Icon } from '../icons';

export const NotFound = () => {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		clientLogger.navigationNotFound(location.pathname, {
			referrer: document.referrer,
			userAgent: navigator.userAgent,
			timestamp: new Date().toISOString(),
			type: '404_error',
		});
	}, [location.pathname]);

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500'>
			<motion.div 
				variants={scaleIn}
				initial="hidden"
				animate="visible"
				className='text-center'
			>
				<div className='bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4'>
					<motion.div 
						variants={fadeInUp}
						initial="hidden"
						animate="visible"
						transition={{ delay: 0.2 }}
					>
						<div className='flex justify-center mb-6'>
							<Icon name='alerttriangle' size='2xl' className='text-yellow-500' />
						</div>
					</motion.div>

					<motion.div 
						variants={fadeInUp}
						initial="hidden"
						animate="visible"
						transition={{ delay: 0.4 }}
					>
						<h1 className='text-4xl font-bold mb-4 text-gray-800'>404</h1>
					</motion.div>

					<motion.div 
						variants={fadeInUp}
						initial="hidden"
						animate="visible"
						transition={{ delay: 0.6 }}
					>
						<h2 className='text-2xl font-semibold mb-4 text-gray-700'>Page Not Found</h2>
						<p className='text-gray-600 mb-8'>
							Oops! The page you're looking for seems to have vanished into the trivia void.
						</p>
					</motion.div>

					<motion.div 
						variants={fadeInUp}
						initial="hidden"
						animate="visible"
						transition={{ delay: 0.8 }}
					>
						<motion.div
							variants={hoverScale}
							initial="normal"
							whileHover="hover"
						>
							<button
								onClick={() => navigate('/')}
								className='flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
							>
								<Icon name='home' size='sm' />
								<span>Return Home</span>
							</button>
						</motion.div>
					</motion.div>
				</div>
			</motion.div>
		</div>
	);
};

