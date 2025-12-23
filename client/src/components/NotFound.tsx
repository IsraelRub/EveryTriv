import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { ButtonSize, ROUTES } from '@/constants';

import { Button, Card } from '@/components';

import { clientLogger as logger } from '@/services';

export function NotFound() {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		logger.navigationNotFound(location.pathname, {
			referrer: document.referrer,
			userAgent: navigator.userAgent,
			timestamp: new Date().toISOString(),
			type: '404_error',
		});
	}, [location.pathname]);

	return (
		<motion.main
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className='min-h-screen flex items-center justify-center px-4'
		>
			<Card className='w-full max-w-md p-8 text-center space-y-6'>
				<div>
					<h1 className='text-6xl font-bold mb-2'>404</h1>
					<p className='text-xl text-muted-foreground'>Oops! Page not found</p>
				</div>
				<p className='text-lg text-muted-foreground italic'>
					The path to knowledge is paved with questions,
					<br />
					not answers.
				</p>
				<div className='flex flex-col gap-2'>
					<Button size={ButtonSize.LG} onClick={() => navigate(ROUTES.HOME)}>
						Return to Home
					</Button>
				</div>
			</Card>
		</motion.main>
	);
}
