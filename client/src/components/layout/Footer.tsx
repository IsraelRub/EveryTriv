import { motion } from 'framer-motion';

export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='border-t border-border bg-card'>
			<div className='container mx-auto px-4 py-6'>
				<div className='flex flex-col md:flex-row justify-between items-center gap-4'>
					<div className='text-sm text-muted-foreground'>© {currentYear} EveryTriv. All rights reserved.</div>
					<div className='flex gap-6'>
						<a href='#' className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
							About
						</a>
						<a href='#' className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
							Privacy
						</a>
						<a href='#' className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
							Terms
						</a>
						<a href='#' className='text-sm text-muted-foreground hover:text-foreground transition-colors'>
							Contact
						</a>
					</div>
				</div>
			</div>
		</motion.footer>
	);
}
