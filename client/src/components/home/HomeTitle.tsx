import { motion } from 'framer-motion';

import { APP_DESCRIPTION, APP_NAME } from '@shared/constants';

export default function HomeTitle() {
	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6 }}
			className='text-center space-y-4'
		>
			<h1 className='text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight py-3 -mt-20'>
				{APP_NAME}
			</h1>
			<p className='text-xl text-muted-foreground max-w-2xl mx-auto'>{APP_DESCRIPTION}</p>
		</motion.div>
	);
}
