import { ElementType, useState } from 'react';

import { motion } from 'framer-motion';
import { Activity, GamepadIcon, RefreshCw, Search, TrendingUp, Trophy } from 'lucide-react';

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/components';
import { Badge } from '@/components/ui/badge';
import { useGlobalStats, useRealTimeAnalytics, useToast, useUserSummaryById } from '@/hooks';

function StatCard({
	icon: Icon,
	label,
	value,
	trend,
	trendUp,
	color,
	isLoading,
}: {
	icon: ElementType;
	label: string;
	value: string | number;
	trend?: string;
	trendUp?: boolean;
	color: string;
	isLoading?: boolean;
}) {
	if (isLoading) {
		return (
			<Card className='p-6'>
				<div className='flex items-center justify-between mb-4'>
					<Skeleton className='h-8 w-8 rounded' />
				</div>
				<Skeleton className='h-8 w-24 mb-1' />
				<Skeleton className='h-4 w-20' />
			</Card>
		);
	}

	return (
		<Card className='p-6'>
			<div className='flex items-center justify-between mb-4'>
				<Icon className={`w-8 h-8 ${color}`} />
				{trend && (
					<Badge variant={trendUp ? 'default' : 'secondary'} className='text-xs'>
						<TrendingUp className={`h-3 w-3 mr-1 ${trendUp ? '' : 'rotate-180'}`} />
						{trend}
					</Badge>
				)}
			</div>
			<div className='text-3xl font-bold mb-1'>{value}</div>
			<div className='text-sm text-muted-foreground'>{label}</div>
		</Card>
	);
}

function UserSearchSection() {
	const { toast } = useToast();
	const [searchUserId, setSearchUserId] = useState('');
	const [activeUserId, setActiveUserId] = useState<string | null>(null);

	const { data: userSummary, isLoading: userLoading } = useUserSummaryById(activeUserId || '', activeUserId !== null);

	const handleSearch = () => {
		if (!searchUserId.trim()) {
			toast({
				title: 'Error',
				description: 'Please enter a user ID',
				variant: 'destructive',
			});
			return;
		}
		setActiveUserId(searchUserId.trim());
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Search className='h-5 w-5' />
					User Lookup
				</CardTitle>
				<CardDescription>Search for a user by their ID</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='flex gap-2'>
					<Input
						placeholder='Enter user ID...'
						value={searchUserId}
						onChange={e => setSearchUserId(e.target.value)}
						onKeyDown={e => e.key === 'Enter' && handleSearch()}
					/>
					<Button onClick={handleSearch} disabled={userLoading}>
						{userLoading ? <RefreshCw className='h-4 w-4 animate-spin' /> : 'Search'}
					</Button>
				</div>

				{activeUserId && userSummary?.data && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className='p-4 rounded-lg bg-muted/50 space-y-3'
					>
						<div className='flex items-center justify-between'>
							<span className='font-medium'>User ID</span>
							<span className='text-sm text-muted-foreground'>{userSummary.data.user.userId}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-medium'>Email</span>
							<span className='text-sm'>{userSummary.data.user.email || 'N/A'}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-medium'>Total Games</span>
							<span className='text-sm'>{userSummary.data.highlights.totalGames || 0}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-medium'>Best Score</span>
							<span className='text-sm'>{userSummary.data.highlights.bestScore || 0}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-medium'>Credits</span>
							<span className='text-sm'>{userSummary.data.user.credits || 0}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='font-medium'>Account Age</span>
							<span className='text-sm'>{Math.round(userSummary.data.user.accountAge / 365)} days</span>
						</div>
					</motion.div>
				)}
			</CardContent>
		</Card>
	);
}

