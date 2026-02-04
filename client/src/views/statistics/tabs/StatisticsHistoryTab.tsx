import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Calendar, Clock, Medal, Trash2 } from 'lucide-react';

import { DifficultyLevel, TIME_DURATIONS_SECONDS } from '@shared/constants';
import { isGameDifficulty } from '@shared/validation';

import {
	ButtonSize,
	ButtonVariant,
	DEFAULT_ITEMS_PER_PAGE,
	FILTER_ALL_VALUE,
	SORT_FIELD_VALUES,
	SortDirection,
	SortField,
	SpinnerSize,
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
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	EmptyState,
	HistorySkeleton,
	HomeButton,
	PaginationButtons,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components';
import { useClearGameHistory, useDeleteGameHistory, useGameHistory, useNavigationClose } from '@/hooks';
import { clientLogger as logger } from '@/services';
import { cn, formatDate } from '@/utils';

function getDifficultyBadgeColor(difficulty?: string): string {
	switch (difficulty?.toLowerCase()) {
		case 'easy':
			return cn('bg-green-500/10', 'text-green-500', 'border-green-500/30');
		case 'medium':
			return cn('bg-yellow-500/10', 'text-yellow-500', 'border-yellow-500/30');
		case 'hard':
			return cn('bg-red-500/10', 'text-red-500', 'border-red-500/30');
		default:
			return cn('bg-muted', 'text-muted-foreground');
	}
}

function isSortField(v: string): v is SortField {
	return SORT_FIELD_VALUES.has(v);
}

export function StatisticsHistoryTab() {
	const { handleClose } = useNavigationClose();
	const [page, setPage] = useState(0);
	const [sortBy, setSortBy] = useState<SortField>(SortField.DATE);
	const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.DESC);
	const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
	const [filterTopic, setFilterTopic] = useState<string | null>(null);
	const [showClearDialog, setShowClearDialog] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const { data: historyData, isLoading: historyLoading, error: historyError } = useGameHistory(1000, 0);
	const deleteHistory = useDeleteGameHistory();
	const clearHistory = useClearGameHistory();

	const records = Array.isArray(historyData) ? historyData : [];

	// Filter records
	const filteredRecords = useMemo(() => {
		let filtered = [...records];

		if (filterDifficulty) {
			filtered = filtered.filter(r => r.difficulty === filterDifficulty);
		}

		if (filterTopic) {
			filtered = filtered.filter(r => r.topic === filterTopic);
		}

		return filtered;
	}, [records, filterDifficulty, filterTopic]);

	// Sort records
	const sortedRecords = useMemo(() => {
		const sorted = [...filteredRecords].sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case SortField.DATE:
					comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					break;
				case SortField.SCORE:
					comparison = (a.score ?? 0) - (b.score ?? 0);
					break;
				case SortField.TOPIC:
					comparison = (a.topic ?? '').localeCompare(b.topic ?? '');
					break;
				case SortField.DIFFICULTY:
					const difficultyOrder: Record<string, number> = {
						[DifficultyLevel.EASY]: 1,
						[DifficultyLevel.MEDIUM]: 2,
						[DifficultyLevel.HARD]: 3,
					};
					comparison = (difficultyOrder[a.difficulty ?? ''] ?? 0) - (difficultyOrder[b.difficulty ?? ''] ?? 0);
					break;
			}

			return sortDirection === SortDirection.ASC ? comparison : -comparison;
		});

		return sorted;
	}, [filteredRecords, sortBy, sortDirection]);

	// Paginate records
	const paginatedRecords = useMemo(() => {
		const start = page * DEFAULT_ITEMS_PER_PAGE;
		return sortedRecords.slice(start, start + DEFAULT_ITEMS_PER_PAGE);
	}, [sortedRecords, page]);

	const totalPages = Math.ceil(sortedRecords.length / DEFAULT_ITEMS_PER_PAGE);

	// Get unique values for filters
	const uniqueDifficulties = useMemo(() => {
		const difficulties = new Set(records.map(r => r.difficulty).filter(Boolean));
		return Array.from(difficulties).filter(isGameDifficulty);
	}, [records]);

	const uniqueTopics = useMemo(() => {
		const topics = new Set(records.map(r => r.topic).filter(Boolean));
		return Array.from(topics).sort();
	}, [records]);

	const handleSort = (value: string) => {
		if (!isSortField(value)) return;
		const field = value;
		if (sortBy === field) {
			setSortDirection(sortDirection === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC);
		} else {
			setSortBy(field);
			setSortDirection(SortDirection.DESC);
		}
		setPage(0); // Reset to first page on sort
	};

	const handleDelete = async (gameId: string) => {
		try {
			await deleteHistory.mutateAsync(gameId);
			logger.userSuccess('The game record has been removed from your history.', { gameId });
		} catch (error) {
			logger.userError('Failed to delete game record.', {
				errorInfo: { message: error instanceof Error ? error.message : 'Unknown error' },
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
				errorInfo: { message: error instanceof Error ? error.message : 'Unknown error' },
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
				<CardContent className='p-6 text-center'>
					<AlertTriangle className='h-16 w-16 text-destructive mx-auto mb-4' />
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
						icon={Medal}
						title='No Games Yet'
						description='Start playing trivia games to build your history and track your progress!'
						action={
							<Button size={ButtonSize.LG} onClick={handleClose}>
								Play Now
							</Button>
						}
					/>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-8'>
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
						<div>
							<CardTitle className='flex items-center gap-2'>
								<Clock className='h-5 w-5' />
								Game History
							</CardTitle>
							<CardDescription>
								Showing {paginatedRecords.length} of {sortedRecords.length} games
								{(filterDifficulty || filterTopic) && ` (${records.length} total)`}
							</CardDescription>
						</div>
						<div className='flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start'>
							{totalPages > 1 && (
								<PaginationButtons
									onPrevious={() => setPage(Math.max(0, page - 1))}
									onNext={() => setPage(Math.min(totalPages - 1, page + 1))}
									hasPrevious={page > 0}
									hasNext={page < totalPages - 1}
									currentPage={page + 1}
									totalPages={totalPages}
								/>
							)}
							<Button variant={ButtonVariant.DESTRUCTIVE} size={ButtonSize.SM} onClick={() => setShowClearDialog(true)}>
								<Trash2 className='h-4 w-4 mr-2' />
								Clear All
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className='space-y-6'>
					{/* Filters & Sort */}
					<div className='flex flex-wrap items-center gap-4'>
						<div className='flex items-center gap-2'>
							<label className='text-sm font-medium'>Difficulty:</label>
							<Select
								value={filterDifficulty ?? FILTER_ALL_VALUE}
								onValueChange={v => {
									setFilterDifficulty(v === FILTER_ALL_VALUE ? null : v);
									setPage(0);
								}}
							>
								<SelectTrigger className='w-[140px]'>
									<SelectValue placeholder='All' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
									{uniqueDifficulties.map(diff => (
										<SelectItem key={diff} value={diff}>
											{diff}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='flex items-center gap-2'>
							<label className='text-sm font-medium'>Topic:</label>
							<Select
								value={filterTopic ?? FILTER_ALL_VALUE}
								onValueChange={v => {
									setFilterTopic(v === FILTER_ALL_VALUE ? null : v);
									setPage(0);
								}}
							>
								<SelectTrigger className='w-[160px]'>
									<SelectValue placeholder='All' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={FILTER_ALL_VALUE}>All</SelectItem>
									{uniqueTopics.map(topic => (
										<SelectItem key={topic} value={topic}>
											{topic}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='flex items-center gap-2'>
							<label className='text-sm font-medium'>Sort By:</label>
							<Select value={sortBy} onValueChange={handleSort}>
								<SelectTrigger className='w-[130px]'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={SortField.DATE}>Date</SelectItem>
									<SelectItem value={SortField.SCORE}>Score</SelectItem>
									<SelectItem value={SortField.TOPIC}>Topic</SelectItem>
									<SelectItem value={SortField.DIFFICULTY}>Difficulty</SelectItem>
								</SelectContent>
							</Select>
							<Button
								variant={ButtonVariant.OUTLINE}
								size={ButtonSize.ICON}
								className='shrink-0 border-input bg-background'
								title={
									sortDirection === SortDirection.ASC
										? 'Sort ascending (click to switch to descending)'
										: 'Sort descending (click to switch to ascending)'
								}
								onClick={() =>
									setSortDirection(sortDirection === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC)
								}
							>
								{sortDirection === SortDirection.ASC ? (
									<ArrowUp className='h-4 w-4' />
								) : (
									<ArrowDown className='h-4 w-4' />
								)}
							</Button>
						</div>
						{(filterDifficulty || filterTopic) && (
							<Button
								variant={ButtonVariant.GHOST}
								size={ButtonSize.SM}
								onClick={() => {
									setFilterDifficulty(null);
									setFilterTopic(null);
								}}
							>
								Clear Filters
							</Button>
						)}
					</div>

					{/* Table */}
					<div className='overflow-x-auto'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									<button
										onClick={() => handleSort(SortField.DATE)}
										className='flex items-center gap-2 hover:text-primary transition-colors'
									>
										<Calendar className='h-4 w-4' />
										Date {sortBy === SortField.DATE && (sortDirection === SortDirection.ASC ? '↑' : '↓')}
									</button>
								</TableHead>
								<TableHead>
									<button onClick={() => handleSort(SortField.TOPIC)} className='hover:text-primary transition-colors'>
										Topic {sortBy === SortField.TOPIC && (sortDirection === SortDirection.ASC ? '↑' : '↓')}
									</button>
								</TableHead>
								<TableHead>
									<button
										onClick={() => handleSort(SortField.DIFFICULTY)}
										className='hover:text-primary transition-colors'
									>
										Difficulty {sortBy === SortField.DIFFICULTY && (sortDirection === SortDirection.ASC ? '↑' : '↓')}
									</button>
								</TableHead>
								<TableHead>
									<button onClick={() => handleSort(SortField.SCORE)} className='hover:text-primary transition-colors'>
										Score {sortBy === SortField.SCORE && (sortDirection === SortDirection.ASC ? '↑' : '↓')}
									</button>
								</TableHead>
								<TableHead>Questions</TableHead>
								<TableHead>Duration</TableHead>
								<TableHead className='w-10'></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{paginatedRecords.map(record => {
								return (
									<TableRow key={record.id}>
										<TableCell className='font-medium'>{formatDate(record.createdAt)}</TableCell>
										<TableCell>{record.topic ?? 'General'}</TableCell>
										<TableCell>
											<Badge variant={VariantBase.OUTLINE} className={getDifficultyBadgeColor(record.difficulty)}>
												{record.difficulty ?? 'Unknown'}
											</Badge>
										</TableCell>
										<TableCell>
											<span className='font-bold text-primary'>{record.score ?? 0}</span>
										</TableCell>
										<TableCell>
											{record.correctAnswers ?? 0}/{record.gameQuestionCount ?? 0}
										</TableCell>
										<TableCell>
											{(() => {
												const seconds = record.timeSpent ?? 0;
												if (!seconds) return '-';
												const hours = Math.floor(seconds / TIME_DURATIONS_SECONDS.HOUR);
												const minutes = Math.floor(
													(seconds % TIME_DURATIONS_SECONDS.HOUR) / TIME_DURATIONS_SECONDS.MINUTE
												);
												const secs = seconds % TIME_DURATIONS_SECONDS.MINUTE;
												const parts: string[] = [];
												if (hours > 0) parts.push(`${hours}h`);
												if (minutes > 0) parts.push(`${minutes}m`);
												if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
												return parts.join(' ');
											})()}
										</TableCell>
										<TableCell>
											<Button
												variant={ButtonVariant.GHOST}
												size={ButtonSize.ICON}
												className='h-8 w-8 text-muted-foreground hover:text-destructive'
												onClick={() => setDeleteId(record.id)}
												disabled={deleteHistory.isPending}
											>
												{deleteHistory.isPending && deleteId === record.id ? (
													<Spinner size={SpinnerSize.SM} />
												) : (
													<Trash2 className='h-4 w-4' />
												)}
											</Button>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
					</div>
				</CardContent>
			</Card>

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
						<AlertDialogAction
							onClick={() => deleteId && handleDelete(deleteId)}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
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
							onClick={handleClearAll}
							disabled={clearHistory.isPending}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{clearHistory.isPending ? (
								<>
									<Spinner size={SpinnerSize.SM} className='mr-2' />
									Clearing...
								</>
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
