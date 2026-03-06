import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Award,
	Brain,
	Calendar,
	CircleUser,
	Clock,
	GamepadIcon,
	Medal,
	ShieldQuestion,
	TrendingUp,
	X,
} from 'lucide-react';

import { EMPTY_VALUE } from '@shared/constants';
import { formatDate, formatNumericValue, formatTitle } from '@shared/utils';

import {
	ButtonSize,
	Colors,
	DEFAULT_ITEMS_PER_PAGE,
	ROLE_BADGE_CLASSES,
	SKELETON_PLACEHOLDER_COUNTS,
	SkeletonVariant,
	SortDirection,
	StatCardVariant,
	USER_SORT_FIELDS_SET,
	UserSortField,
	VariantBase,
} from '@/constants';
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DataTableCard,
	Input,
	Label,
	Skeleton,
	StatCard,
} from '@/components';
import {
	useAllUsers,
	useUserInsightsById,
	useUserPerformanceById,
	useUserRecommendationsById,
	useUserSearch,
	useUserStatisticsById,
	useUserSummaryById,
} from '@/hooks';
import { type DataTableColumn, type UserTableRow } from '@/types';
import { calculateTotalPages, cn } from '@/utils';

const SEARCH_DEBOUNCE_MS = 300;

const USER_TABLE_COLUMNS_BASE: DataTableColumn<UserTableRow>[] = [
	{
		id: 'email',
		type: 'text-primary',
		getValue: row => row.email,
		sortField: UserSortField.EMAIL,
	},
	{
		id: 'role',
		type: 'badge-role',
		getValue: row => row.role,
		roleBadgeClasses: ROLE_BADGE_CLASSES,
		sortField: UserSortField.ROLE,
		headerIcon: <ShieldQuestion />,
	},
	{
		id: 'createdAt',
		type: 'date-optional',
		getValue: row => row.createdAt,
		sortField: UserSortField.CREATED_AT,
		headerIcon: <Calendar />,
	},
	{
		id: 'lastLogin',
		type: 'date-optional',
		getValue: row => row.lastLogin,
		dateDefaultValue: 'Never',
		sortField: UserSortField.LAST_LOGIN,
		headerIcon: <Clock />,
	},
];

