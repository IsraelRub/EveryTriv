import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cva } from 'class-variance-authority';
import { CheckCircle2, Database, GamepadIcon, RefreshCw, Users as UsersIcon, XCircle } from 'lucide-react';

import { ERROR_MESSAGES, TIME_PERIODS_MS, VALIDATION_LENGTH } from '@shared/constants';
import { formatTitle, truncateWithEllipsis } from '@shared/utils';

import {
	AdminKey,
	AlertIconSize,
	ButtonSize,
	DataTableColumnType,
	QUERY_KEYS,
	SEMANTIC_ICON_TEXT,
	SKELETON_PLACEHOLDER_COUNTS,
	SkeletonVariant,
	StatCardVariant,
	VariantBase,
} from '@/constants';
import type { ConsistencyDiscrepancy, ConsistencyResultRow, DataTableColumn } from '@/types';
import { analyticsService } from '@/services';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	AlertIcon,
	Badge,
	Button,
	DataTableCard,
	SectionCard,
	Skeleton,
	StatCard,
} from '@/components';
import { useUserRole } from '@/hooks';

const consistencyStatusVariants = cva('', {
	variants: {
		status: { consistent: '', inconsistent: '' },
		target: { icon: 'h-5 w-5', badge: '' },
	},
	compoundVariants: [
		{ status: 'consistent', target: 'icon', class: SEMANTIC_ICON_TEXT.success },
		{ status: 'inconsistent', target: 'icon', class: 'text-destructive' },
		{
			status: 'consistent',
			target: 'badge',
			class: 'bg-success/10 border-success text-success',
		},
		{ status: 'inconsistent', target: 'badge', class: 'bg-destructive/10 text-destructive border-destructive' },
	],
	defaultVariants: { status: 'inconsistent', target: 'icon' },
});

const CONSISTENCY_DISCREPANCY_FIELDS: ReadonlyArray<keyof ConsistencyResultRow['discrepancies']> = [
	'totalGames',
	'totalQuestionsAnswered',
	'correctAnswers',
	'totalScore',
];

function DiscrepancyCell({ expected, actual }: ConsistencyDiscrepancy): JSX.Element {
	const { t } = useTranslation('admin');
	return (
		<div className='flex flex-col'>
			<span>
				{t(AdminKey.EXPECTED)}: {expected}
			</span>
			<span className='text-destructive'>
				{t(AdminKey.ACTUAL)}: {actual}
			</span>
		</div>
	);
}

