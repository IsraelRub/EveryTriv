import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle, FileQuestion, GamepadIcon, Gauge, Tag } from 'lucide-react';

import { EMPTY_VALUE } from '@shared/constants';
import type { AdminTriviaQuestion } from '@shared/types';
import { formatTitle, getCorrectAnswerIndex, namesMatch } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import {
	AdminKey,
	ButtonSize,
	CommonKey,
	DataTableColumnType,
	DEFAULT_ITEMS_PER_PAGE,
	FILTER_ALL_VALUE,
	SortDirection,
	TRIVIA_SORT_FIELDS_SET,
	TriviaSortField,
	VariantBase,
} from '@/constants';
import type { DataTableColumn } from '@/types';
import { getDifficultyDisplayLabel } from '@/utils';
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
import { useAllTriviaQuestions, useClientTableState } from '@/hooks';

export const TriviaManagementTable = memo(function TriviaManagementTable() {
	const { t } = useTranslation();
	const { data: triviaQuestions, isLoading } = useAllTriviaQuestions();
	const questions = useMemo(() => triviaQuestions?.questions ?? [], [triviaQuestions?.questions]);
	const totalCount = triviaQuestions?.totalCount ?? 0;
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
				type: DataTableColumnType.TRUNCATE,
				getValue: row => row.question,
				truncateTitle: row => row.question,
				sortField: TriviaSortField.QUESTION,
				headerIcon: <FileQuestion />,
			},
			{
				id: 'topic',
				type: DataTableColumnType.BADGE,
				getValue: row => row.topic,
				format: v => formatTitle(VALIDATORS.string(v) ? v : undefined),
				headerIcon: <Tag />,
				sortField: TriviaSortField.TOPIC,
			},
			{
				id: 'difficulty',
				type: DataTableColumnType.BADGE_DIFFICULTY,
				getValue: row => row.difficulty,
				headerIcon: <Gauge />,
				sortField: TriviaSortField.DIFFICULTY,
			},
			{
				id: 'correctAnswer',
				type: DataTableColumnType.TEXT,
				getValue: row => row.answers[getCorrectAnswerIndex(row)]?.text ?? EMPTY_VALUE,
				headerIcon: <CheckCircle />,
			},
			{
				id: 'created',
				type: DataTableColumnType.DATE,
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
						<Label className='text-sm font-medium'>{t(CommonKey.SEARCH)}:</Label>
						<Input
							placeholder={t(AdminKey.TRIVIA_SEARCH_PLACEHOLDER)}
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className='w-full min-w-0 max-w-[220px]'
						/>
					</div>
					<div className='flex items-center gap-2'>
						<Label className='text-sm font-medium'>{t(AdminKey.TRIVIA_TOPIC_FILTER)}</Label>
						<Select value={topicFilter} onValueChange={setTopicFilter}>
							<SelectTrigger className='w-full min-w-0 max-w-[160px]'>
								<SelectValue placeholder={t(AdminKey.ALL_TOPICS)} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={FILTER_ALL_VALUE}>{t(AdminKey.ALL_TOPICS)}</SelectItem>
								{topics.map(topic => (
									<SelectItem key={topic} value={topic}>
										{formatTitle(topic)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className='flex items-center gap-2'>
						<Label className='text-sm font-medium'>{t(AdminKey.TRIVIA_DIFFICULTY_FILTER)}</Label>
						<Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
							<SelectTrigger className='w-full min-w-0 max-w-[160px]'>
								<SelectValue placeholder={t(AdminKey.ALL_DIFFICULTIES)} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={FILTER_ALL_VALUE}>{t(AdminKey.ALL_DIFFICULTIES)}</SelectItem>
								{difficulties.map(difficulty => (
									<SelectItem key={difficulty} value={difficulty}>
										{getDifficultyDisplayLabel(difficulty, t)}
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
							{t(CommonKey.CLEAR_FILTERS)}
						</Button>
					)}
				</>
			}
			columns={columns}
			data={tableState.paginatedData}
			getRowKey={row => row.id}
			isLoading={isLoading}
			emptyState={{
				title: t(AdminKey.NO_TRIVIA_FOUND_TITLE),
				description: t(AdminKey.NO_TRIVIA_FOUND_DESCRIPTION),
			}}
			emptyValue={EMPTY_VALUE}
			sortBy={tableState.sortBy}
			sortDirection={tableState.sortDirection}
			onSort={tableState.onSort}
		/>
	);
});
