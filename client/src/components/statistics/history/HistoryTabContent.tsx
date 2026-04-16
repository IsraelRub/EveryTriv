import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, Calendar, CircleUser, ClipboardClock, Gauge, ListOrdered, Tag, Timer, Trash2 } from 'lucide-react';

import { DIFFICULTY_CONFIG, EMPTY_VALUE, GameMode } from '@shared/constants';
import type { GameHistoryEntry } from '@shared/types';
import { formatTitle, getErrorMessage, namesMatch } from '@shared/utils';
import { isGameDifficulty, isGameMode, VALIDATORS } from '@shared/validation';

import {
	AlertIconSize,
	ButtonSize,
	CommonKey,
	ComponentSize,
	DataTableColumnType,
	DEFAULT_ITEMS_PER_PAGE,
	FILTER_ALL_VALUE,
	GameKey,
	LoadingMessages,
	PlayTimeUnit,
	SORT_FIELD_VALUES,
	SortDirection,
	SortField,
	StatisticsHistoryKey,
	VariantBase,
} from '@/constants';
import type { DataTableColumn } from '@/types';
import { gameHistoryService, clientLogger as logger, queryInvalidationService } from '@/services';
import { formatPlayTime, getDifficultyDisplayLabel } from '@/utils';
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
import { useClientTableState, useGameHistory } from '@/hooks';

function getGameModeHistoryLabelKey(gameMode: GameMode): StatisticsHistoryKey {
	return gameMode === GameMode.MULTIPLAYER ? StatisticsHistoryKey.MODE_MULTIPLAYER : StatisticsHistoryKey.MODE_SINGLE;
}

