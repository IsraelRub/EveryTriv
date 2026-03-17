import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	AlertCircle,
	AtSign,
	Award,
	BarChart3,
	BookOpen,
	BookUser,
	Brain,
	Calendar,
	CircleStar,
	Clock,
	GamepadIcon,
	HelpCircle,
	Medal,
	ShieldUser,
	Tag,
	Target,
	TrendingUp,
} from 'lucide-react';

import { EMPTY_VALUE, TIME_PERIODS_MS } from '@shared/constants';
import { formatDate, formatNumericValue, formatTitle, getDisplayNameFromUserFields } from '@shared/utils';

import {
	AdminKey,
	ButtonSize,
	Colors,
	CommonKey,
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
import { DataTableColumnType, type DataTableColumn, type UserTableRow } from '@/types';
import { calculateTotalPages, cn } from '@/utils';
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardTitle,
	DataTableCard,
	Input,
	Label,
	SectionCard,
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

const USERS_TABLE_HEADER_KEYS: Record<string, string> = {
	name: AdminKey.USERS_TABLE_NAME,
	email: AdminKey.USERS_TABLE_EMAIL,
	role: AdminKey.USERS_TABLE_ROLE,
	createdAt: AdminKey.USERS_TABLE_CREATED_AT,
	lastLogin: AdminKey.USERS_TABLE_LAST_LOGIN,
};

const USER_TABLE_COLUMNS_BASE: DataTableColumn<UserTableRow>[] = [
	{
		id: 'name',
		type: DataTableColumnType.TEXT,
		getValue: row => getDisplayNameFromUserFields(row),
		headerIcon: <BookUser />,
	},
	{
		id: 'email',
		type: DataTableColumnType.TEXT_PRIMARY,
		getValue: row => row.email,
		sortField: UserSortField.EMAIL,
		headerIcon: <AtSign />,
	},
	{
		id: 'role',
		type: DataTableColumnType.BADGE_ROLE,
		getValue: row => row.role,
		roleBadgeClasses: ROLE_BADGE_CLASSES,
		sortField: UserSortField.ROLE,
		headerIcon: <ShieldUser />,
	},
	{
		id: 'createdAt',
		type: DataTableColumnType.DATE_OPTIONAL,
		getValue: row => row.createdAt,
		sortField: UserSortField.CREATED_AT,
		headerIcon: <Calendar />,
	},
	{
		id: 'lastLogin',
		type: DataTableColumnType.DATE_OPTIONAL,
		getValue: row => row.lastLogin,
		sortField: UserSortField.LAST_LOGIN,
		headerIcon: <Clock />,
	},
];

export function UsersTable() {
	const { t } = useTranslation();
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

	const {
		data: userSummary,
		isLoading: summaryLoading,
		isError: summaryError,
	} = useUserSummaryById(selectedUserId ?? '', false, !!selectedUserId);
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
		const t = setTimeout(() => setSearchSubmitted(trimmed), TIME_PERIODS_MS.THREE_HUNDRED_MILLISECONDS);
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
			firstName: (entry as { firstName?: string | null }).firstName ?? undefined,
			lastName: (entry as { lastName?: string | null }).lastName ?? undefined,
		}));
	}, [isSearchMode, searchResults, users]);

	const sortedList = useMemo(() => {
		return [...displayList].sort((a, b) => {
			const comparison =
				sortBy === UserSortField.EMAIL
					? (a.email ?? '').localeCompare(b.email ?? '')
					: sortBy === UserSortField.ROLE
						? (a.role ?? '').localeCompare(b.role ?? '')
						: sortBy === UserSortField.CREATED_AT
							? new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
							: sortBy === UserSortField.LAST_LOGIN
								? new Date(a.lastLogin ?? 0).getTime() - new Date(b.lastLogin ?? 0).getTime()
								: 0;
			return sortDirection === SortDirection.ASC ? comparison : -comparison;
		});
	}, [displayList, sortBy, sortDirection]);

	const columns = useMemo((): DataTableColumn<UserTableRow>[] => {
		return [
			...USER_TABLE_COLUMNS_BASE.map(col => {
				const headerKey = USERS_TABLE_HEADER_KEYS[col.id];
				const headerLabel = headerKey ? t(headerKey) : undefined;
				const dateDefaultValue = col.id === 'lastLogin' ? t(AdminKey.DATE_DEFAULT_NEVER) : col.dateDefaultValue;
				return { ...col, headerLabel, dateDefaultValue };
			}),
			{
				id: 'actions',
				emptyHeader: true,
				type: DataTableColumnType.CUSTOM,
				headerClassName: 'w-24',
				render: row => {
					const isOpen = selectedUserId === row.id;
					return (
						<Button
							variant={isOpen ? VariantBase.DEFAULT : VariantBase.OUTLINE}
							size={ButtonSize.SM}
							onClick={() => setSelectedUserId(isOpen ? null : row.id)}
						>
							{t(AdminKey.USER_ANALYSIS)}
						</Button>
					);
				},
			},
		];
	}, [selectedUserId, t]);

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
					<p className='text-destructive'>{t(AdminKey.FAILED_TO_LOAD_USERS)}</p>
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
							<BookUser className='h-5 w-5 text-primary' />
							{t(AdminKey.ALL_USERS)}
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
							<Label className='text-sm font-medium'>{t(CommonKey.SEARCH)}:</Label>
							<Input
								placeholder={t(AdminKey.USERS_SEARCH_PLACEHOLDER)}
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
								{t(AdminKey.CLEAR_SEARCH)}
							</Button>
						)}
					</>
				}
				columns={columns}
				data={paginatedList}
				getRowKey={row => row.id}
				isLoading={isLoadingTable}
				emptyState={{
					title: isSearchMode ? t(AdminKey.NO_MATCHING_USERS) : t(AdminKey.NO_USERS_FOUND),
					description: isSearchMode ? t(AdminKey.NO_MATCHING_USERS_DESC) : t(AdminKey.NO_USERS_FOUND_DESC),
				}}
				emptyValue={EMPTY_VALUE}
				sortBy={sortBy}
				sortDirection={sortDirection}
				onSort={onSort}
			/>

			{selectedUserId && (
				<SectionCard
					contentClassName='space-y-6'
					title={t(AdminKey.USER_ANALYSIS)}
					icon={Brain}
					description={t(AdminKey.USER_ANALYSIS_DESC)}
				>
					{analysisLoading ? (
						<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
							<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
						</div>
					) : summaryError ? (
						<p className='text-destructive text-sm'>{t(AdminKey.FAILED_TO_LOAD_USER_ANALYTICS)}</p>
					) : summaryData ? (
						<>
							<div className='grid grid-cols-1 gap-4 text-sm'>
								<div className='flex flex-wrap gap-6'>
									<div className='flex items-center gap-1.5'>
										<span className='text-muted-foreground'>{t(AdminKey.USERS_TABLE_EMAIL)}</span>
										<span className={cn('ml-2 font-medium')}>{summaryData.user.email ?? EMPTY_VALUE}</span>
									</div>
									<div>
										<span className='text-muted-foreground'>{t(AdminKey.USERS_TABLE_USER_ID)}</span>
										<span className='ml-2 font-mono text-xs'>{summaryData.user.userId}</span>
									</div>
									<div>
										<span className='text-muted-foreground'>{t(AdminKey.CREDITS)}</span>
										<span className='ml-2 font-medium'>{summaryData.user.credits ?? 0}</span>
									</div>
									<div>
										<span className='text-muted-foreground'>{t(AdminKey.ACCOUNT_CREATED)}</span>
										<span className='ml-2'>{formatDate(summaryData.user.createdAt)}</span>
									</div>
								</div>
							</div>

							<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
								<StatCard
									variant={StatCardVariant.CENTERED}
									icon={GamepadIcon}
									label={t(AdminKey.USERS_LABEL_TOTAL_GAMES)}
									value={formatNumericValue(summaryData.highlights.totalGames, 0)}
									color={Colors.BLUE_500.text}
								/>
								<StatCard
									variant={StatCardVariant.CENTERED}
									icon={Medal}
									label={t(AdminKey.USERS_LABEL_BEST_SCORE)}
									value={formatNumericValue(summaryData.highlights.bestScore, 0)}
									color={Colors.GREEN_500.text}
								/>
								{performanceData && (
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={TrendingUp}
										label={t(AdminKey.USERS_LABEL_STREAK_DAYS)}
										value={formatNumericValue(performanceData.streakDays, 0)}
										color={Colors.PURPLE_500.text}
									/>
								)}
							</div>

							{statisticsData && (
								<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={BarChart3}
										label={t(AdminKey.USERS_LABEL_SUCCESS_RATE)}
										value={formatNumericValue(statisticsData.successRate, 1, '%')}
										color={Colors.BLUE_500.text}
									/>
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={HelpCircle}
										label={t(AdminKey.USERS_LABEL_QUESTIONS_ANSWERED)}
										value={formatNumericValue(statisticsData.totalQuestionsAnswered, 0)}
										color={Colors.GREEN_500.text}
									/>
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={Target}
										label={t(AdminKey.USERS_LABEL_AVERAGE_SCORE)}
										value={formatNumericValue(statisticsData.averageScore, 0)}
										color={Colors.AMBER_600.text}
									/>
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={Clock}
										label={t(AdminKey.USERS_LABEL_TOTAL_PLAY_TIME)}
										value={formatNumericValue(statisticsData.totalPlayTime, 0)}
										suffix=' s'
										color={Colors.PURPLE_500.text}
									/>
								</div>
							)}

							{performanceData && (
								<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={BookOpen}
										label={t(AdminKey.USERS_LABEL_STRONGEST_TOPIC)}
										value={formatTitle(performanceData.strongestTopic || EMPTY_VALUE)}
										color={Colors.GREEN_500.text}
									/>
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={AlertCircle}
										label={t(AdminKey.USERS_LABEL_WEAKEST_TOPIC)}
										value={formatTitle(performanceData.weakestTopic || EMPTY_VALUE)}
										color={Colors.AMBER_600.text}
									/>
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={TrendingUp}
										label={t(AdminKey.USERS_LABEL_IMPROVEMENT_RATE)}
										value={formatNumericValue(performanceData.improvementRate, 2, '%')}
										color={Colors.BLUE_500.text}
									/>
									<StatCard
										variant={StatCardVariant.CENTERED}
										icon={Calendar}
										label={t(AdminKey.USERS_LABEL_LAST_PLAYED)}
										value={formatDate(performanceData.lastPlayed)}
										color={Colors.PURPLE_500.text}
									/>
								</div>
							)}

							{insightsData &&
								((summaryData?.highlights?.topTopics?.length ?? 0) > 0 ||
									(insightsData.strengths?.length ?? 0) > 0 ||
									(insightsData.improvements?.length ?? 0) > 0 ||
									(insightsData.recentHighlights?.length ?? 0) > 0) && (
									<div className='space-y-3'>
										<div className='text-sm font-medium text-muted-foreground'>{t(AdminKey.INSIGHTS)}</div>
										<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm'>
											{summaryData?.highlights?.topTopics && summaryData.highlights.topTopics.length > 0 && (
												<div className='rounded-lg bg-muted/50 p-4 transition-colors hover-row'>
													<div className='flex items-center gap-2 mb-2'>
														<Tag className={cn('h-5 w-5 flex-shrink-0', Colors.BLUE_500.text)} strokeWidth={2.25} />
														<span className='font-medium text-muted-foreground'>{t(AdminKey.TOP_TOPICS)}</span>
													</div>
													<div className='flex flex-wrap gap-1.5'>
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
											{insightsData.strengths?.length > 0 && (
												<div className='rounded-lg bg-muted/50 p-4 transition-colors hover-row'>
													<div className='flex items-center gap-2 mb-2'>
														<Award className={cn('h-5 w-5 flex-shrink-0', Colors.GREEN_500.text)} strokeWidth={2.25} />
														<span className='font-medium text-green-600 dark:text-green-400'>
															{t(AdminKey.STRENGTHS)}
														</span>
													</div>
													<ul className='list-disc list-inside space-y-0.5'>
														{insightsData.strengths.map((s, i) => (
															<li key={i}>{s}</li>
														))}
													</ul>
												</div>
											)}
											{insightsData.improvements?.length > 0 && (
												<div className='rounded-lg bg-muted/50 p-4 transition-colors hover-row'>
													<div className='flex items-center gap-2 mb-2'>
														<TrendingUp
															className={cn('h-5 w-5 flex-shrink-0', Colors.AMBER_600.text)}
															strokeWidth={2.25}
														/>
														<span className='font-medium text-amber-600 dark:text-amber-400'>
															{t(AdminKey.IMPROVEMENTS)}
														</span>
													</div>
													<ul className='list-disc list-inside space-y-0.5'>
														{insightsData.improvements.map((s, i) => (
															<li key={i}>{s}</li>
														))}
													</ul>
												</div>
											)}
											{insightsData.recentHighlights?.length > 0 && (
												<div className='rounded-lg bg-muted/50 p-4 transition-colors hover-row'>
													<div className='flex items-center gap-2 mb-2'>
														<CircleStar
															className={cn('h-5 w-5 flex-shrink-0', Colors.PURPLE_500.text)}
															strokeWidth={2.25}
														/>
														<span className='font-medium text-muted-foreground'>{t(AdminKey.RECENT_HIGHLIGHTS)}</span>
													</div>
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
									<div className='text-sm font-medium text-muted-foreground mb-2'>{t(AdminKey.RECOMMENDATIONS)}</div>
									<div className='flex flex-wrap gap-2'>
										{recommendationsData.map(rec => (
											<div key={rec.id} className='rounded-md border p-3 text-sm min-w-[200px] max-w-[320px] flex-1'>
												<div className='font-medium'>{rec.title}</div>
												{rec.description ? <div className='text-muted-foreground mt-1'>{rec.description}</div> : null}
											</div>
										))}
									</div>
								</div>
							)}
						</>
					) : (
						<p className='text-muted-foreground text-sm'>{t(AdminKey.NO_ANALYTICS_FOR_USER)}</p>
					)}
				</SectionCard>
			)}
		</div>
	);
}
