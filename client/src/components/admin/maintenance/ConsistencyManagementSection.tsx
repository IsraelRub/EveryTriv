import { useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Users as UsersIcon, XCircle } from 'lucide-react';

import {
	ButtonSize,
	ButtonVariant,
	SKELETON_HEIGHTS,
	SKELETON_WIDTHS,
	StatCardVariant,
	TextColor,
	VariantBase,
} from '@/constants';
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Skeleton,
	StatCard,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components';
import { useCheckAllUsersConsistency, useCheckUserStatsConsistency, useFixUserStatsConsistency } from '@/hooks';

export function ConsistencyManagementSection() {
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const { data: allConsistency, isLoading: allConsistencyLoading, refetch: refetchAll } = useCheckAllUsersConsistency();
	const {
		data: userConsistency,
		isLoading: userConsistencyLoading,
		refetch: refetchUser,
	} = useCheckUserStatsConsistency(selectedUserId, !!selectedUserId);
	const fixConsistency = useFixUserStatsConsistency();

	const handleCheckUser = (userId: string) => {
		setSelectedUserId(userId);
	};

	const handleFixUser = async (userId: string) => {
		try {
			await fixConsistency.mutateAsync(userId);
			await refetchUser();
			await refetchAll();
		} catch (error) {
			// Error is handled by the mutation
		}
	};

	return (
		<div className='space-y-8'>
			{/* Summary Card */}
			<Card className='border-primary/20 bg-primary/5'>
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
							{[...Array(4)].map((_, i) => (
								<Skeleton key={i} className={`${SKELETON_HEIGHTS.CARD} ${SKELETON_WIDTHS.FULL}`} />
							))}
						</div>
					) : allConsistency ? (
						<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
							<StatCard
								variant={StatCardVariant.CENTERED}
								icon={UsersIcon}
								label='Total Users'
								value={allConsistency.totalUsers.toLocaleString()}
								color={TextColor.BLUE_500}
							/>
							<StatCard
								variant={StatCardVariant.CENTERED}
								icon={UsersIcon}
								label='Users with Games'
								value={allConsistency.usersWithGames.toLocaleString()}
								color={TextColor.GREEN_500}
							/>
							<StatCard
								variant={StatCardVariant.CENTERED}
								icon={CheckCircle2}
								label='Consistent Users'
								value={allConsistency.consistentUsers.toLocaleString()}
								color={TextColor.GREEN_500}
							/>
							<StatCard
								variant={StatCardVariant.CENTERED}
								icon={XCircle}
								label='Inconsistent Users'
								value={allConsistency.inconsistentUsers.toLocaleString()}
								color={TextColor.RED_500}
							/>
						</div>
					) : null}
				</CardContent>
			</Card>

			{/* Inconsistent Users Table */}
			{allConsistency && allConsistency.inconsistentUsers > 0 && (
				<Card className='border-muted bg-muted/20'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<AlertTriangle className='h-5 w-5 text-destructive' />
							Inconsistent Users ({allConsistency.inconsistentUsers})
						</CardTitle>
						<CardDescription>Users with data inconsistencies that need to be fixed</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>User ID</TableHead>
										<TableHead>Total Games</TableHead>
										<TableHead>Questions</TableHead>
										<TableHead>Correct Answers</TableHead>
										<TableHead>Total Score</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{allConsistency.results
										.filter((result: { isConsistent: boolean }) => !result.isConsistent)
										.slice(0, 20)
										.map(
											(result: {
												userId: string;
												isConsistent: boolean;
												discrepancies: {
													totalGames: { expected: number; actual: number };
													totalQuestionsAnswered: { expected: number; actual: number };
													correctAnswers: { expected: number; actual: number };
													totalScore: { expected: number; actual: number };
												};
											}) => (
												<TableRow key={result.userId}>
													<TableCell className='font-mono text-sm'>{result.userId.slice(0, 8)}...</TableCell>
													<TableCell>
														<div className='flex flex-col'>
															<span>Expected: {result.discrepancies.totalGames.expected}</span>
															<span className='text-destructive'>Actual: {result.discrepancies.totalGames.actual}</span>
														</div>
													</TableCell>
													<TableCell>
														<div className='flex flex-col'>
															<span>Expected: {result.discrepancies.totalQuestionsAnswered.expected}</span>
															<span className='text-destructive'>
																Actual: {result.discrepancies.totalQuestionsAnswered.actual}
															</span>
														</div>
													</TableCell>
													<TableCell>
														<div className='flex flex-col'>
															<span>Expected: {result.discrepancies.correctAnswers.expected}</span>
															<span className='text-destructive'>
																Actual: {result.discrepancies.correctAnswers.actual}
															</span>
														</div>
													</TableCell>
													<TableCell>
														<div className='flex flex-col'>
															<span>Expected: {result.discrepancies.totalScore.expected}</span>
															<span className='text-destructive'>Actual: {result.discrepancies.totalScore.actual}</span>
														</div>
													</TableCell>
													<TableCell>
														<div className='flex gap-2'>
															<Button
																variant={ButtonVariant.OUTLINE}
																size={ButtonSize.SM}
																onClick={() => handleCheckUser(result.userId)}
																disabled={userConsistencyLoading}
															>
																Check
															</Button>
															<Button
																variant={ButtonVariant.DEFAULT}
																size={ButtonSize.SM}
																onClick={() => handleFixUser(result.userId)}
																disabled={fixConsistency.isPending}
															>
																{fixConsistency.isPending ? <RefreshCw className='h-4 w-4 animate-spin-slow' /> : 'Fix'}
															</Button>
														</div>
													</TableCell>
												</TableRow>
											)
										)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}

			{/* User Details Card */}
			{selectedUserId && (
				<Card className='border-muted bg-muted/20'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<UsersIcon className='h-5 w-5' />
							User Consistency Details
						</CardTitle>
						<CardDescription>Detailed consistency check for selected user</CardDescription>
					</CardHeader>
					<CardContent>
						{userConsistencyLoading ? (
							<Skeleton className={`${SKELETON_HEIGHTS.CARD} ${SKELETON_WIDTHS.FULL}`} />
						) : userConsistency ? (
							<div className='space-y-4'>
								<div className='flex items-center gap-2'>
									{userConsistency.isConsistent ? (
										<>
											<CheckCircle2 className='h-5 w-5 text-green-500' />
											<Badge variant={VariantBase.OUTLINE} className='bg-green-500/10 text-green-500 border-green-500'>
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
											<div>
												<div className='font-medium'>Total Games</div>
												<div>
													Expected: {userConsistency.discrepancies.totalGames.expected} | Actual:{' '}
													{userConsistency.discrepancies.totalGames.actual}
												</div>
											</div>
											<div>
												<div className='font-medium'>Total Questions</div>
												<div>
													Expected: {userConsistency.discrepancies.totalQuestionsAnswered.expected} | Actual:{' '}
													{userConsistency.discrepancies.totalQuestionsAnswered.actual}
												</div>
											</div>
											<div>
												<div className='font-medium'>Correct Answers</div>
												<div>
													Expected: {userConsistency.discrepancies.correctAnswers.expected} | Actual:{' '}
													{userConsistency.discrepancies.correctAnswers.actual}
												</div>
											</div>
											<div>
												<div className='font-medium'>Total Score</div>
												<div>
													Expected: {userConsistency.discrepancies.totalScore.expected} | Actual:{' '}
													{userConsistency.discrepancies.totalScore.actual}
												</div>
											</div>
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
																	{topic}
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
											variant={ButtonVariant.DEFAULT}
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
