import { GamepadIcon } from 'lucide-react';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	TriviaManagementTable,
} from '@/components';
import { useAllTriviaQuestions } from '@/hooks';

export function AdminGamesTab() {
	const { data: triviaQuestions, isLoading: triviaQuestionsLoading } = useAllTriviaQuestions();
	return (
		<Card className='border-muted bg-muted/20'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<GamepadIcon className='h-5 w-5' />
					Trivia Questions Management
				</CardTitle>
				<CardDescription>View and manage all trivia questions in the system</CardDescription>
			</CardHeader>
			<CardContent>
				<TriviaManagementTable
					questions={triviaQuestions?.questions}
					totalCount={triviaQuestions?.totalCount}
					isLoading={triviaQuestionsLoading}
				/>
			</CardContent>
		</Card>
	);
}
