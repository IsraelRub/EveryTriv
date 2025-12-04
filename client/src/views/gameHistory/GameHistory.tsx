import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Clock, Loader2, Medal, Trash2 } from 'lucide-react';

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
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components';
import { ButtonSize } from '@/constants';
import { useClearGameHistory, useDeleteGameHistory, useGameHistory, useToast } from '@/hooks';

function getDifficultyColor(difficulty: string): string {
	switch (difficulty?.toLowerCase()) {
		case 'easy':
			return 'bg-green-500/10 text-green-500 border-green-500/30';
		case 'medium':
			return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
		case 'hard':
			return 'bg-red-500/10 text-red-500 border-red-500/30';
		default:
			return 'bg-muted text-muted-foreground';
	}
}

function formatDate(date: Date | string): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	return dateObj.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

function formatDuration(seconds: number): string {
	if (!seconds) return '-';
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function GameHistory() {
	const navigate = useNavigate();
	const { toast } = useToast();

	const [showClearDialog, setShowClearDialog] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const { data: historyData, isLoading, error } = useGameHistory(50, 0);
	const deleteHistory = useDeleteGameHistory();
	const clearHistory = useClearGameHistory();

	const records = Array.isArray(historyData) ? historyData : [];

	const handleDelete = async (gameId: string) => {
		try {
			await deleteHistory.mutateAsync(gameId);
			toast({
				title: 'Game Deleted',
				description: 'The game record has been removed from your history.',
			});
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to delete game record.',
				variant: 'destructive',
			});
		} finally {
			setDeleteId(null);
		}
	};

	const handleClearAll = async () => {
		try {
			const result = await clearHistory.mutateAsync();
			toast({
				title: 'History Cleared',
				description: `${result.deletedCount} game records have been removed.`,
			});
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to clear game history.',
				variant: 'destructive',
			});
		} finally {
			setShowClearDialog(false);
		}
	};

	// Loading state
	if (isLoading) {
		return (
			<motion.main
				role='main'
				aria-label='Game History Loading'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className='min-h-screen py-12 px-4'
			>
				<div className='max-w-4xl mx-auto space-y-8'>
					<div className='text-center'>
						<Skeleton className='h-10 w-48 mx-auto mb-2' />
						<Skeleton className='h-5 w-64 mx-auto' />
					</div>
					<Card className='p-6'>
						<div className='space-y-4'>
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className='h-12 w-full' />
							))}
						</div>
					</Card>
				</div>
			</motion.main>
		);
	}

	// Error state
	if (error) {
		return (
			<motion.main
				role='main'
				aria-label='Game History Error'
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className='min-h-screen py-12 px-4'
			>
				<div className='max-w-4xl mx-auto text-center'>
					<AlertTriangle className='h-16 w-16 text-destructive mx-auto mb-4' />
					<h1 className='text-2xl font-bold mb-2'>Failed to Load History</h1>
					<p className='text-muted-foreground mb-6'>Unable to fetch your game history. Please try again later.</p>
					<Button onClick={() => navigate('/')}>Return Home</Button>
				</div>
			</motion.main>
		);
	}

	// Empty state
	if (records.length === 0) {
		return (
			<motion.main
				role='main'
				aria-label='Game History Empty'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='min-h-screen py-12 px-4'
			>
				<div className='max-w-4xl mx-auto text-center'>
					<Medal className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
					<h1 className='text-3xl font-bold mb-2'>No Games Yet</h1>
					<p className='text-muted-foreground mb-6'>
						Start playing trivia games to build your history and track your progress!
					</p>
					<Button size={ButtonSize.LG} onClick={() => navigate('/')}>
						Play Now
					</Button>
				</div>
			</motion.main>
		);
	}

	// Calculate stats
	const totalGames = records.length;
	const totalScore = records.reduce((sum, r) => sum + (r.score || 0), 0);
	const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
	const bestScore = Math.max(...records.map(r => r.score || 0));

	return (
		<motion.main
			role='main'
			aria-label='Game History'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className='min-h-screen py-12 px-4'
		>
			<div className='max-w-5xl mx-auto space-y-8'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold mb-2'>Game History</h1>
						<p className='text-muted-foreground'>View your past performances and stats</p>
					</div>
					{records.length > 0 && (
						<Button variant='destructive' size={ButtonSize.SM} onClick={() => setShowClearDialog(true)}>
							<Trash2 className='h-4 w-4 mr-2' />
							Clear All
						</Button>
					)}
				</div>

				{/* Stats Summary */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
					<Card>
						<CardHeader className='pb-2'>
							<CardDescription>Total Games</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='text-3xl font-bold'>{totalGames}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='pb-2'>
							<CardDescription>Average Score</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='text-3xl font-bold'>{avgScore}</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='pb-2'>
							<CardDescription>Best Score</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='text-3xl font-bold text-primary'>{bestScore}</div>
						</CardContent>
					</Card>
				</div>

				{/* History Table */}
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Clock className='h-5 w-5' />
							Recent Games
						</CardTitle>
						<CardDescription>Your last {totalGames} trivia sessions</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>
										<div className='flex items-center gap-2'>
											<Calendar className='h-4 w-4' />
											Date
										</div>
									</TableHead>
									<TableHead>Topic</TableHead>
									<TableHead>Difficulty</TableHead>
									<TableHead>Score</TableHead>
									<TableHead>Questions</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead className='w-10'></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{records.map(record => (
									<TableRow key={record.id}>
										<TableCell className='font-medium'>
											{record.createdAt ? formatDate(record.createdAt) : '-'}
										</TableCell>
										<TableCell>{record.topic || 'General'}</TableCell>
										<TableCell>
											<Badge variant='outline' className={getDifficultyColor(record.difficulty || '')}>
												{record.difficulty || 'Unknown'}
											</Badge>
										</TableCell>
										<TableCell>
											<span className='font-bold text-primary'>{record.score || 0}</span>
										</TableCell>
										<TableCell>
											{record.correctAnswers || 0}/{record.gameQuestionCount || 0}
										</TableCell>
										<TableCell>{formatDuration(record.timeSpent || 0)}</TableCell>
										<TableCell>
											<Button
												variant='ghost'
												size={ButtonSize.ICON}
												className='h-8 w-8 text-muted-foreground hover:text-destructive'
												onClick={() => setDeleteId(record.id)}
												disabled={deleteHistory.isPending}
											>
												{deleteHistory.isPending && deleteId === record.id ? (
													<Loader2 className='h-4 w-4 animate-spin' />
												) : (
													<Trash2 className='h-4 w-4' />
												)}
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

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
							This will permanently delete all {totalGames} game records. This action cannot be undone.
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
									<Loader2 className='h-4 w-4 mr-2 animate-spin' />
									Clearing...
								</>
							) : (
								'Clear All'
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</motion.main>
	);
}
