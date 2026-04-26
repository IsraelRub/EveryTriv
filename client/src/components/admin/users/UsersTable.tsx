import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AtSign, BookUser, Calendar, Clock, ShieldUser } from 'lucide-react';

import { EMPTY_VALUE, TIME_PERIODS_MS } from '@shared/constants';
import type { AdminUserData, UserSearchCacheResult } from '@shared/types';
import { getDisplayNameFromUserFields } from '@shared/utils';

import {
	AdminKey,
	ButtonSize,
	CommonKey,
	DataTableColumnType,
	DEFAULT_ITEMS_PER_PAGE,
	EMPTY_STATE_LUCIDE_ICON,
	QUERY_KEYS,
	ROLE_BADGE_CLASSES,
	SortDirection,
	USER_SORT_FIELDS_SET,
	UserSortField,
	VariantBase,
} from '@/constants';
import type { DataTableColumn, UserTableRow } from '@/types';
import { adminService, apiService } from '@/services';
import { calculateTotalPages } from '@/utils';
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardTitle,
	DataTableCard,
	DisclosureChevron,
	Input,
	Label,
} from '@/components';
import { useDebouncedValue } from '@/hooks';
import { useAdminUserPanelQueries } from './useAdminUserPanelQueries';
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
	const [sortBy, setSortBy] = useState<string>(UserSortField.EMAIL);
	const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.ASC);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

	const trimmedSearchQuery = useMemo(() => searchQuery.trim(), [searchQuery]);
	const debouncedTrimmedSearch = useDebouncedValue(
		trimmedSearchQuery,
		TIME_PERIODS_MS.SERVER_SEARCH_QUERY_DEBOUNCE_MS,
		query => query.length === 0
	);
	const isSearchMode = !!debouncedTrimmedSearch;
	const trimmedSearch = debouncedTrimmedSearch;

	const { data, isLoading, error } = useQuery({
		queryKey: QUERY_KEYS.admin.users(limit, offset),
		queryFn: () => adminService.getAllUsers(limit, offset),
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
	});

	const { data: searchData, isLoading: searchLoading } = useQuery({
		queryKey: QUERY_KEYS.admin.userSearch(trimmedSearch, limit),
		queryFn: () => apiService.searchUsers(trimmedSearch, limit),
		enabled: !!trimmedSearch,
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});

	const {
		userSummary,
		summaryLoading,
		summaryError,
		userStatistics,
		statisticsLoading,
		userPerformance,
		performanceLoading,
		userInsights,
		insightsLoading,
		userRecommendations,
		recommendationsLoading,
	} = useAdminUserPanelQueries(selectedUserId);

	const users = useMemo<AdminUserData[]>(() => data?.users ?? [], [data?.users]);
	const searchResults = useMemo<UserSearchCacheResult[]>(() => searchData?.results ?? [], [searchData?.results]);
	const totalUsers = data?.pagination?.total ?? users.length;
	const totalPages = calculateTotalPages(totalUsers, limit);

	const displayList = useMemo((): UserTableRow[] => {
		const list: Array<AdminUserData | UserSearchCacheResult> = isSearchMode ? searchResults : users;
		return list.map(entry => ({
			id: entry.id,
			email: entry.email ?? '',
			role: entry.role ?? EMPTY_VALUE,
			createdAt: entry.createdAt ?? EMPTY_VALUE,
			lastLogin: entry.lastLogin ?? EMPTY_VALUE,
			firstName: entry.firstName ?? undefined,
			lastName: entry.lastName ?? undefined,
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
				headerClassName: 'min-w-[9.5rem] w-[9.5rem]',
				render: row => {
					const isOpen = selectedUserId === row.id;
					return (
						<Button
							variant={isOpen ? VariantBase.DEFAULT : VariantBase.OUTLINE}
							size={ButtonSize.SM}
							onClick={() => setSelectedUserId(isOpen ? null : row.id)}
							className='gap-1.5'
						>
							<DisclosureChevron expanded={isOpen} className='h-4 w-4' />
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
							? `${displayTotal} result${displayTotal !== 1 ? 's' : ''} for "${trimmedSearch}"`
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
							className='w-full min-w-0 max-w-[14rem]'
						/>
					</div>
					{searchQuery.length > 0 && (
						<Button
							variant={VariantBase.MINIMAL}
							size={ButtonSize.SM}
							onClick={() => {
								setSearchQuery('');
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
				icon: isSearchMode ? EMPTY_STATE_LUCIDE_ICON.searchNoResults : undefined,
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
