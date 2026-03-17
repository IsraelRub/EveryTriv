import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';

import { TimePeriod } from '@shared/constants';

import { AdminKey, CHART_HEIGHTS } from '@/constants';
import { SectionCard, TrendChart } from '@/components';
import { useGlobalTrends } from '@/hooks';

export function PlatformTrendsSection(props: { statsLoading: boolean }) {
	const { t } = useTranslation('admin');
	const { data: globalTrends, isLoading: trendsLoading } = useGlobalTrends({ groupBy: TimePeriod.DAILY, limit: 30 });
	const isLoading = props.statsLoading || trendsLoading;

	return (
		<div className='space-y-8'>
			<SectionCard title={t(AdminKey.PLATFORM_TRENDS)} icon={TrendingUp} description={t(AdminKey.PLATFORM_TRENDS_DESC)}>
				<TrendChart data={globalTrends} isLoading={isLoading} height={CHART_HEIGHTS.LARGE} className='col-span-full' />
			</SectionCard>
		</div>
	);
}
