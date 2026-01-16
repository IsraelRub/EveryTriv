import { useEffect, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';

import { getCorrectAnswerIndex } from '@shared/utils';

import { ButtonVariant, DEFAULT_ITEMS_PER_PAGE, VariantBase } from '@/constants';
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TablePagination,
	TableRow,
} from '@/components';
import { usePagination } from '@/hooks';
import type { TriviaTableProps } from '@/types';
import { ConfirmClearDialog } from './ConfirmClearDialog';

export function TriviaManagementTable({
	questions = [],
	totalCount = 0,
	isLoading = false,
	onClearAll,
}: TriviaTableProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [topicFilter, setTopicFilter] = useState<string>('');
	const [difficultyFilter, setDifficultyFilter] = useState<string>('');
	const [clearDialogOpen, setClearDialogOpen] = useState(false);

	// Get unique topics and difficulties
	const topics = Array.from(new Set(questions.map(q => q.topic).filter(Boolean)));
	const difficulties = Array.from(new Set(questions.map(q => q.difficulty).filter(Boolean)));

	// Filter questions
	const filteredQuestions = questions.filter(q => {
		const matchesSearch = !searchTerm || q.question.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesTopic = !topicFilter || q.topic === topicFilter;
		const matchesDifficulty = !difficultyFilter || q.difficulty === difficultyFilter;
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
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<Search className='h-5 w-5' />
							Trivia Questions Management
						</CardTitle>
						<CardDescription>
							Total questions: {totalCount} | Filtered: {filteredQuestions.length} | Page {pagination.currentPage} of{' '}
							{pagination.totalPages || 1}
						</CardDescription>
					</div>
					{onClearAll && (
						<Button
							variant={ButtonVariant.DESTRUCTIVE}
							onClick={() => setClearDialogOpen(true)}
							disabled={isLoading || totalCount === 0}
						>
							<Trash2 className='h-4 w-4 mr-2' />
							Clear All
						</Button>
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
					<select
						value={topicFilter}
						onChange={e => setTopicFilter(e.target.value)}
						className='px-3 py-2 border rounded-md bg-background'
					>
						<option value=''>All Topics</option>
						{topics.map(topic => (
							<option key={topic} value={topic}>
								{topic}
							</option>
						))}
					</select>
					<select
						value={difficultyFilter}
						onChange={e => setDifficultyFilter(e.target.value)}
						className='px-3 py-2 border rounded-md bg-background'
					>
						<option value=''>All Difficulties</option>
						{difficulties.map(difficulty => (
							<option key={difficulty} value={difficulty}>
								{difficulty}
							</option>
						))}
					</select>
					{pagination.totalPages > 1 && (
						<div className='ml-auto'>
							<TablePagination
								totalPages={pagination.totalPages}
								totalItems={filteredQuestions.length}
								startIndex={pagination.startIndex}
								endIndex={pagination.endIndex}
								hasNextPage={pagination.hasNextPage}
								hasPreviousPage={pagination.hasPreviousPage}
								onNextPage={pagination.goToNextPage}
								onPreviousPage={pagination.goToPreviousPage}
								isLoading={isLoading}
								itemsLabel='questions'
							/>
						</div>
					)}
				</div>

				{/* Table */}
				{isLoading ? (
					<div className='space-y-4'>
						{[...Array(5)].map((_, i) => (
							<Skeleton key={i} className='h-16 w-full' />
						))}
					</div>
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
										<TableCell className='text-sm text-muted-foreground'>
											{new Date(question.createdAt).toLocaleDateString()}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
			{onClearAll && (
				<ConfirmClearDialog
					open={clearDialogOpen}
					onOpenChange={setClearDialogOpen}
					title='Clear All Trivia Questions'
					description='This will permanently delete all trivia questions from the database. This action cannot be undone.'
					itemName='Trivia Questions'
					onConfirm={() => {
						onClearAll();
						setClearDialogOpen(false);
					}}
					isLoading={isLoading}
				/>
			)}
		</Card>
	);
}
