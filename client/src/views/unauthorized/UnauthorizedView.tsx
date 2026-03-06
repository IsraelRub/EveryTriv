import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX } from 'lucide-react';

import { ButtonSize, ROUTES, VariantBase } from '@/constants';
import { Button, Card, HomeButton } from '@/components';

export function UnauthorizedView() {
	const navigate = useNavigate();

	return (
		<motion.main
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className='view-main flex flex-col items-center justify-center'
		>
			<Card className='w-full max-w-md card-padding text-center view-spacing'>
				<div className='flex justify-center'>
					<ShieldX className='h-12 md:h-16 w-12 md:w-16 text-destructive' />
				</div>
				<div>
					<h1 className='text-2xl md:text-3xl font-bold mb-1 md:mb-2'>Access Denied</h1>
					<p className='text-sm md:text-base text-muted-foreground'>You don't have permission to access this page</p>
				</div>
				<div className='flex flex-col gap-2'>
					<HomeButton />
					<Button
						onClick={() => navigate(ROUTES.LOGIN, { state: { modal: true, returnUrl: ROUTES.UNAUTHORIZED } })}
						variant={VariantBase.OUTLINE}
						size={ButtonSize.LG}
					>
						Sign In
					</Button>
				</div>
			</Card>
		</motion.main>
	);
}
