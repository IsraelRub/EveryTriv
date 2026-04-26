import { cn } from '@/utils';
import { SystemHealthSection } from '@/components';

export function SystemTabContent() {
	return (
		<div className='w-full space-y-8'>
			<div className={cn('dashboard-tab-panel-enter')}>
				<SystemHealthSection />
			</div>
		</div>
	);
}
