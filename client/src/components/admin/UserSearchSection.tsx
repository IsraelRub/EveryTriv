import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

import { TimePeriod } from '@shared/constants';

import { ButtonVariant, SpinnerSize, VALIDATION_MESSAGES } from '@/constants';
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Skeleton,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	UserActivityTab,
	UserComparisonTab,
	UserInsightsTab,
	UserOverviewTab,
	UserPerformanceTab,
	UserProgressTab,
	UserStatisticsTab,
	UserTrendsTab,
} from '@/components';
import { useUserSummaryById } from '@/hooks';
import { clientLogger as logger } from '@/services';

export function UserSearchSection() {
	const [searchUserId, setSearchUserId] = useState('');
	const [activeUserId, setActiveUserId] = useState<string | null>(null);
	const [trendsPeriod, setTrendsPeriod] = useState<TimePeriod>(TimePeriod.DAILY);

	useEffect(() => {
		if (activeUserId) {
			setSearchUserId(activeUserId);
			setTrendsPeriod(TimePeriod.DAILY);
		}
	}, [activeUserId]);

	const { data: userSummary, isLoading: userLoading } = useUserSummaryById(
		activeUserId ?? '',
		false,
		activeUserId !== null
	);

	const handleSearch = () => {
		if (!searchUserId.trim()) {
			logger.userError(VALIDATION_MESSAGES.USER_ID_REQUIRED);
			return;
		}
		const trimmedUserId = searchUserId.trim();
		if (trimmedUserId === activeUserId) {
			return;
		}
		setActiveUserId(trimmedUserId);
	};

	const handleClear = () => {
		setActiveUserId(null);
		setSearchUserId('');
	};

	const summaryData = userSummary?.data;
	const isDataForActiveUser = activeUserId && summaryData && summaryData.user?.userId === activeUserId;

	if (!activeUserId || !isDataForActiveUser) {
		if (activeUserId && userLoading) {
			return (
				<div className='space-y-6'>
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
									{userLoading ? <Spinner size={SpinnerSize.SM} variant='refresh' /> : 'Search'}
								</Button>
								{activeUserId && (
									<Button onClick={handleClear} variant={ButtonVariant.OUTLINE} disabled={userLoading}>
										<X className='h-4 w-4' />
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
					<div className='space-y-4'>
						{[...Array(4)].map((_, i) => (
							<Skeleton key={i} className='h-24 w-full' />
						))}
					</div>
				</div>
			);
		}
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
							{userLoading ? <Spinner size={SpinnerSize.SM} variant='refresh' /> : 'Search'}
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
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
							{userLoading ? <Spinner size={SpinnerSize.SM} variant='refresh' /> : 'Search'}
						</Button>
						{activeUserId && (
							<Button onClick={handleClear} variant={ButtonVariant.OUTLINE} disabled={userLoading}>
								<X className='h-4 w-4' />
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{isDataForActiveUser && activeUserId && (
				<Tabs key={activeUserId} defaultValue='overview' className='w-full'>
					<TabsList className='grid w-full grid-cols-8'>
						<TabsTrigger value='overview'>Overview</TabsTrigger>
						<TabsTrigger value='statistics'>Statistics</TabsTrigger>
						<TabsTrigger value='performance'>Performance</TabsTrigger>
						<TabsTrigger value='progress'>Progress</TabsTrigger>
						<TabsTrigger value='activity'>Activity</TabsTrigger>
						<TabsTrigger value='trends'>Trends</TabsTrigger>
						<TabsTrigger value='comparison'>Comparison</TabsTrigger>
						<TabsTrigger value='insights'>Insights</TabsTrigger>
					</TabsList>

					<TabsContent value='overview' className='mt-6 space-y-6'>
						<UserOverviewTab activeUserId={activeUserId} />
					</TabsContent>

					<TabsContent value='statistics' className='mt-6 space-y-6'>
						<UserStatisticsTab activeUserId={activeUserId} />
					</TabsContent>

					<TabsContent value='performance' className='mt-6 space-y-6'>
						<UserPerformanceTab activeUserId={activeUserId} />
					</TabsContent>

					<TabsContent value='progress' className='mt-6 space-y-6'>
						<UserProgressTab activeUserId={activeUserId} trendsPeriod={trendsPeriod} />
					</TabsContent>

					<TabsContent value='activity' className='mt-6 space-y-6'>
						<UserActivityTab activeUserId={activeUserId} />
					</TabsContent>

					<TabsContent value='trends' className='mt-6 space-y-6'>
						<UserTrendsTab activeUserId={activeUserId} />
					</TabsContent>

					<TabsContent value='comparison' className='mt-6 space-y-6'>
						<UserComparisonTab activeUserId={activeUserId} />
					</TabsContent>

					<TabsContent value='insights' className='mt-6 space-y-6'>
						<UserInsightsTab activeUserId={activeUserId} />
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
