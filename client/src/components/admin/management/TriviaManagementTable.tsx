import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle, FileQuestion, GamepadIcon, Gauge, Tag } from 'lucide-react';

import { EMPTY_VALUE } from '@shared/constants';
import { formatDifficulty, formatTitle, getCorrectAnswerIndex, namesMatch } from '@shared/utils';

import {
	ButtonSize,
	DEFAULT_ITEMS_PER_PAGE,
	FILTER_ALL_VALUE,
	SortDirection,
	TRIVIA_SORT_FIELDS_SET,
	TriviaSortField,
	VariantBase,
} from '@/constants';
import {
	Button,
	CardDescription,
	CardTitle,
	DataTableCard,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components';
import { useClientTableState } from '@/hooks';
import { type AdminTriviaQuestion, type DataTableColumn, type TriviaTableProps } from '@/types';

export const TriviaManagementTable = memo(function TriviaManagementTable({
	questions,
	totalCount,
	isLoading,
}: TriviaTableProps) {
	const [searchTerm, setSearchTerm] = useState('');
	const [topicFilter, setTopicFilter] = useState<string>(FILTER_ALL_VALUE);
	const [difficultyFilter, setDifficultyFilter] = useState<string>(FILTER_ALL_VALUE);

	const topics = useMemo(() => Array.from(new Set(questions.map(q => q.topic).filter(Boolean))), [questions]);
	const difficulties = useMemo(
		() => Array.from(new Set(questions.map(q => q.difficulty).filter(Boolean))),
		[questions]
	);

	const filterFn = useMemo(
		() => (q: AdminTriviaQuestion) => {
			const matchesSearch = !searchTerm || q.question.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesTopic = topicFilter === FILTER_ALL_VALUE || namesMatch(q.topic ?? '', topicFilter);
			const matchesDifficulty = difficultyFilter === FILTER_ALL_VALUE || q.difficulty === difficultyFilter;
			return matchesSearch && matchesTopic && matchesDifficulty;
		},
		[searchTerm, topicFilter, difficultyFilter]
	);

	const compareTrivia = useCallback((a: AdminTriviaQuestion, b: AdminTriviaQuestion, sortBy: string) => {
		switch (sortBy) {
			case TriviaSortField.QUESTION:
				return (a.question ?? '').localeCompare(b.question ?? '');
			case TriviaSortField.TOPIC:
				return (a.topic ?? '').localeCompare(b.topic ?? '');
			case TriviaSortField.DIFFICULTY:
				return (a.difficulty ?? '').localeCompare(b.difficulty ?? '');
			case TriviaSortField.CREATED:
				return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
			default:
				return 0;
		}
	}, []);

	const tableState = useClientTableState({
		data: questions,
		filterFn,
		sortFields: TRIVIA_SORT_FIELDS_SET,
		compare: compareTrivia,
		initialSortBy: TriviaSortField.CREATED,
		initialSortDirection: SortDirection.DESC,
		itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
	});

	useEffect(() => {
		tableState.pagination.goToFirstPage();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchTerm, topicFilter, difficultyFilter]);

	const columns = useMemo((): DataTableColumn<AdminTriviaQuestion>[] => {
		return [
			{
				id: 'question',
				type: 'truncate',
				getValue: row => row.question,
				truncateTitle: row => row.question,
				sortField: TriviaSortField.QUESTION,
				headerIcon: <FileQuestion />,
			},
			{
				id: 'topic',
				type: 'badge',
				getValue: row => row.topic,
				format: v => formatTitle(typeof v === 'string' ? v : undefined),
				headerIcon: <Tag />,
				sortField: TriviaSortField.TOPIC,
			},
			{
				id: 'difficulty',
				type: 'badge-difficulty',
				getValue: row => row.difficulty,
				headerIcon: <Gauge />,
				sortField: TriviaSortField.DIFFICULTY,
			},
			{
				id: 'correctAnswer',
				type: 'text',
				getValue: row => row.answers[getCorrectAnswerIndex(row)]?.text ?? EMPTY_VALUE,
				headerIcon: <CheckCircle />,
			},
			{
				id: 'created',
				type: 'date',
				getValue: row => row.createdAt,
				headerIcon: <Calendar />,
				sortField: TriviaSortField.CREATED,
			},
		];
	}, []);

	const hasActiveFilters =
		topicFilter !== FILTER_ALL_VALUE || difficultyFilter !== FILTER_ALL_VALUE || searchTerm.length > 0;

	return (
		<DataTableCard<AdminTriviaQuestion>
			header={{
				title: (
					<CardTitle className='flex items-center gap-2'>
						<GamepadIcon className='h-5 w-5 text-primary' />
						Trivia Questions Management
					</CardTitle>
				),
				description: (
					<CardDescription>
						Showing {tableState.paginatedData.length} of {tableState.sortedData.length} questions
						{tableState.totalFiltered !== totalCount ? ` (${totalCount} total)` : ''}
					</CardDescription>
				),
				pagination:
					tableState.pagination.totalPages > 1
						? {
								onPrevious: tableState.pagination.goToPreviousPage,
								onNext: tableState.pagination.goToNextPage,
								hasPrevious: tableState.pagination.hasPreviousPage,
								hasNext: tableState.pagination.hasNextPage,
								currentPage: tableState.pagination.currentPage,
								totalPages: tableState.pagination.totalPages || 1,
								disabled: isLoading,
							}
						: null,
			}}
			filters={
				<>
					<div className='flex items-center gap-2'>
						<Label className='text-sm font-medium'>Search:</Label>
						<Input
							placeholder='Search questions...'
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className='w-full min-w-0 max-w-[220px]'
						/>
					</div>
					<div className='flex items-center gap-2'>
						<Label className='text-sm font-medium'>Topic:</Label>
						<Select value={topicFilter} onValueChange={setTopicFilter}>
							<SelectTrigger className='w-full min-w-0 max-w-[160px]'>
								<SelectValue placeholder='All Topics' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={FILTER_ALL_VALUE}>All Topics</SelectItem>
								{topics.map(topic => (
									<SelectItem key={topic} value={topic}>
										{formatTitle(topic)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className='flex items-center gap-2'>
						<Label className='text-sm font-medium'>Difficulty:</Label>
						<Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
							<SelectTrigger className='w-full min-w-0 max-w-[160px]'>
								<SelectValue placeholder='All Difficulties' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={FILTER_ALL_VALUE}>All Difficulties</SelectItem>
								{difficulties.map(difficulty => (
									<SelectItem key={difficulty} value={difficulty}>
										{formatDifficulty(difficulty)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{hasActiveFilters && (
						<Button
							variant={VariantBase.MINIMAL}
							size={ButtonSize.SM}
							onClick={() => {
								setSearchTerm('');
								setTopicFilter(FILTER_ALL_VALUE);
								setDifficultyFilter(FILTER_ALL_VALUE);
							}}
						>
							Clear Filters
						</Button>
					)}
				</>
			}
			columns={columns}
			data={tableState.paginatedData}
			getRowKey={row => row.id}
			isLoading={isLoading}
			emptyState={{
				title: 'No trivia questions found',
				description: 'Try adjusting filters or add new questions.',
			}}
			emptyValue={EMPTY_VALUE}
			sortBy={tableState.sortBy}
			sortDirection={tableState.sortDirection}
			onSort={tableState.onSort}
		/>
	);
});
