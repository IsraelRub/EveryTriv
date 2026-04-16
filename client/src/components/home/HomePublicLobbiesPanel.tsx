import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { TIME_PERIODS_MS, VALIDATION_COUNT } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { AlertVariant, ButtonSize, ComponentSize, HomeKey, QUERY_KEYS, VariantBase } from '@/constants';
import type { HomePublicLobbiesPanelProps } from '@/types';
import { fetchPublicWaitingMultiplayerRooms } from '@/services';
import { Alert, AlertDescription, Button, Input, Label, PublicLobbyRoomCard, Spinner } from '@/components';
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

	return (
		<div className='space-y-4'>
			<div className='space-y-2'>
				<Label htmlFor='public-lobby-search'>{t(HomeKey.PUBLIC_LOBBY_SEARCH_LABEL)}</Label>
				<Input
					id='public-lobby-search'
					value={searchInput}
					onChange={e => setSearchInput(e.target.value)}
					placeholder={t(HomeKey.PUBLIC_LOBBY_SEARCH_PLACEHOLDER)}
					className='max-w-md'
					autoComplete='off'
				/>
			</div>

			{isError && (
				<Alert variant={AlertVariant.DESTRUCTIVE}>
					<AlertDescription className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
						<span>
							{t(HomeKey.PUBLIC_LOBBY_LOAD_ERROR)}: {getErrorMessage(error)}
						</span>
						<Button type='button' variant={VariantBase.OUTLINE} size={ButtonSize.SM} onClick={() => void refetch()}>
							{t(HomeKey.TRY_AGAIN)}
						</Button>
					</AlertDescription>
				</Alert>
			)}

			{isLoading && !data ? (
				<div className='flex justify-center py-12'>
					<Spinner size={ComponentSize.LG} className='text-primary' />
				</div>
			) : null}

			{!isLoading && data?.length === 0 ? (
				<p className='py-8 text-center text-muted-foreground'>{t(HomeKey.PUBLIC_LOBBY_EMPTY)}</p>
			) : null}

			{data && data.length > 0 ? (
				<div className='space-y-6'>
					{isFetching && !isLoading ? (
						<p className='text-center text-xs text-muted-foreground'>{t(HomeKey.PUBLIC_LOBBY_REFRESHING)}</p>
					) : null}
					{data.map(room => (
						<PublicLobbyRoomCard key={room.roomId} room={room} isAuthenticated={isAuthenticated} />
					))}
				</div>
			) : null}
		</div>
	);
}
