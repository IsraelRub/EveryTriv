import { TriviaManagementTable } from '@/components';
import { useAllTriviaQuestions } from '@/hooks';

export function AdminTriviaTab() {
	const { data: triviaQuestions, isLoading: triviaQuestionsLoading } = useAllTriviaQuestions();
	return (
		<TriviaManagementTable
			questions={triviaQuestions?.questions ?? []}
			totalCount={triviaQuestions?.totalCount ?? 0}
			isLoading={triviaQuestionsLoading}
		/>
	);
}
