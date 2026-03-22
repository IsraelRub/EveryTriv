import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

import { formatDate } from '@shared/utils';

import { ButtonSize, LegalKey, VariantBase } from '@/constants';
import { cn } from '@/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface LegalDocumentSectionSpec {
	id: string;
	trigger: ReactNode;
	content: ReactNode;
}

export type LegalDocumentLayoutVariant = 'page' | 'embedded';

export interface LegalDocumentPageProps {
	icon: ReactNode;
	titleKey: LegalKey;
	sections: LegalDocumentSectionSpec[];
	/** `embedded`: scrollable body for use inside dialogs; `page` (default): full view layout. */
	variant?: LegalDocumentLayoutVariant;
}

/** Legal policy/terms: page chrome, accordion sections (closed by default), expand/collapse all. */
export function LegalDocumentPage({
	icon,
	titleKey,
	sections,
	variant = 'page',
}: LegalDocumentPageProps): JSX.Element {
	const { t } = useTranslation('legal');
	const [openSectionIds, setOpenSectionIds] = useState<string[]>([]);
	const allSectionIds = useMemo(() => sections.map(s => s.id), [sections]);
	const isEmbedded = variant === 'embedded';

	const allExpanded =
		allSectionIds.length > 0 &&
		openSectionIds.length === allSectionIds.length &&
		allSectionIds.every(id => openSectionIds.includes(id));

	const toggleExpandCollapseAll = useCallback(() => {
		setOpenSectionIds(prev => {
			const isFullyOpen =
				allSectionIds.length > 0 &&
				prev.length === allSectionIds.length &&
				allSectionIds.every(id => prev.includes(id));
			return isFullyOpen ? [] : [...allSectionIds];
		});
	}, [allSectionIds]);

	const outer = (
		<>
			<div className={cn('view-content-4xl', isEmbedded && 'w-full max-w-none flex flex-1 min-h-0 flex-col px-0')}>
				<Card
					className={cn(
						'flex flex-1 flex-col overflow-hidden',
						isEmbedded && 'min-h-0 flex-1 border border-border bg-card shadow-sm'
					)}
				>
					<CardHeader className={cn('flex-shrink-0', isEmbedded && 'pb-3 pt-4')}>
						<div className='mb-2 flex items-center gap-3'>
							<span className={cn(isEmbedded && '[&_svg]:h-6 [&_svg]:w-6')}>{icon}</span>
							<CardTitle
								className={cn(
									'text-3xl font-bold md:text-4xl',
									isEmbedded && 'text-2xl font-bold md:text-3xl'
								)}
							>
								{t(titleKey)}
							</CardTitle>
						</div>
						<p className={cn('text-sm text-muted-foreground md:text-base', isEmbedded && 'text-xs md:text-sm')}>
							{t(LegalKey.LAST_UPDATED)} {formatDate(new Date())}
						</p>
					</CardHeader>
					<CardContent
						className={cn(
							'view-spacing-legal',
							isEmbedded ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain' : 'view-scroll-inline'
						)}
					>
						<div className='mb-4'>
							<Button
								type='button'
								variant={VariantBase.OUTLINE}
								size={ButtonSize.MD}
								onClick={toggleExpandCollapseAll}
								className='gap-2'
							>
								<ChevronDown
									className={cn(
										'h-5 w-5 shrink-0 transition-transform duration-200 md:h-6 md:w-6',
										allExpanded && 'rotate-180'
									)}
								/>
								{t(allExpanded ? LegalKey.ACCORDION_CLOSE_ALL : LegalKey.ACCORDION_OPEN_ALL)}
							</Button>
						</div>
						<Accordion
							type='multiple'
							value={openSectionIds}
							onValueChange={setOpenSectionIds}
							className='w-full space-y-3'
						>
							{sections.map(section => (
								<AccordionItem
									key={section.id}
									value={section.id}
									className={cn(
										'overflow-hidden rounded-lg border border-border bg-card/40 shadow-sm last:!border-b'
									)}
								>
									<AccordionTrigger className='px-4 text-base font-semibold text-foreground hover:no-underline md:text-lg'>
										{section.trigger}
									</AccordionTrigger>
									<AccordionContent className='px-4 text-base leading-relaxed text-muted-foreground'>
										{section.content}
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</CardContent>
				</Card>
			</div>
		</>
	);

	if (isEmbedded) {
		return <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>{outer}</div>;
	}

	return <main className='view-main animate-fade-in-up-simple'>{outer}</main>;
}