export function AdminDashboard() {
	const { data: globalStats, isLoading: statsLoading, refetch } = useGlobalStats();
	const { data: realTimeData, isLoading: realTimeLoading } = useRealTimeAnalytics();

	const stats = [
		{
			icon: Trophy,
			label: 'Success Rate',
			value: `${Math.round(globalStats?.successRate || 0)}%`,
			color: 'text-blue-500',
		},
		{
			icon: GamepadIcon,
			label: 'Average Games',
			value: globalStats?.averageGames?.toLocaleString() || '0',
			color: 'text-green-500',
		},
		{
			icon: Activity,
			label: 'Average Game Time',
			value: `${Math.round((globalStats?.averageGameTime || 0) / 60)}m`,
			color: 'text-yellow-500',
		},
		{
			icon: TrendingUp,
			label: 'Consistency',
			value: `${Math.round(globalStats?.consistency || 0)}%`,
			color: 'text-purple-500',
		},
	];

	return (
		<motion.main
			role='main'
			aria-label='Admin Dashboard'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className='min-h-screen py-12 px-4'
		>
			<div className='max-w-7xl mx-auto space-y-8'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-4xl font-bold mb-2'>Admin Dashboard</h1>
						<p className='text-muted-foreground'>Overview of platform statistics</p>
					</div>
					<Button variant='outline' onClick={() => refetch()} disabled={statsLoading}>
						<RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
						Refresh
					</Button>
				</div>

				{/* Stats Cards */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					{stats.map((stat, index) => (
						<motion.div
							key={stat.label}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<StatCard {...stat} isLoading={statsLoading} />
						</motion.div>
					))}
				</div>

				<Tabs defaultValue='overview' className='w-full'>
					<TabsList>
						<TabsTrigger value='overview'>Overview</TabsTrigger>
						<TabsTrigger value='users'>Users</TabsTrigger>
						<TabsTrigger value='realtime'>Real-time</TabsTrigger>
					</TabsList>

					<TabsContent value='overview' className='mt-6 space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<Card>
								<CardHeader>
									<CardTitle>Platform Statistics</CardTitle>
									<CardDescription>Overall platform performance</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									{statsLoading ? (
										<div className='space-y-3'>
											{[...Array(4)].map((_, i) => (
												<Skeleton key={i} className='h-6 w-full' />
											))}
										</div>
									) : (
										<>
											<div className='flex justify-between items-center'>
												<span>Success Rate</span>
												<span className='font-bold'>{Math.round(globalStats?.successRate || 0)}%</span>
											</div>
											<div className='flex justify-between items-center'>
												<span>Average Games</span>
												<span className='font-bold'>{globalStats?.averageGames?.toLocaleString() || '0'}</span>
											</div>
											<div className='flex justify-between items-center'>
												<span>Average Game Time</span>
												<span className='font-bold'>{Math.round((globalStats?.averageGameTime || 0) / 60)}m</span>
											</div>
											<div className='flex justify-between items-center'>
												<span>Consistency</span>
												<span className='font-bold'>{Math.round(globalStats?.consistency || 0)}%</span>
											</div>
										</>
									)}
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Top Topics</CardTitle>
									<CardDescription>Most played trivia categories</CardDescription>
								</CardHeader>
								<CardContent>
									{statsLoading ? (
										<div className='space-y-3'>
											{[...Array(5)].map((_, i) => (
												<Skeleton key={i} className='h-6 w-full' />
											))}
										</div>
									) : (
										<p className='text-muted-foreground text-center py-4'>No topic data available</p>
									)}
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value='users' className='mt-6'>
						<UserSearchSection />
					</TabsContent>

					<TabsContent value='realtime' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Activity className='h-5 w-5 text-green-500' />
									Real-time Activity
								</CardTitle>
								<CardDescription>Live platform activity</CardDescription>
							</CardHeader>
							<CardContent>
								{realTimeLoading ? (
									<div className='space-y-3'>
										{[...Array(4)].map((_, i) => (
											<Skeleton key={i} className='h-6 w-full' />
										))}
									</div>
								) : realTimeData ? (
									<div className='space-y-4'>
										<div className='flex justify-between items-center'>
											<span>Active Sessions</span>
											<Badge variant='default'>{realTimeData.game?.totalGames || 0}</Badge>
										</div>
										<div className='flex justify-between items-center'>
											<span>Games in Progress</span>
											<Badge variant='secondary'>{realTimeData.game?.totalQuestionsAnswered || 0}</Badge>
										</div>
										<div className='flex justify-between items-center'>
											<span>Success Rate (Today)</span>
											<span className='font-bold'>{Math.round(realTimeData.game?.successRate || 0)}%</span>
										</div>
									</div>
								) : (
									<p className='text-muted-foreground text-center py-4'>No real-time data available</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</motion.main>
	);
}
