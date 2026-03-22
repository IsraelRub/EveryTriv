import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AtSign, BookUser, Calendar, Clock, ShieldUser } from 'lucide-react';

import { EMPTY_VALUE, TIME_PERIODS_MS } from '@shared/constants';
import { getDisplayNameFromUserFields } from '@shared/utils';

import {
	AdminKey,
	ButtonSize,
	CommonKey,
	DEFAULT_ITEMS_PER_PAGE,
	ROLE_BADGE_CLASSES,
	SortDirection,
	USER_SORT_FIELDS_SET,
	UserSortField,
	VariantBase,
} from '@/constants';
import { DataTableColumnType, type DataTableColumn, type UserTableRow } from '@/types';
import { calculateTotalPages } from '@/utils';
import { Button, Card, CardContent, CardDescription, CardTitle, DataTableCard, Input, Label } from '@/components';
import {
	useAllUsers,
	useUserInsightsById,
	useUserPerformanceById,
	useUserRecommendationsById,
	useUserSearch,
	useUserStatisticsById,
	useUserSummaryById,
} from '@/hooks';
import { UserAnalysisExpandedPanel } from './UserAnalysisExpandedPanel';

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

	const isSearchMode = !!searchSubmitted.trim();

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
		const trimmedQuery = searchQuery.trim();
		if (!trimmedQuery) {
			setSearchSubmitted('');
			return;
		}
		const t = setTimeout(() => setSearchSubmitted(trimmedQuery), TIME_PERIODS_MS.THREE_HUNDRED_MILLISECONDS);
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

	const summaryData = userSummary?.data;
	const statisticsData = userStatistics?.data;
	const performanceData = userPerformance?.data;
	const insightsData = userInsights?.data;
	const recommendationsData = userRecommendations?.data;
	const analysisLoading =
		summaryLoading || statisticsLoading || performanceLoading || insightsLoading || recommendationsLoading;

	const renderExpandedRow = useCallback(
		(row: UserTableRow) => {
			if (selectedUserId !== row.id) return null;
			return (
				<UserAnalysisExpandedPanel
					analysisLoading={analysisLoading}
					summaryError={summaryError}
					summaryData={summaryData}
					statisticsData={statisticsData}
					performanceData={performanceData}
					insightsData={insightsData}
					recommendationsData={recommendationsData}
				/>
			);
		},
		[
			selectedUserId,
			analysisLoading,
			summaryError,
			summaryData,
			statisticsData,
			performanceData,
			insightsData,
			recommendationsData,
		]
	);

	if (error) {
		return (
			<Card>
				<CardContent className='card-content-center'>
					<p className='text-destructive'>{t(AdminKey.FAILED_TO_LOAD_USERS)}</p>
				</CardContent>
			</Card>
		);
	}

	return (
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
				expandedRowId={selectedUserId}
				renderExpandedRow={renderExpandedRow}
			/>
	);
}
