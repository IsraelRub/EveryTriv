import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';

import { LegalKey } from '@/constants';
import { buildTermsOfServiceSections, LegalDocumentPage } from '@/components/legal';

export function TermsOfServiceView() {
	const { t } = useTranslation('legal');

	const sections = useMemo(() => buildTermsOfServiceSections(t), [t]);

	return (
		<LegalDocumentPage
			icon={<FileText className='h-6 w-6 text-primary md:h-8 md:w-8' />}
			titleKey={LegalKey.TERMS_OF_SERVICE}
			sections={sections}
		/>
	);
}
