import { useMemo, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileText, Shield } from 'lucide-react';

import {
	AuthKey,
	ButtonSize,
	DialogContentSize,
	LegalDocumentKind,
	LegalDocumentLayoutVariant,
	LegalKey,
	ROUTES,
	VariantBase,
} from '@/constants';
import type { LegalDocumentModalProps } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { LegalDocumentPage } from './LegalDocumentPage';
import { buildPrivacyPolicySections } from './PrivacyPolicySections';
import { buildTermsOfServiceSections } from './TermsOfServiceSections';

export function LegalDocumentModal({ open, onOpenChange, document }: LegalDocumentModalProps): JSX.Element {
	const { t } = useTranslation(['legal', 'auth']);

	const sections = useMemo(() => {
		if (document === LegalDocumentKind.TERMS) {
			return buildTermsOfServiceSections(t);
		}
		if (document === LegalDocumentKind.PRIVACY) {
			return buildPrivacyPolicySections(t);
		}
		return [];
	}, [document, t]);

	const titleKey = document === LegalDocumentKind.PRIVACY ? LegalKey.PRIVACY_POLICY : LegalKey.TERMS_OF_SERVICE;
	const fullPageTo = document === LegalDocumentKind.PRIVACY ? ROUTES.PRIVACY : ROUTES.TERMS;
	const icon =
		document === LegalDocumentKind.PRIVACY ? (
			<Shield className='h-6 w-6 text-primary md:h-8 md:w-8' />
		) : (
			<FileText className='h-6 w-6 text-primary md:h-8 md:w-8' />
		);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				size={DialogContentSize.LG}
				className='flex max-h-[90vh] max-w-[min(96vw,42rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl'
			>
				{document != null ? (
					<>
						<div className='flex min-h-0 flex-1 flex-col px-4 pt-4'>
							<LegalDocumentPage
								variant={LegalDocumentLayoutVariant.EMBEDDED}
								icon={icon}
								titleKey={titleKey}
								sections={sections}
							/>
						</div>
						<DialogFooter className='flex-shrink-0 border-t border-border bg-muted/30 px-4 py-3 sm:justify-center'>
							<Button variant={VariantBase.MINIMAL} size={ButtonSize.SM} asChild>
								<Link
									to={fullPageTo}
									onClick={() => {
										onOpenChange(false);
									}}
									className='h-auto p-0 font-medium text-primary underline-offset-4 hover:underline'
								>
									{t(AuthKey.LEGAL_OPEN_FULL_PAGE)}
								</Link>
							</Button>
						</DialogFooter>
					</>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