export function HistoryTabContent() {
	const { t } = useTranslation();
	const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
	const [filterTopic, setFilterTopic] = useState<string | null>(null);
	const [showClearDialog, setShowClearDialog] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const { data: historyData, isLoading: historyLoading, error: historyError } = useGameHistory(1000, 0);

	const deleteHistory = useMutation({
		mutationFn: (gameId: string) => gameHistoryService.deleteGameHistory(gameId),
		onSuccess: () => {
			void queryInvalidationService.invalidateGameQueries(queryClient);
		},
	});

	const clearHistory = useMutation({
		mutationFn: () => gameHistoryService.clearGameHistory(),
		onSuccess: () => {
			void queryInvalidationService.invalidateGameQueries(queryClient);
		},
	});

	const records = useMemo(() => (Array.isArray(historyData) ? historyData : []), [historyData]);

	const filterFn = useMemo(
		() => (r: GameHistoryEntry) =>
			(!filterDifficulty || r.difficulty === filterDifficulty) &&
			(!filterTopic || namesMatch(r.topic ?? '', filterTopic)),
		[filterDifficulty, filterTopic]
	);

	const compareHistory = useCallback(
		(a: GameHistoryEntry, b: GameHistoryEntry, sortBy: string) => {
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
									? t(getGameModeHistoryLabelKey(a.gameMode)).localeCompare(t(getGameModeHistoryLabelKey(b.gameMode)))
									: 0;
			return comparison;
		},
		[t]
	);

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
				headerLabel: t(StatisticsHistoryKey.COLUMN_DATE),
				type: DataTableColumnType.DATE,
				getValue: row => row.createdAt,
				sortField: SortField.DATE,
				headerIcon: <Calendar />,
			},
			{
				id: 'topic',
				headerLabel: t(StatisticsHistoryKey.COLUMN_TOPIC),
				type: DataTableColumnType.BADGE,
				getValue: row => row.topic ?? t(GameKey.DEFAULT_TOPIC),
				format: v => formatTitle(v == null ? undefined : String(v)),
				sortField: SortField.TOPIC,
				headerIcon: <Tag />,
			},
			{
				id: 'difficulty',
				headerLabel: t(StatisticsHistoryKey.COLUMN_DIFFICULTY),
				type: DataTableColumnType.BADGE_DIFFICULTY,
				getValue: row => row.difficulty,
				format: v => getDifficultyDisplayLabel(v == null ? v : VALIDATORS.string(v) ? v : String(v), t),
				sortField: SortField.DIFFICULTY,
				headerIcon: <Gauge />,
			},
			{
				id: 'mode',
				headerLabel: t(StatisticsHistoryKey.COLUMN_MODE),
				type: DataTableColumnType.BADGE,
				getValue: row => row.gameMode,
				format: v => (v != null && isGameMode(v) ? t(getGameModeHistoryLabelKey(v)) : ''),
				sortField: SortField.MODE,
				headerIcon: <CircleUser />,
			},
			{
				id: 'score',
				headerLabel: t(StatisticsHistoryKey.COLUMN_SCORE),
				type: DataTableColumnType.BADGE,
				getValue: row => row.score ?? 0,
				format: v => String(v ?? ''),
				sortField: SortField.SCORE,
				headerIcon: <Brain />,
			},
			{
				id: 'questions',
				headerLabel: t(StatisticsHistoryKey.COLUMN_QUESTIONS),
				type: DataTableColumnType.TEXT,
				getValue: row => `${row.correctAnswers ?? 0}/${row.gameQuestionCount ?? 0}`,
				headerIcon: <ListOrdered />,
			},
			{
				id: 'duration',
				headerLabel: t(StatisticsHistoryKey.COLUMN_DURATION),
				type: DataTableColumnType.TEXT,
				getValue: row => row.timeSpent,
				format: (_, row) =>
					(row.timeSpent ?? 0) > 0 ? formatPlayTime(row.timeSpent ?? 0, PlayTimeUnit.SECONDS) : EMPTY_VALUE,
				headerIcon: <Timer />,
			},
			{
				id: 'actions',
				emptyHeader: true,
				type: DataTableColumnType.CUSTOM,
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
		[deleteHistory.isPending, deleteId, t]
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
					<AlertIcon size={AlertIconSize.XXL} className='text-destructive mx-auto mb-4' />
					<h2 className='text-2xl font-bold mb-2'>{t(StatisticsHistoryKey.ERROR_TITLE)}</h2>
					<p className='text-muted-foreground mb-6'>{t(StatisticsHistoryKey.ERROR_DESCRIPTION)}</p>
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
						data={t(StatisticsHistoryKey.EMPTY_DATA)}
						description={t(StatisticsHistoryKey.EMPTY_DESCRIPTION)}
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
							{t(StatisticsHistoryKey.TITLE)}
						</CardTitle>
					),
					description: (
						<CardDescription>
							{t(StatisticsHistoryKey.SHOWING_GAMES, {
								shown: tableState.paginatedData.length,
								total: tableState.sortedData.length,
							})}
							{(filterDifficulty ?? filterTopic) &&
								` ${t(StatisticsHistoryKey.TOTAL_SUFFIX, { count: records.length })}`}
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
							<Trash2 className='h-4 w-4 me-2' />
							{t(StatisticsHistoryKey.CLEAR_ALL)}
						</Button>
					),
				}}
				filters={
					<>
						<div className='flex items-center gap-2'>
							<Label className='text-sm font-medium'>{t(StatisticsHistoryKey.DIFFICULTY_FILTER)}</Label>
							<Select
								value={filterDifficulty ?? FILTER_ALL_VALUE}
								onValueChange={v => setFilterDifficulty(v === FILTER_ALL_VALUE ? null : v)}
							>
								<SelectTrigger className='w-full min-w-0 max-w-[140px]'>
									<SelectValue placeholder={t(CommonKey.ALL)} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={FILTER_ALL_VALUE}>{t(CommonKey.ALL)}</SelectItem>
									{uniqueDifficulties.map(diff => (
										<SelectItem key={diff} value={diff}>
											{getDifficultyDisplayLabel(diff, t)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='flex items-center gap-2'>
							<Label className='text-sm font-medium'>{t(StatisticsHistoryKey.TOPIC_FILTER)}</Label>
							<Select
								value={filterTopic ?? FILTER_ALL_VALUE}
								onValueChange={v => setFilterTopic(v === FILTER_ALL_VALUE ? null : v)}
							>
								<SelectTrigger className='w-full min-w-0 max-w-[160px]'>
									<SelectValue placeholder={t(CommonKey.ALL)} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={FILTER_ALL_VALUE}>{t(CommonKey.ALL)}</SelectItem>
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
								{t(StatisticsHistoryKey.CLEAR_FILTERS)}
							</Button>
						)}
					</>
				}
				columns={historyColumns}
				data={tableState.paginatedData}
				getRowKey={row => row.id}
				emptyState={{
					title: t(StatisticsHistoryKey.NO_GAMES_ON_THIS_PAGE),
					description: t(StatisticsHistoryKey.ADJUST_FILTERS_OR_SORT),
				}}
				emptyValue={EMPTY_VALUE}
				sortBy={tableState.sortBy}
				sortDirection={tableState.sortDirection}
				onSort={tableState.onSort}
			/>

			<AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t(StatisticsHistoryKey.DELETE_GAME_RECORD)}</AlertDialogTitle>
						<AlertDialogDescription>{t(StatisticsHistoryKey.DELETE_GAME_RECORD_DESC)}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t(CommonKey.CANCEL)}</AlertDialogCancel>
						<AlertDialogAction variant={VariantBase.DESTRUCTIVE} onClick={() => deleteId && handleDelete(deleteId)}>
							{t(CommonKey.DELETE)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t(StatisticsHistoryKey.CLEAR_ALL_HISTORY_TITLE)}</AlertDialogTitle>
						<AlertDialogDescription>
							{t(StatisticsHistoryKey.CLEAR_ALL_HISTORY_DESC, { count: records.length })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t(CommonKey.CANCEL)}</AlertDialogCancel>
						<AlertDialogAction
							variant={VariantBase.DESTRUCTIVE}
							onClick={handleClearAll}
							disabled={clearHistory.isPending}
						>
							{!clearHistory.isPending ? (
								t(StatisticsHistoryKey.CLEAR_ALL)
							) : (
								<Spinner size={ComponentSize.SM} message={LoadingMessages.CLEARING} messageInline />
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
