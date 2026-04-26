import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';

import { TIME_PERIODS_MS, VALIDATION_COUNT } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import {
	AlertVariant,
	ButtonSize,
	ComponentSize,
	EMPTY_STATE_LUCIDE_ICON,
	HomeKey,
	QUERY_KEYS,
	UiDensity,
	VariantBase,
} from '@/constants';
import type { HomePublicLobbiesPanelProps } from '@/types';
import { fetchPublicWaitingMultiplayerRooms } from '@/services';
import { cn } from '@/utils';
import { Alert, AlertDescription, Button, EmptyState, Input, Label, PublicLobbyRoomCard, Spinner } from '@/components';
import { useAppSelector, useDebouncedValue, useIsAuthenticated } from '@/hooks';
import { selectLocale } from '@/redux/selectors';

export function HomePublicLobbiesPanel({ isActive = true }: HomePublicLobbiesPanelProps) {
	const { t } = useTranslation(['home', 'game']);
	const isAuthenticated = useIsAuthenticated();
	const siteLocale = useAppSelector(selectLocale);
	const [searchInput, setSearchInput] = useState('');
	const debouncedSearch = useDebouncedValue(searchInput, TIME_PERIODS_MS.FOUR_HUNDRED_MILLISECONDS);

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
		queryKey: QUERY_KEYS.multiplayer.publicWaiting(
			debouncedSearch,
			VALIDATION_COUNT.MULTIPLAYER_PUBLIC_LOBBY_LIST.LIMIT,
			siteLocale
		),
		queryFn: ({ signal }) =>
			fetchPublicWaitingMultiplayerRooms({
				topic: debouncedSearch,
				outputLanguage: siteLocale,
				limit: VALIDATION_COUNT.MULTIPLAYER_PUBLIC_LOBBY_LIST.LIMIT,
				signal,
			}),
		enabled: isActive,
		refetchInterval: isActive ? TIME_PERIODS_MS.FIVE_SECONDS : false,
		refetchOnWindowFocus: isActive,
		staleTime: TIME_PERIODS_MS.TWO_SECONDS,
	});

	const hasSearchQuery = searchInput.trim() !== '';
	const isListEmpty = !isLoading && data?.length === 0;
	const showTopicFilter = !isListEmpty || hasSearchQuery;

	return (
		<div className={cn('flex flex-col gap-3', showTopicFilter && 'lg:flex-row lg:items-start lg:gap-6 xl:gap-8')}>
			{showTopicFilter ? (
				<div className='w-full shrink-0 space-y-1.5 lg:max-w-[18rem] xl:max-w-[20rem]'>
					<Label htmlFor='public-lobby-search' className='text-sm font-medium'>
						{t(HomeKey.PUBLIC_LOBBY_SEARCH_LABEL)}
					</Label>
					<Input
						id='public-lobby-search'
						value={searchInput}
						onChange={e => setSearchInput(e.target.value)}
						placeholder={t(HomeKey.PUBLIC_LOBBY_SEARCH_PLACEHOLDER)}
						className='h-9 w-full py-1.5 text-sm'
						autoComplete='off'
					/>
				</div>
			) : null}

			<div className={cn('min-w-0 flex-1 space-y-3', !showTopicFilter && 'w-full')}>
				{isError && (
					<Alert
						variant={AlertVariant.DESTRUCTIVE}
						className='items-start gap-2 py-2.5 ps-3 pe-2.5 text-sm [&_svg]:h-3.5 [&_svg]:w-3.5'
					>
						<AlertDescription className='flex w-full min-w-0 flex-1 flex-col gap-1.5 text-xs leading-snug sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:text-sm'>
							<span className='min-w-0 break-words'>
								{t(HomeKey.PUBLIC_LOBBY_LOAD_ERROR)}: {getErrorMessage(error)}
							</span>
							<Button
								type='button'
								variant={VariantBase.OUTLINE}
								size={ButtonSize.SM}
								className='h-8 shrink-0 self-stretch sm:self-center'
								onClick={() => void refetch()}
							>
								{t(HomeKey.TRY_AGAIN)}
							</Button>
						</AlertDescription>
					</Alert>
				)}

				{isLoading && !data ? (
					<div className='flex justify-center py-8'>
						<Spinner size={ComponentSize.MD} className='text-primary' />
					</div>
				) : null}

				{!isLoading && !isError && data?.length === 0 ? (
					<EmptyState
						data='public lobbies'
						icon={debouncedSearch.trim() !== '' ? EMPTY_STATE_LUCIDE_ICON.searchNoResults : Users}
						title={t(HomeKey.PUBLIC_LOBBY_EMPTY_TITLE)}
						description={
							debouncedSearch.trim() !== '' ? t(HomeKey.PUBLIC_LOBBY_EMPTY_FILTERED) : t(HomeKey.PUBLIC_LOBBY_EMPTY)
						}
						density={UiDensity.COMPACT}
					/>
				) : null}

				{data && data.length > 0 ? (
					<div className='space-y-3'>
						{isFetching && !isLoading ? (
							<p className='text-center text-xs text-muted-foreground lg:text-start'>
								{t(HomeKey.PUBLIC_LOBBY_REFRESHING)}
							</p>
						) : null}
						{data.map(room => (
							<PublicLobbyRoomCard
								key={room.roomId}
								room={room}
								isAuthenticated={isAuthenticated}
								density={UiDensity.COMPACT}
							/>
						))}
					</div>
				) : null}
			</div>
		</div>
	);
}
