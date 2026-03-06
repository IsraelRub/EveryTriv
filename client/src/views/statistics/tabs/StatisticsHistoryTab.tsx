import { useCallback, useEffect, useMemo, useState } from 'react';
import { Brain, Calendar, CircleUser, ClipboardClock, Clock, Gauge, ListOrdered, Tag, Trash2 } from 'lucide-react';

import { DEFAULT_GAME_CONFIG, DIFFICULTY_CONFIG, EMPTY_VALUE, GameMode } from '@shared/constants';
import type { GameHistoryEntry } from '@shared/types';
import { formatDifficulty, formatTitle, getErrorMessage, namesMatch } from '@shared/utils';
import { isGameDifficulty } from '@shared/validation';

import {
	ButtonSize,
	ComponentSize,
	DEFAULT_ITEMS_PER_PAGE,
	FILTER_ALL_VALUE,
	LoadingMessages,
	SORT_FIELD_VALUES,
	SortDirection,
	SortField,
	VariantBase,
} from '@/constants';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertIcon,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardTitle,
	DataTableCard,
	EmptyState,
	HistorySkeleton,
	HomeButton,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
} from '@/components';
import { useClearGameHistory, useClientTableState, useDeleteGameHistory, useGameHistory } from '@/hooks';
import { clientLogger as logger } from '@/services';
import type { DataTableColumn } from '@/types';
import { formatPlayTime } from '@/utils';