export function UsersTable() {
	const [limit] = useState(DEFAULT_ITEMS_PER_PAGE);
	const [offset, setOffset] = useState(0);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchSubmitted, setSearchSubmitted] = useState('');
	const [sortBy, setSortBy] = useState<string>(UserSortField.EMAIL);
	const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.ASC);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

	const isSearchMode = searchSubmitted.trim().length >= 2;

	const { data, isLoading, error } = useAllUsers(limit, offset);
	const { data: searchData, isLoading: searchLoading } = useUserSearch(searchSubmitted, limit);

	const { data: userSummary, isLoading: summaryLoading } = useUserSummaryById(
		selectedUserId ?? '',
		false,
		!!selectedUserId
	);
	const { data: userStatistics, isLoading: statisticsLoading } = useUserStatisticsById(
		selectedUserId ?? '',
		!!selectedUserId
	);
	const { data: userPerformance, isLoading: performanceLoading } = useUserPerformanceById(
		selectedUserId ?? '',
		!!selectedUserId
	);
	const { data: userInsights, isLoading: insightsLoading } = useUserInsightsById(
		selectedUserId ?? '',
		!!selectedUserId
	);
	const { data: userRecommendations, isLoading: recommendationsLoading } = useUserRecommendationsById(
		selectedUserId ?? '',
		!!selectedUserId
	);

	useEffect(() => {
		const trimmed = searchQuery.trim();
		if (trimmed.length < 2) {
			setSearchSubmitted('');
			return;
		}
		const t = setTimeout(() => setSearchSubmitted(trimmed), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [searchQuery]);

	const users = useMemo(() => data?.users ?? [], [data?.users]);
	const searchResults = useMemo(() => searchData?.results ?? [], [searchData?.results]);
	const totalUsers = data?.pagination?.total ?? users.length;
	const totalPages = calculateTotalPages(totalUsers, limit);

	const displayList = useMemo((): UserTableRow[] => {
		const list = isSearchMode ? searchResults : users;
		return list.map(entry => ({
			id: entry.id,
			email: entry.email ?? '',
			role: entry.role ?? EMPTY_VALUE,
			createdAt: entry.createdAt ?? EMPTY_VALUE,
			lastLogin: entry.lastLogin ?? EMPTY_VALUE,
		}));
	}, [isSearchMode, searchResults, users]);

	const sortedList = useMemo(() => {
		return [...displayList].sort((a, b) => {
			let comparison = 0;
			switch (sortBy) {
				case UserSortField.EMAIL:
					comparison = (a.email ?? '').localeCompare(b.email ?? '');
					break;
				case UserSortField.ROLE:
					comparison = (a.role ?? '').localeCompare(b.role ?? '');
					break;
				case UserSortField.CREATED_AT:
					comparison = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
					break;
				case UserSortField.LAST_LOGIN:
					comparison = new Date(a.lastLogin ?? 0).getTime() - new Date(b.lastLogin ?? 0).getTime();
					break;
				default:
					return 0;
			}
			return sortDirection === SortDirection.ASC ? comparison : -comparison;
		});
	}, [displayList, sortBy, sortDirection]);

	const columns = useMemo((): DataTableColumn<UserTableRow>[] => {
		return [
			...USER_TABLE_COLUMNS_BASE,
			{
				id: 'actions',
				emptyHeader: true,
				type: 'custom',
				headerClassName: 'w-24',
				render: row => (
					<Button variant={VariantBase.OUTLINE} size={ButtonSize.SM} onClick={() => setSelectedUserId(row.id)}>
						Analyze
					</Button>
				),
			},
		];
	}, []);

	const onSort = useCallback((field: string, direction: SortDirection) => {
		if (!USER_SORT_FIELDS_SET.has(field)) return;
		setSortBy(field);
		setSortDirection(direction);
		setOffset(0);
	}, []);

	const isLoadingTable = isSearchMode ? searchLoading : isLoading;
	const displayTotal = isSearchMode ? (searchData?.totalResults ?? 0) : totalUsers;
	const startIndex = isSearchMode ? 0 : offset;
	const endIndex = isSearchMode ? sortedList.length : Math.min(offset + limit, totalUsers);

	const paginatedList = useMemo(() => {
		if (isSearchMode) {
			const start = offset;
			return sortedList.slice(start, start + limit);
		}
		return sortedList;
	}, [isSearchMode, sortedList, offset, limit]);

	if (error) {
		return (
			<Card>
				<CardContent className='card-content-center'>
					<p className='text-destructive'>Failed to load users. Please try again later.</p>
				</CardContent>
			</Card>
		);
	}

	const summaryData = userSummary?.data;
	const statisticsData = userStatistics?.data;
	const performanceData = userPerformance?.data;
	const insightsData = userInsights?.data;
	const recommendationsData = userRecommendations?.data;
	const analysisLoading =
		summaryLoading || statisticsLoading || performanceLoading || insightsLoading || recommendationsLoading;

	return (
		<div className='space-y-8'>
			<DataTableCard<UserTableRow>
				header={{
					title: (
						<CardTitle className='flex items-center gap-2'>
							<CircleUser className='h-5 w-5 text-primary' />
							All Users
						</CardTitle>
					),
					description: (
						<CardDescription>
							{isSearchMode
								? `${displayTotal} result${displayTotal !== 1 ? 's' : ''} for "${searchSubmitted}"`
								: `Showing ${startIndex + 1}-${endIndex} of ${totalUsers} users`}
							{isSearchMode && totalUsers > 0 ? ` (${totalUsers} total)` : ''}
						</CardDescription>
					),
					pagination:
						!isSearchMode && totalPages > 1
							? (() => {
									const hasPrevious = offset > 0;
									const hasNext = offset + limit < totalUsers;
									return {
										hasPrevious,
										hasNext,
										onPrevious: () => hasPrevious && setOffset(offset - limit),
										onNext: () => hasNext && setOffset(offset + limit),
										currentPage: Math.floor(offset / limit) + 1,
										totalPages,
										disabled: isLoading,
									};
								})()
							: null,
				}}
				filters={
					<>
						<div className='flex items-center gap-2'>
							<Label className='text-sm font-medium'>Search:</Label>
							<Input
								placeholder='Email or name (min 2 characters)...'
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className='w-full min-w-0 max-w-[220px]'
							/>
						</div>
						{searchQuery.length > 0 && (
							<Button
								variant={VariantBase.MINIMAL}
								size={ButtonSize.SM}
								onClick={() => {
									setSearchQuery('');
									setSearchSubmitted('');
								}}
							>
								Clear search
							</Button>
						)}
					</>
				}
				columns={columns}
				data={paginatedList}
				getRowKey={row => row.id}
				isLoading={isLoadingTable}
				emptyState={{
					title: isSearchMode ? 'No matching users' : 'No users found',
					description: isSearchMode
						? 'Try a different search term or clear the search to see all users.'
						: 'No users have been registered yet.',
				}}
				emptyValue={EMPTY_VALUE}
				sortBy={sortBy}
				sortDirection={sortDirection}
				onSort={onSort}
			/>

			{selectedUserId && (
				<Card className='card-muted-tint'>
					<CardHeader className='flex flex-row items-start justify-between gap-4'>
						<div>
							<CardTitle className='flex items-center gap-2'>
								<Brain className='h-5 w-5 text-primary' />
								User analysis
							</CardTitle>
							<CardDescription>Summary, statistics and performance for selected user</CardDescription>
						</div>
						<Button
							variant={VariantBase.MINIMAL}
							size={ButtonSize.ICON_LG}
							onClick={() => setSelectedUserId(null)}
							className='shrink-0'
						>
							<X className='h-4 w-4' />
						</Button>
					</CardHeader>
					<CardContent className='space-y-6'>
						{analysisLoading ? (
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
								<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
							</div>
						) : summaryData ? (
							<>
								<div className='grid grid-cols-1 gap-4 text-sm'>
									<div className='flex flex-wrap gap-6'>
										<div className='flex items-center gap-1.5'>
											<span className='text-muted-foreground'>Email</span>
											<span className={cn('ml-2 font-medium')}>{summaryData.user.email ?? EMPTY_VALUE}</span>
										</div>
										<div>
											<span className='text-muted-foreground'>User ID</span>
											<span className='ml-2 font-mono text-xs'>{summaryData.user.userId}</span>
										</div>
										<div>
											<span className='text-muted-foreground'>Credits</span>
											<span className='ml-2 font-medium'>{summaryData.user.credits ?? 0}</span>
										</div>
										<div>
											<span className='text-muted-foreground'>Account created</span>
											<span className='ml-2'>{formatDate(summaryData.user.createdAt)}</span>
										</div>
									</div>
								</div>

								<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={GamepadIcon}
										label='Total games'
										value={formatNumericValue(summaryData.highlights.totalGames, 0)}
										color={Colors.BLUE_500.text}
									/>
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={Medal}
										label='Best score'
										value={formatNumericValue(summaryData.highlights.bestScore, 0)}
										color={Colors.GREEN_500.text}
									/>
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={Award}
										label='Achievements'
										value={summaryData.highlights.achievementsUnlocked ?? 0}
										color={Colors.YELLOW_500.text}
									/>
									{performanceData && (
										<StatCard
											variant={StatCardVariant.CENTERED}
											icon={TrendingUp}
											label='Streak (days)'
											value={formatNumericValue(performanceData.streakDays, 0)}
											color={Colors.PURPLE_500.text}
										/>
									)}
								</div>

								{statisticsData && (
									<div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
										<div>
											<span className='text-muted-foreground'>Success rate</span>
											<div className='font-medium'>{formatNumericValue(statisticsData.successRate, 1, '%')}</div>
										</div>
										<div>
											<span className='text-muted-foreground'>Questions answered</span>
											<div className='font-medium'>{formatNumericValue(statisticsData.totalQuestionsAnswered, 0)}</div>
										</div>
										<div>
											<span className='text-muted-foreground'>Average score</span>
											<div className='font-medium'>{formatNumericValue(statisticsData.averageScore, 0)}</div>
										</div>
										<div>
											<span className='text-muted-foreground'>Total play time</span>
											<div className='font-medium'>{formatNumericValue(statisticsData.totalPlayTime, 0, 's')}</div>
										</div>
									</div>
								)}

								{performanceData && (
									<div className='flex flex-wrap gap-4 text-sm'>
										<div>
											<span className='text-muted-foreground'>Strongest topic</span>
											<div className='font-medium'>{formatTitle(performanceData.strongestTopic || EMPTY_VALUE)}</div>
										</div>
										<div>
											<span className='text-muted-foreground'>Weakest topic</span>
											<div className='font-medium'>{formatTitle(performanceData.weakestTopic || EMPTY_VALUE)}</div>
										</div>
										<div>
											<span className='text-muted-foreground'>Improvement rate</span>
											<div className='font-medium'>{formatNumericValue(performanceData.improvementRate, 2, '%')}</div>
										</div>
										<div>
											<span className='text-muted-foreground'>Last played</span>
											<div className='font-medium'>{formatDate(performanceData.lastPlayed)}</div>
										</div>
									</div>
								)}

								{summaryData.highlights.topTopics && summaryData.highlights.topTopics.length > 0 && (
									<div>
										<div className='text-sm font-medium text-muted-foreground mb-2'>Top topics</div>
										<div className='flex flex-wrap gap-2'>
											{summaryData.highlights.topTopics.map(topic => (
												<span
													key={topic}
													className='inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium'
												>
													{formatTitle(topic)}
												</span>
											))}
										</div>
									</div>
								)}

								{insightsData &&
									(insightsData.strengths?.length > 0 ||
										insightsData.improvements?.length > 0 ||
										insightsData.recentHighlights?.length > 0) && (
										<div className='space-y-3'>
											<div className='text-sm font-medium text-muted-foreground'>Insights</div>
											<div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
												{insightsData.strengths?.length > 0 && (
													<div>
														<div className='font-medium text-green-600 dark:text-green-400 mb-1'>Strengths</div>
														<ul className='list-disc list-inside space-y-0.5'>
															{insightsData.strengths.map((s, i) => (
																<li key={i}>{s}</li>
															))}
														</ul>
													</div>
												)}
												{insightsData.improvements?.length > 0 && (
													<div>
														<div className='font-medium text-amber-600 dark:text-amber-400 mb-1'>Improvements</div>
														<ul className='list-disc list-inside space-y-0.5'>
															{insightsData.improvements.map((s, i) => (
																<li key={i}>{s}</li>
															))}
														</ul>
													</div>
												)}
												{insightsData.recentHighlights?.length > 0 && (
													<div>
														<div className='font-medium text-muted-foreground mb-1'>Recent highlights</div>
														<ul className='list-disc list-inside space-y-0.5'>
															{insightsData.recentHighlights.map((s, i) => (
																<li key={i}>{s}</li>
															))}
														</ul>
													</div>
												)}
											</div>
										</div>
									)}

								{recommendationsData && recommendationsData.length > 0 && (
									<div>
										<div className='text-sm font-medium text-muted-foreground mb-2'>Recommendations</div>
										<ul className='space-y-2'>
											{recommendationsData.map(rec => (
												<li key={rec.id} className='rounded-md border p-3 text-sm'>
													<div className='font-medium'>{rec.title}</div>
													{rec.description ? <div className='text-muted-foreground mt-1'>{rec.description}</div> : null}
												</li>
											))}
										</ul>
									</div>
								)}
							</>
						) : null}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
