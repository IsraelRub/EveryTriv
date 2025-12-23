import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { ShieldX } from 'lucide-react';

import { ButtonSize, ButtonVariant, ROUTES } from '@/constants';

import { Button, Card } from '@/components';

export function UnauthorizedView() {
	const navigate = useNavigate();

	return (
		<motion.main
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className='min-h-screen flex items-center justify-center px-4'
		>
			<Card className='w-full max-w-md p-8 text-center space-y-6'>
				<div className='flex justify-center'>
					<ShieldX className='h-16 w-16 text-destructive' />
				</div>
				<div>
					<h1 className='text-3xl font-bold mb-2'>Access Denied</h1>
					<p className='text-muted-foreground'>You don't have permission to access this page</p>
				</div>
				<div className='flex flex-col gap-2'>
					<Button onClick={() => navigate(ROUTES.HOME)} size={ButtonSize.LG}>
						Go Home
					</Button>
					<Button
						onClick={() => navigate(ROUTES.LOGIN, { state: { modal: true, returnUrl: ROUTES.UNAUTHORIZED } })}
						variant={ButtonVariant.OUTLINE}
						size={ButtonSize.LG}
					>
						Sign In
					</Button>
				</div>
			</Card>
		</motion.main>
	);
}
