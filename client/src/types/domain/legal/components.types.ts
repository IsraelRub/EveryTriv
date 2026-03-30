import type { ReactNode } from 'react';

import type { LegalDocumentKind, LegalDocumentLayoutVariant, LegalKey } from '@/constants';

export interface LegalDocumentSectionSpec {
	id: string;
	trigger: ReactNode;
	content: ReactNode;
}

export interface LegalDocumentPageProps {
	icon: ReactNode;
	titleKey: LegalKey;
	sections: LegalDocumentSectionSpec[];
	variant?: LegalDocumentLayoutVariant;
}

export interface LegalDocumentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	document: LegalDocumentKind | null;
}
