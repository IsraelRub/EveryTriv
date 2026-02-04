import { CategoryAnalysis } from '@/components';
import { usePopularTopics } from '@/hooks';

export function AdminTopicsTab() {
	const { data: topicsData, isLoading: topicsLoading } = usePopularTopics();
	return <CategoryAnalysis topicsData={topicsData?.topics} isLoading={topicsLoading} />;
}
