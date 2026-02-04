import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { getCorrectAnswerIndex } from '@shared/utils';

import { DEFAULT_ITEMS_PER_PAGE, FILTER_ALL_VALUE, VariantBase } from '@/constants';
import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	PaginationButtons,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	TableRowsSkeleton,
} from '@/components';
import { usePagination } from '@/hooks';
import type { TriviaTableProps } from '@/types';
import { formatDate } from '@/utils';

export function TriviaManagementTable({ questions = [], totalCount = 0, isLoading = false }: TriviaTableProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [topicFilter, setTopicFilter] = useState<string>(FILTER_ALL_VALUE);
	const [difficultyFilter, setDifficultyFilter] = useState<string>(FILTER_ALL_VALUE);

	// Get unique topics and difficulties
	const topics = Array.from(new Set(questions.map(q => q.topic).filter(Boolean)));
	const difficulties = Array.from(new Set(questions.map(q => q.difficulty).filter(Boolean)));

	// Filter questions
	const filteredQuestions = questions.filter(q => {
		const matchesSearch = !searchTerm || q.question.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesTopic = topicFilter === FILTER_ALL_VALUE || q.topic === topicFilter;
		const matchesDifficulty = difficultyFilter === FILTER_ALL_VALUE || q.difficulty === difficultyFilter;
		return matchesSearch && matchesTopic && matchesDifficulty;
	});

	// Use pagination hook
	const pagination = usePagination({
		itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
		totalItems: filteredQuestions.length,
		initialPage: 1,
	});

	// Reset to page 1 when filters change
	useEffect(() => {
		pagination.goToFirstPage();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchTerm, topicFilter, difficultyFilter]);

	// Get paginated questions
	const paginatedQuestions = filteredQuestions.slice(pagination.startIndex, pagination.endIndex);

	return (
		<Card>
			<CardHeader>
				<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<Search className='h-5 w-5' />
							Trivia Questions Management
						</CardTitle>
						<CardDescription>
							Total questions: {totalCount} | Filtered: {filteredQuestions.length}
						</CardDescription>
					</div>
					{pagination.totalPages > 1 && (
						<PaginationButtons
							onPrevious={pagination.goToPreviousPage}
							onNext={pagination.goToNextPage}
							hasPrevious={pagination.hasPreviousPage}
							hasNext={pagination.hasNextPage}
							currentPage={pagination.currentPage}
							totalPages={pagination.totalPages || 1}
							disabled={isLoading}
						/>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{/* Filters */}
				<div className='flex flex-col sm:flex-row gap-4 mb-6 items-center'>
					<Input
						placeholder='Search questions...'
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						className='max-w-xs'
					/>
					<Select value={topicFilter} onValueChange={setTopicFilter}>
						<SelectTrigger className='w-[160px]'>
							<SelectValue placeholder='All Topics' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={FILTER_ALL_VALUE}>All Topics</SelectItem>
							{topics.map(topic => (
								<SelectItem key={topic} value={topic}>
									{topic}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
						<SelectTrigger className='w-[160px]'>
							<SelectValue placeholder='All Difficulties' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={FILTER_ALL_VALUE}>All Difficulties</SelectItem>
							{difficulties.map(difficulty => (
								<SelectItem key={difficulty} value={difficulty}>
									{difficulty}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Table */}
				{isLoading ? (
					<TableRowsSkeleton rowCount={5} />
				) : filteredQuestions.length === 0 ? (
					<div className='text-center py-8 text-muted-foreground'>
						<Search className='h-12 w-12 mx-auto mb-4 opacity-50' />
						<p>No trivia questions found</p>
					</div>
				) : (
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Question</TableHead>
									<TableHead>Topic</TableHead>
									<TableHead>Difficulty</TableHead>
									<TableHead>Correct Answer</TableHead>
									<TableHead>Created</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedQuestions.map(question => (
									<TableRow key={question.id}>
										<TableCell className='max-w-md'>
											<div className='truncate' title={question.question}>
												{question.question}
											</div>
										</TableCell>
										<TableCell>
											<Badge variant={VariantBase.OUTLINE}>{question.topic}</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={VariantBase.SECONDARY}>{question.difficulty}</Badge>
										</TableCell>
										<TableCell>{question.answers[getCorrectAnswerIndex(question)]?.text ?? 'N/A'}</TableCell>
										<TableCell className='text-sm text-muted-foreground'>{formatDate(question.createdAt)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