export function ConsistencyManagementSection() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { isAdmin } = useUserRole();
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

	const {
		data: allConsistency,
		isLoading: allConsistencyLoading,
		refetch: refetchAll,
	} = useQuery({
		queryKey: QUERY_KEYS.admin.allUsersConsistency(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.checkAllUsersConsistency();
		},
		enabled: isAdmin,
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});

	const {
		data: userConsistency,
		isLoading: userConsistencyLoading,
		refetch: refetchUser,
	} = useQuery({
		queryKey: QUERY_KEYS.admin.userStatsConsistency(selectedUserId ?? ''),
		queryFn: async () => {
			if (!isAdmin || !selectedUserId) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.checkUserStatsConsistency(selectedUserId);
		},
		enabled: isAdmin && !!selectedUserId,
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});

	const fixConsistency = useMutation({
		mutationFn: async (userId: string) => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.fixUserStatsConsistency(userId);
		},
		onSuccess: (_, userId) => {
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userStatsConsistency(userId) });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.allUsersConsistency() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userAnalytics() });
		},
	});

	const handleFixUser = useCallback(
		async (userId: string) => {
			try {
				await fixConsistency.mutateAsync(userId);
				await refetchUser();
				await refetchAll();
			} catch {
				// Error is handled by the mutation
			}
		},
		[fixConsistency, refetchUser, refetchAll]
	);

	const inconsistentRows = useMemo<ConsistencyResultRow[]>(() => {
		if (!allConsistency?.results) return [];
		return allConsistency.results.filter((row: ConsistencyResultRow) => !row.isConsistent).slice(0, 20);
	}, [allConsistency?.results]);

	const consistencyColumns = useMemo((): DataTableColumn<ConsistencyResultRow>[] => {
		const discrepancyColumns: DataTableColumn<ConsistencyResultRow>[] = CONSISTENCY_DISCREPANCY_FIELDS.map(key => ({
			id: key,
			type: DataTableColumnType.CUSTOM,
			render: (row: ConsistencyResultRow) => <DiscrepancyCell {...row.discrepancies[key]} />,
		}));
		return [
			{
				id: 'userId',
				headerLabel: t(AdminKey.USERS_TABLE_USER_ID),
				type: DataTableColumnType.TEXT,
				getValue: row => truncateWithEllipsis(row.userId, VALIDATION_LENGTH.STRING_TRUNCATION.ID_PREVIEW),
				cellClassName: 'font-mono text-sm',
			},
			...discrepancyColumns,
			{
				id: 'actions',
				emptyHeader: true,
				type: DataTableColumnType.CUSTOM,
				render: row => (
					<div className='flex gap-2'>
						<Button
							variant={VariantBase.OUTLINE}
							size={ButtonSize.SM}
							onClick={() => setSelectedUserId(row.userId)}
							disabled={userConsistencyLoading}
						>
							{t(AdminKey.CHECK)}
						</Button>
						<Button
							variant={VariantBase.DEFAULT}
							size={ButtonSize.SM}
							onClick={() => handleFixUser(row.userId)}
							disabled={fixConsistency.isPending}
						>
							{!fixConsistency.isPending ? t(AdminKey.FIX) : <RefreshCw className='h-4 w-4 animate-spin-slow' />}
						</Button>
					</div>
				),
			},
		];
	}, [handleFixUser, userConsistencyLoading, fixConsistency.isPending, t]);

	return (
		<div className='space-y-8'>
			{/* Summary Card */}
			<SectionCard
				className='card-primary-tint'
				title={t(AdminKey.DATA_CONSISTENCY_MANAGEMENT)}
				icon={Database}
				description={t(AdminKey.DATA_CONSISTENCY_DESC)}
			>
				{allConsistencyLoading ? (
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
					</div>
				) : allConsistency ? (
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						<StatCard
							variant={StatCardVariant.CENTERED}
							icon={UsersIcon}
							label={t(AdminKey.TOTAL_USERS)}
							value={allConsistency.totalUsers.toLocaleString()}
							color={SEMANTIC_ICON_TEXT.primary}
						/>
						<StatCard
							variant={StatCardVariant.CENTERED}
							icon={GamepadIcon}
							label={t(AdminKey.USERS_WITH_GAMES)}
							value={allConsistency.usersWithGames.toLocaleString()}
							color={SEMANTIC_ICON_TEXT.success}
						/>
						<StatCard
							variant={StatCardVariant.CENTERED}
							icon={CheckCircle2}
							label={t(AdminKey.CONSISTENT_USERS)}
							value={allConsistency.consistentUsers.toLocaleString()}
							color={SEMANTIC_ICON_TEXT.success}
						/>
						<StatCard
							variant={StatCardVariant.CENTERED}
							icon={XCircle}
							label={t(AdminKey.INCONSISTENT_USERS)}
							value={allConsistency.inconsistentUsers.toLocaleString()}
							color={SEMANTIC_ICON_TEXT.destructive}
						/>
					</div>
				) : null}
			</SectionCard>

			{/* Inconsistent Users Table */}
			{allConsistency && allConsistency.inconsistentUsers > 0 && (
				<Accordion type='multiple' defaultValue={['inconsistent-users']} className='w-full rounded-lg border bg-card'>
					<AccordionItem value='inconsistent-users'>
						<AccordionTrigger className='px-4'>
							<span className='flex items-center gap-2'>
								<AlertIcon size={AlertIconSize.LG} className='shrink-0 text-destructive' />
								{t(AdminKey.INCONSISTENT_USERS_HEADER)} ({allConsistency.inconsistentUsers})
							</span>
						</AccordionTrigger>
						<AccordionContent className='px-4 pb-4'>
							<p className='mb-4 text-sm text-muted-foreground'>{t(AdminKey.USERS_WITH_INCONSISTENCIES_DESC)}</p>
							<DataTableCard<ConsistencyResultRow>
								hideHeader
								header={{
									title: '',
									description: null,
									pagination: null,
								}}
								columns={consistencyColumns}
								data={inconsistentRows}
								getRowKey={row => row.userId}
								emptyState={{
									title: t(AdminKey.NO_INCONSISTENT_USERS_TITLE),
									description: t(AdminKey.NO_INCONSISTENT_USERS_DESCRIPTION),
								}}
							/>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			)}

			{/* User Details Card */}
			{selectedUserId && (
				<SectionCard
					title={t(AdminKey.USER_CONSISTENCY_DETAILS)}
					icon={UsersIcon}
					description={t(AdminKey.DETAILED_CONSISTENCY_DESC)}
				>
					{userConsistencyLoading ? (
						<Skeleton variant={SkeletonVariant.Card} />
					) : userConsistency ? (
						<div className='space-y-4'>
							<div className='flex items-center gap-2'>
								{userConsistency.isConsistent ? (
									<CheckCircle2
										className={consistencyStatusVariants({
											status: 'consistent',
											target: 'icon',
										})}
									/>
								) : (
									<XCircle
										className={consistencyStatusVariants({
											status: 'inconsistent',
											target: 'icon',
										})}
									/>
								)}
								<Badge
									variant={VariantBase.OUTLINE}
									className={consistencyStatusVariants({
										status: userConsistency.isConsistent ? 'consistent' : 'inconsistent',
										target: 'badge',
									})}
								>
									{userConsistency.isConsistent ? t(AdminKey.CONSISTENT) : t(AdminKey.INCONSISTENT)}
								</Badge>
							</div>

							{!userConsistency.isConsistent && (
								<div className='space-y-2'>
									<div className='text-sm font-semibold'>{t(AdminKey.DISCREPANCIES)}</div>
									<div className='grid grid-cols-2 gap-4 text-sm'>
										{CONSISTENCY_DISCREPANCY_FIELDS.map(key => {
											const d = userConsistency.discrepancies[key];
											return (
												<div key={key}>
													<div className='font-medium'>{formatTitle(key)}</div>
													<div>
														{t(AdminKey.EXPECTED)}: {d.expected} | {t(AdminKey.ACTUAL)}: {d.actual}
													</div>
												</div>
											);
										})}
									</div>

									{(userConsistency.discrepancies.topicStats.inconsistent.length > 0 ||
										userConsistency.discrepancies.difficultyStats.inconsistent.length > 0) && (
										<div className='space-y-2'>
											{userConsistency.discrepancies.topicStats.inconsistent.length > 0 && (
												<div>
													<div className='text-sm font-semibold'>{t(AdminKey.INCONSISTENT_TOPICS)}</div>
													<div className='flex flex-wrap gap-2'>
														{userConsistency.discrepancies.topicStats.inconsistent.map((topic: string) => (
															<Badge
																key={topic}
																variant={VariantBase.OUTLINE}
																className='text-destructive border-destructive'
															>
																{formatTitle(topic)}
															</Badge>
														))}
													</div>
												</div>
											)}
											{userConsistency.discrepancies.difficultyStats.inconsistent.length > 0 && (
												<div>
													<div className='text-sm font-semibold'>{t(AdminKey.INCONSISTENT_DIFFICULTIES)}</div>
													<div className='flex flex-wrap gap-2'>
														{userConsistency.discrepancies.difficultyStats.inconsistent.map((difficulty: string) => (
															<Badge
																key={difficulty}
																variant={VariantBase.OUTLINE}
																className='text-destructive border-destructive'
															>
																{difficulty}
															</Badge>
														))}
													</div>
												</div>
											)}
										</div>
									)}

									<Button
										variant={VariantBase.DEFAULT}
										onClick={() => handleFixUser(selectedUserId)}
										disabled={fixConsistency.isPending}
										className='w-full'
									>
										{!fixConsistency.isPending ? (
											<>
												<RefreshCw className='h-4 w-4 me-2' />
												{t(AdminKey.FIX_CONSISTENCY)}
											</>
										) : (
											<>
												<RefreshCw className='h-4 w-4 me-2 animate-spin-slow' />
												{t(AdminKey.FIXING)}
											</>
										)}
									</Button>
								</div>
							)}
						</div>
					) : null}
				</SectionCard>
			)}
		</div>
	);
}