export function StatisticsHistoryTab() {
	const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
	const [filterTopic, setFilterTopic] = useState<string | null>(null);
	const [showClearDialog, setShowClearDialog] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const { data: historyData, isLoading: historyLoading, error: historyError } = useGameHistory(1000, 0);
	const deleteHistory = useDeleteGameHistory();
	const clearHistory = useClearGameHistory();

	const records = useMemo(() => (Array.isArray(historyData) ? historyData : []), [historyData]);

	const filterFn = useMemo(
		() => (r: GameHistoryEntry) =>
			(!filterDifficulty || r.difficulty === filterDifficulty) &&
			(!filterTopic || namesMatch(r.topic ?? '', filterTopic)),
		[filterDifficulty, filterTopic]
	);

	const compareHistory = useCallback((a: GameHistoryEntry, b: GameHistoryEntry, sortBy: string) => {
		const comparison =
			sortBy === SortField.DATE
				? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				: sortBy === SortField.SCORE
					? (a.score ?? 0) - (b.score ?? 0)
					: sortBy === SortField.TOPIC
						? (a.topic ?? '').localeCompare(b.topic ?? '')
						: sortBy === SortField.DIFFICULTY
							? (DIFFICULTY_CONFIG[a.difficulty ?? '']?.order ?? 0) -
								(DIFFICULTY_CONFIG[b.difficulty ?? '']?.order ?? 0)
							: sortBy === SortField.MODE
								? (a.gameMode === GameMode.MULTIPLAYER ? 'Multiplayer' : 'Single').localeCompare(
										b.gameMode === GameMode.MULTIPLAYER ? 'Multiplayer' : 'Single'
									)
								: 0;
		return comparison;
	}, []);

	const tableState = useClientTableState({
		data: records,
		filterFn,
		sortFields: SORT_FIELD_VALUES,
		compare: compareHistory,
		initialSortBy: SortField.DATE,
		initialSortDirection: SortDirection.DESC,
		itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
	});

	useEffect(() => {
		tableState.pagination.goToFirstPage();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterDifficulty, filterTopic]);

	const uniqueDifficulties = useMemo(() => {
		const difficulties = new Set(records.map(r => r.difficulty).filter(Boolean));
		return Array.from(difficulties).filter(isGameDifficulty);
	}, [records]);

	const uniqueTopics = useMemo(() => {
		const topics = new Set(records.map(r => r.topic).filter(Boolean));
		return Array.from(topics).sort();
	}, [records]);

	const historyColumns = useMemo<DataTableColumn<GameHistoryEntry>[]>(
		() => [
			{
				id: 'date',
				type: 'date',
				getValue: row => row.createdAt,
				sortField: SortField.DATE,
				headerIcon: <Calendar />,
			},
			{
				id: 'topic',
				type: 'badge',
				getValue: row => row.topic ?? DEFAULT_GAME_CONFIG.defaultTopic,
				format: v => formatTitle(v == null ? undefined : String(v)),
				sortField: SortField.TOPIC,
				headerIcon: <Tag />,
			},
			{
				id: 'difficulty',
				type: 'badge-difficulty',
				getValue: row => row.difficulty,
				sortField: SortField.DIFFICULTY,
				headerIcon: <Gauge />,
			},
			{
				id: 'mode',
				type: 'badge',
				getValue: row => (row.gameMode === GameMode.MULTIPLAYER ? 'Multiplayer' : 'Single'),
				format: v => String(v ?? ''),
				sortField: SortField.MODE,
				headerIcon: <CircleUser />,
			},
			{
				id: 'score',
				type: 'badge',
				getValue: row => row.score ?? 0,
				format: v => String(v ?? ''),
				sortField: SortField.SCORE,
				headerIcon: <Brain />,
			},
			{
				id: 'questions',
				type: 'text',
				getValue: row => `${row.correctAnswers ?? 0}/${row.gameQuestionCount ?? 0}`,
				headerIcon: <ListOrdered />,
			},
			{
				id: 'duration',
				type: 'text',
				getValue: row => row.timeSpent,
				format: (_, row) => ((row.timeSpent ?? 0) > 0 ? formatPlayTime(row.timeSpent ?? 0, 'seconds') : EMPTY_VALUE),
				headerIcon: <Clock />,
			},
			{
				id: 'actions',
				emptyHeader: true,
				type: 'custom',
				headerClassName: 'w-10',
				render: row => (
					<Button
						variant={VariantBase.MINIMAL}
						size={ButtonSize.ICON_LG}
						className='h-8 w-8 text-muted-foreground hover:text-destructive'
						onClick={() => setDeleteId(row.id)}
						disabled={deleteHistory.isPending}
					>
						{deleteHistory.isPending && deleteId === row.id ? (
							<Spinner size={ComponentSize.SM} />
						) : (
							<Trash2 className='h-4 w-4' />
						)}
					</Button>
				),
			},
		],
		[deleteHistory.isPending, deleteId]
	);

	const handleDelete = async (gameId: string) => {
		try {
			await deleteHistory.mutateAsync(gameId);
			logger.userSuccess('The game record has been removed from your history.', { gameId });
		} catch (error) {
			logger.userError('Failed to delete game record.', {
				errorInfo: { message: getErrorMessage(error) },
				gameId,
			});
		} finally {
			setDeleteId(null);
		}
	};

	const handleClearAll = async () => {
		try {
			const result = await clearHistory.mutateAsync();
			logger.userSuccess(`${result.deletedCount} game records have been removed.`, {
				deletedCount: result.deletedCount,
			});
		} catch (error) {
			logger.userError('Failed to clear game history.', {
				errorInfo: { message: getErrorMessage(error) },
			});
		} finally {
			setShowClearDialog(false);
		}
	};

	if (historyLoading) {
		return <HistorySkeleton />;
	}

	if (historyError) {
		return (
			<Card>
				<CardContent className='card-content-center'>
					<AlertIcon size='2xl' className='text-destructive mx-auto mb-4' />
					<h2 className='text-2xl font-bold mb-2'>Failed to Load History</h2>
					<p className='text-muted-foreground mb-6'>Unable to fetch your game history. Please try again later.</p>
					<HomeButton />
				</CardContent>
			</Card>
		);
	}

	if (records.length === 0) {
		return (
			<Card>
				<CardContent className='p-6'>
					<EmptyState
						data='game history'
						icon={Clock}
						description='Start playing trivia games to build your history and track your progress!'
					/>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-8'>
			<DataTableCard<GameHistoryEntry>
				header={{
					title: (
						<CardTitle className='flex items-center gap-2'>
							<ClipboardClock className='h-5 w-5 text-primary' />
							Game History
						</CardTitle>
					),
					description: (
						<CardDescription>
							Showing {tableState.paginatedData.length} of {tableState.sortedData.length} games
							{(filterDifficulty ?? filterTopic) && ` (${records.length} total)`}
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
									totalPages: tableState.pagination.totalPages,
								}
							: null,
					actions: (
						<Button variant={VariantBase.DESTRUCTIVE} size={ButtonSize.SM} onClick={() => setShowClearDialog(true)}>
							<Trash2 className='h-4 w-4 mr-2' />
							Clear All
						</Button>
					),
				}}
				filters={
					<>
						<div className='flex items-center gap-2'>
							<Label className='text-sm font-medium'>Difficulty:</Label>
							<Select
								value={filterDifficulty ?? FILTER_ALL_VALUE}
								onValueChange={v => setFilterDifficulty(v === FILTER_ALL_VALUE ? null : v)}
							>
								<SelectTrigger className='w-full min-w-0 max-w-[140px]'>
									<SelectValue placeholder='All' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
									{uniqueDifficulties.map(diff => (
										<SelectItem key={diff} value={diff}>
											{formatDifficulty(diff)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='flex items-center gap-2'>
							<Label className='text-sm font-medium'>Topic:</Label>
							<Select
								value={filterTopic ?? FILTER_ALL_VALUE}
								onValueChange={v => setFilterTopic(v === FILTER_ALL_VALUE ? null : v)}
							>
								<SelectTrigger className='w-full min-w-0 max-w-[160px]'>
									<SelectValue placeholder='All' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
									{uniqueTopics.map(topic => (
										<SelectItem key={topic} value={topic}>
											{formatTitle(topic)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{(filterDifficulty ?? filterTopic) && (
							<Button
								variant={VariantBase.MINIMAL}
								size={ButtonSize.SM}
								onClick={() => {
									setFilterDifficulty(null);
									setFilterTopic(null);
								}}
							>
								Clear Filters
							</Button>
						)}
					</>
				}
				columns={historyColumns}
				data={tableState.paginatedData}
				getRowKey={row => row.id}
				emptyState={{
					title: 'No games on this page',
					description: 'Adjust filters or sort to see more.',
				}}
				emptyValue={EMPTY_VALUE}
				sortBy={tableState.sortBy}
				sortDirection={tableState.sortDirection}
				onSort={tableState.onSort}
			/>

			{/* Delete Single Game Dialog */}
			<AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Game Record</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this game record? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction variant={VariantBase.DESTRUCTIVE} onClick={() => deleteId && handleDelete(deleteId)}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Clear All Dialog */}
			<AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Clear All History</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete all {records.length} game records. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant={VariantBase.DESTRUCTIVE}
							onClick={handleClearAll}
							disabled={clearHistory.isPending}
						>
							{clearHistory.isPending ? (
								<Spinner size={ComponentSize.SM} message={LoadingMessages.CLEARING} messageInline />
							) : (
								'Clear All'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
