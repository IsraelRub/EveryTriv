import { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, GamepadIcon, RefreshCw, Users as UsersIcon, XCircle } from 'lucide-react';

import { formatTitle } from '@shared/utils';

import {
	ButtonSize,
	Colors,
	SKELETON_PLACEHOLDER_COUNTS,
	SkeletonVariant,
	StatCardVariant,
	VariantBase,
} from '@/constants';
import {
	AlertIcon,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DataTableCard,
	Skeleton,
	StatCard,
} from '@/components';
import { useCheckAllUsersConsistency, useCheckUserStatsConsistency, useFixUserStatsConsistency } from '@/hooks';
import type { ConsistencyDiscrepancy, ConsistencyResultRow, DataTableColumn } from '@/types';
import { cn } from '@/utils';

const CONSISTENCY_DISCREPANCY_FIELDS: ReadonlyArray<keyof ConsistencyResultRow['discrepancies']> = [
	'totalGames',
	'totalQuestionsAnswered',
	'correctAnswers',
	'totalScore',
];

function DiscrepancyCell({ expected, actual }: ConsistencyDiscrepancy): JSX.Element {
	return (
		<div className='flex flex-col'>
			<span>Expected: {expected}</span>
			<span className='text-destructive'>Actual: {actual}</span>
		</div>
	);
}

export function ConsistencyManagementSection() {
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
			type: 'custom' as const,
			render: (row: ConsistencyResultRow) => <DiscrepancyCell {...row.discrepancies[key]} />,
		}));
		return [
			{
				id: 'userId',
				type: 'text',
				getValue: row => row.userId.slice(0, 8) + '...',
				cellClassName: 'font-mono text-sm',
			},
			...discrepancyColumns,
			{
				id: 'actions',
				emptyHeader: true,
				type: 'custom',
				render: row => (
					<div className='flex gap-2'>
						<Button
							variant={VariantBase.OUTLINE}
							size={ButtonSize.SM}
							onClick={() => setSelectedUserId(row.userId)}
							disabled={userConsistencyLoading}
						>
							Check
						</Button>
						<Button
							variant={VariantBase.DEFAULT}
							size={ButtonSize.SM}
							onClick={() => handleFixUser(row.userId)}
							disabled={fixConsistency.isPending}
						>
							{fixConsistency.isPending ? <RefreshCw className='h-4 w-4 animate-spin-slow' /> : 'Fix'}
						</Button>
					</div>
				),
			},
		];
	}, [handleFixUser, userConsistencyLoading, fixConsistency.isPending]);

	return (
		<div className='space-y-8'>
			{/* Summary Card */}
			<Card className='card-primary-tint'>
				<CardHeader>
					<CardTitle className='text-2xl font-bold flex items-center gap-2'>
						<CheckCircle2 className='h-6 w-6 text-primary' />
						Data Consistency Management
					</CardTitle>
					<CardDescription>Monitor and fix data consistency issues between user_stats and game_history</CardDescription>
				</CardHeader>
				<CardContent>
					{allConsistencyLoading ? (
						<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
							<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
						</div>
					) : allConsistency ? (
						<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
							<StatCard
								variant={StatCardVariant.CENTERED}
								icon={UsersIcon}
								label='Total Users'
								value={allConsistency.totalUsers.toLocaleString()}
								color={Colors.BLUE_500.text}
							/>
							<StatCard
								variant={StatCardVariant.CENTERED}
								icon={GamepadIcon}
								label='Users with Games'
								value={allConsistency.usersWithGames.toLocaleString()}
								color={Colors.GREEN_500.text}
							/>
							<StatCard
								variant={StatCardVariant.CENTERED}
								icon={CheckCircle2}
								label='Consistent Users'
								value={allConsistency.consistentUsers.toLocaleString()}
								color={Colors.GREEN_500.text}
							/>
							<StatCard
								variant={StatCardVariant.CENTERED}
								icon={XCircle}
								label='Inconsistent Users'
								value={allConsistency.inconsistentUsers.toLocaleString()}
								color={Colors.RED_500.text}
							/>
						</div>
					) : null}
				</CardContent>
			</Card>

			{/* Inconsistent Users Table */}
			{allConsistency && allConsistency.inconsistentUsers > 0 && (
				<DataTableCard<ConsistencyResultRow>
					header={{
						title: (
							<CardTitle className='flex items-center gap-2'>
								<AlertIcon size='lg' className='text-destructive' />
								Inconsistent Users ({allConsistency.inconsistentUsers})
							</CardTitle>
						),
						description: <CardDescription>Users with data inconsistencies that need to be fixed</CardDescription>,
						pagination: null,
					}}
					columns={consistencyColumns}
					data={inconsistentRows}
					getRowKey={row => row.userId}
					emptyState={{
						title: 'No inconsistent users on this page',
						description: 'Run a full check to refresh the list.',
					}}
				/>
			)}

			{/* User Details Card */}
			{selectedUserId && (
				<Card className='card-muted-tint'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<UsersIcon className='h-5 w-5 text-primary' />
							User Consistency Details
						</CardTitle>
						<CardDescription>Detailed consistency check for selected user</CardDescription>
					</CardHeader>
					<CardContent>
						{userConsistencyLoading ? (
							<Skeleton variant={SkeletonVariant.Card} />
						) : userConsistency ? (
							<div className='space-y-4'>
								<div className='flex items-center gap-2'>
									{userConsistency.isConsistent ? (
										<>
											<CheckCircle2 className={cn('h-5 w-5', Colors.GREEN_500.text)} />
											<Badge
												variant={VariantBase.OUTLINE}
												className={cn(`${Colors.GREEN_500.bg}/10`, Colors.GREEN_500.border, Colors.GREEN_500.text)}
											>
												Consistent
											</Badge>
										</>
									) : (
										<>
											<XCircle className='h-5 w-5 text-destructive' />
											<Badge
												variant={VariantBase.OUTLINE}
												className='bg-destructive/10 text-destructive border-destructive'
											>
												Inconsistent
											</Badge>
										</>
									)}
								</div>

								{!userConsistency.isConsistent && (
									<div className='space-y-2'>
										<div className='text-sm font-semibold'>Discrepancies:</div>
										<div className='grid grid-cols-2 gap-4 text-sm'>
											{CONSISTENCY_DISCREPANCY_FIELDS.map(key => {
												const d = userConsistency.discrepancies[key];
												return (
													<div key={key}>
														<div className='font-medium'>{formatTitle(key)}</div>
														<div>
															Expected: {d.expected} | Actual: {d.actual}
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
														<div className='text-sm font-semibold'>Inconsistent Topics:</div>
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
														<div className='text-sm font-semibold'>Inconsistent Difficulties:</div>
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
													<RefreshCw className='h-4 w-4 mr-2 animate-spin-slow' />
													Fixing...
												</>
											) : (
												<>
													<RefreshCw className='h-4 w-4 mr-2' />
													Fix Consistency
												</>
											)}
										</Button>
									</div>
								)}
							</div>
						) : null}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
