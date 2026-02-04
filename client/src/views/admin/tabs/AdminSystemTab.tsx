import { ConsistencyManagementSection, SystemHealthSection } from '@/components';

export function AdminSystemTab() {
	return (
		<>
			<SystemHealthSection />
			<ConsistencyManagementSection />
		</>
	);
}
