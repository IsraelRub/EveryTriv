import { useTranslation } from 'react-i18next';

import { formatDate } from '@shared/utils';

import { LegalKey } from '@/constants';
import type { LegalPageLayoutProps } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components';

export function LegalPageLayout({ icon, titleKey, children }: LegalPageLayoutProps) {
	const { t } = useTranslation('legal');
	return (
		<main className='view-main animate-fade-in-up-simple'>
			<div className='view-content-4xl'>
				<Card className='flex-1 flex flex-col overflow-hidden'>
					<CardHeader className='flex-shrink-0'>
						<div className='flex items-center gap-3 mb-2'>
							{icon}
							<CardTitle className='text-3xl md:text-4xl font-bold'>{t(titleKey)}</CardTitle>
						</div>
						<p className='text-sm md:text-base text-muted-foreground'>
							{t(LegalKey.LAST_UPDATED)} {formatDate(new Date())}
						</p>
					</CardHeader>
					<CardContent className='view-spacing-legal view-scroll-inline'>{children}</CardContent>
				</Card>
			</div>
		</main>
	);
}
