import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cva } from 'class-variance-authority';
import { CheckCircle2, Database, GamepadIcon, RefreshCw, Users as UsersIcon, XCircle } from 'lucide-react';

import { VALIDATION_LENGTH } from '@shared/constants';
import { formatTitle, truncateWithEllipsis } from '@shared/utils';

import {
	AdminKey,
	AlertIconSize,
	ButtonSize,
	Colors,
	SKELETON_PLACEHOLDER_COUNTS,
	SkeletonVariant,
	StatCardVariant,
	VariantBase,
} from '@/constants';
import {
	DataTableColumnType,
	type ConsistencyDiscrepancy,
	type ConsistencyResultRow,
	type DataTableColumn,
} from '@/types';
import { cn } from '@/utils';
import {
	AlertIcon,
	Badge,
	Button,
	CardDescription,
	CardTitle,
	DataTableCard,
	SectionCard,
	Skeleton,
	StatCard,
} from '@/components';
import { useCheckAllUsersConsistency, useCheckUserStatsConsistency, useFixUserStatsConsistency } from '@/hooks';

const consistencyStatusVariants = cva('', {
	variants: {
		status: { consistent: '', inconsistent: '' },
		target: { icon: 'h-5 w-5', badge: '' },
	},
	compoundVariants: [
		{ status: 'consistent', target: 'icon', class: Colors.GREEN_500.text },
		{ status: 'inconsistent', target: 'icon', class: 'text-destructive' },
		{
			status: 'consistent',
			target: 'badge',
			class: cn(`${Colors.GREEN_500.bg}/10`, Colors.GREEN_500.border, Colors.GREEN_500.text),
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
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const { data: allConsistency, isLoading: allConsistencyLoading, refetch: refetchAll } = useCheckAllUsersConsistency();
	const {
		data: userConsistency,
		isLoading: userConsistencyLoading,
		refetch: refetchUser,
	} = useCheckUserStatsConsistency(selectedUserId, !!selectedUserId);
	const fixConsistency = useFixUserStatsConsistency();

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
		return allConsistency.results.filter(r => !r.isConsistent).slice(0, 20);
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
							{fixConsistency.isPending ? <RefreshCw className='h-4 w-4 animate-spin-slow' /> : t(AdminKey.FIX)}
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
							color={Colors.BLUE_500.text}
						/>
						<StatCard
							variant={StatCardVariant.CENTERED}
							icon={GamepadIcon}
							label={t(AdminKey.USERS_WITH_GAMES)}
							value={allConsistency.usersWithGames.toLocaleString()}
							color={Colors.GREEN_500.text}
						/>
						<StatCard
							variant={StatCardVariant.CENTERED}
							icon={CheckCircle2}
							label={t(AdminKey.CONSISTENT_USERS)}
							value={allConsistency.consistentUsers.toLocaleString()}
							color={Colors.GREEN_500.text}
						/>
						<StatCard
							variant={StatCardVariant.CENTERED}
							icon={XCircle}
							label={t(AdminKey.INCONSISTENT_USERS)}
							value={allConsistency.inconsistentUsers.toLocaleString()}
							color={Colors.RED_500.text}
						/>
					</div>
				) : null}
			</SectionCard>

			{/* Inconsistent Users Table */}
			{allConsistency && allConsistency.inconsistentUsers > 0 && (
				<DataTableCard<ConsistencyResultRow>
					header={{
						title: (
							<CardTitle className='flex items-center gap-2'>
								<AlertIcon size={AlertIconSize.LG} className='text-destructive' />
								{t(AdminKey.INCONSISTENT_USERS_HEADER)} ({allConsistency.inconsistentUsers})
							</CardTitle>
						),
						description: <CardDescription>{t(AdminKey.USERS_WITH_INCONSISTENCIES_DESC)}</CardDescription>,
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
										{fixConsistency.isPending ? (
											<>
												<RefreshCw className='h-4 w-4 me-2 animate-spin-slow' />
												{t(AdminKey.FIXING)}
											</>
										) : (
											<>
												<RefreshCw className='h-4 w-4 me-2' />
												{t(AdminKey.FIX_CONSISTENCY)}
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
