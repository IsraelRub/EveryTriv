import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';

import { LegalKey } from '@/constants';
import { buildPrivacyPolicySections, LegalDocumentPage } from '@/components/legal';

export function PrivacyPolicyView() {
	const { t } = useTranslation('legal');

	const sections = useMemo(() => buildPrivacyPolicySections(t), [t]);

	return (
		<LegalDocumentPage
			icon={<Shield className='h-6 w-6 text-primary md:h-8 md:w-8' />}
			titleKey={LegalKey.PRIVACY_POLICY}
			sections={sections}
		/>
	);
}
