import { useEffect } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';

import { logger } from '../../services/utils';
import { FadeInUp, HoverScale, ScaleIn } from '../animations';
import { Icon } from '../icons';

export const NotFound = () => {
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		logger.navigationNotFound(location.pathname, {
			referrer: document.referrer,
			userAgent: navigator.userAgent,
			timestamp: new Date().toISOString(),
			type: '404_error',
		});
	}, [location.pathname]);

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500'>
			<ScaleIn className='text-center'>
				<div className='bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4'>
					<FadeInUp delay={0.2}>
						<div className='flex justify-center mb-6'>
							<Icon name='alerttriangle' size='2xl' className='text-yellow-500' />
						</div>
					</FadeInUp>

					<FadeInUp delay={0.4}>
						<h1 className='text-4xl font-bold mb-4 text-gray-800'>404</h1>
					</FadeInUp>

					<FadeInUp delay={0.6}>
						<h2 className='text-2xl font-semibold mb-4 text-gray-700'>Page Not Found</h2>
						<p className='text-gray-600 mb-8'>
							Oops! The page you're looking for seems to have vanished into the trivia void.
						</p>
					</FadeInUp>

					<FadeInUp delay={0.8}>
						<HoverScale>
							<button
								onClick={() => navigate('/')}
								className='flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
							>
								<Icon name='home' size='sm' />
								<span>Return Home</span>
							</button>
						</HoverScale>
					</FadeInUp>
				</div>
			</ScaleIn>
		</div>
	);
};
