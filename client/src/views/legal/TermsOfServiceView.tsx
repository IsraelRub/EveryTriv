import { useTranslation } from 'react-i18next';
import { Ban, CreditCard, FileText, Mail, Shield, Users } from 'lucide-react';

import { AlertIconSize, LegalKey, ROUTES } from '@/constants';
import { AlertIcon, NavLink } from '@/components';
import { LegalPageLayout } from './LegalPageLayout';

export function TermsOfServiceView() {
	const { t } = useTranslation('legal');
	return (
		<LegalPageLayout
			icon={<FileText className='h-6 md:h-8 w-6 md:w-8 text-primary' />}
			titleKey={LegalKey.TERMS_OF_SERVICE}
		>
			<section>
				<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
					<Users className='h-6 w-6 text-primary' />
					{t(LegalKey.TERMS_ACCEPTANCE_TITLE)}
				</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.TERMS_ACCEPTANCE_P1)}</p>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.TERMS_ACCEPTANCE_P2)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.TERMS_DESCRIPTION_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.TERMS_DESCRIPTION_INTRO)}</p>
				<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
					<li>{t(LegalKey.TERMS_DESCRIPTION_LI1)}</li>
					<li>{t(LegalKey.TERMS_DESCRIPTION_LI2)}</li>
					<li>{t(LegalKey.TERMS_DESCRIPTION_LI3)}</li>
					<li>{t(LegalKey.TERMS_DESCRIPTION_LI4)}</li>
					<li>{t(LegalKey.TERMS_DESCRIPTION_LI5)}</li>
				</ul>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
					<Shield className='h-6 w-6 text-primary' />
					{t(LegalKey.TERMS_ACCOUNTS_TITLE)}
				</h2>
				<div className='space-y-4'>
					<div>
						<h3 className='text-xl font-semibold mb-2'>{t(LegalKey.TERMS_ACCOUNT_CREATION_TITLE)}</h3>
						<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.TERMS_ACCOUNT_CREATION_BODY)}</p>
					</div>
					<div>
						<h3 className='text-xl font-semibold mb-2'>{t(LegalKey.TERMS_ACCOUNT_SECURITY_TITLE)}</h3>
						<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.TERMS_ACCOUNT_SECURITY_BODY)}</p>
					</div>
					<div>
						<h3 className='text-xl font-semibold mb-2'>{t(LegalKey.TERMS_ACCOUNT_TERMINATION_TITLE)}</h3>
						<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.TERMS_ACCOUNT_TERMINATION_BODY)}</p>
					</div>
				</div>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
					<CreditCard className='h-6 w-6 text-primary' />
					{t(LegalKey.TERMS_PAYMENTS_TITLE)}
				</h2>
				<div className='space-y-4'>
					<div>
						<h3 className='text-xl font-semibold mb-2'>{t(LegalKey.TERMS_CREDITS_TITLE)}</h3>
						<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.TERMS_CREDITS_BODY)}</p>
					</div>
					<div>
						<h3 className='text-xl font-semibold mb-2'>{t(LegalKey.TERMS_PURCHASES_TITLE)}</h3>
						<p className='text-muted-foreground leading-relaxed mb-2'>{t(LegalKey.TERMS_PURCHASES_INTRO)}</p>
						<ul className='list-disc list-inside space-y-1 text-muted-foreground ml-4'>
							<li>{t(LegalKey.TERMS_PURCHASES_LI1)}</li>
							<li>{t(LegalKey.TERMS_PURCHASES_LI2)}</li>
							<li>{t(LegalKey.TERMS_PURCHASES_LI3)}</li>
						</ul>
					</div>
				</div>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.TERMS_CONDUCT_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.TERMS_CONDUCT_INTRO)}</p>
				<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
					<li>{t(LegalKey.TERMS_CONDUCT_LI1)}</li>
					<li>{t(LegalKey.TERMS_CONDUCT_LI2)}</li>
					<li>{t(LegalKey.TERMS_CONDUCT_LI3)}</li>
					<li>{t(LegalKey.TERMS_CONDUCT_LI4)}</li>
					<li>{t(LegalKey.TERMS_CONDUCT_LI5)}</li>
					<li>{t(LegalKey.TERMS_CONDUCT_LI6)}</li>
					<li>{t(LegalKey.TERMS_CONDUCT_LI7)}</li>
					<li>{t(LegalKey.TERMS_CONDUCT_LI8)}</li>
				</ul>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
					<Ban className='h-6 w-6 text-primary' />
					{t(LegalKey.TERMS_PROHIBITED_TITLE)}
				</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.TERMS_PROHIBITED_INTRO)}</p>
				<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
					<li>{t(LegalKey.TERMS_PROHIBITED_LI1)}</li>
					<li>{t(LegalKey.TERMS_PROHIBITED_LI2)}</li>
					<li>{t(LegalKey.TERMS_PROHIBITED_LI3)}</li>
					<li>{t(LegalKey.TERMS_PROHIBITED_LI4)}</li>
					<li>{t(LegalKey.TERMS_PROHIBITED_LI5)}</li>
				</ul>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.TERMS_IP_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.TERMS_IP_BODY1)}</p>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.TERMS_IP_BODY2)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
					<AlertIcon size={AlertIconSize.BASE} className='text-primary' />
					{t(LegalKey.TERMS_WARRANTIES_TITLE)}
				</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.TERMS_WARRANTIES_BODY1)}</p>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.TERMS_WARRANTIES_BODY2)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.TERMS_LIABILITY_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.TERMS_LIABILITY_BODY)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.TERMS_INDEMNIFY_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.TERMS_INDEMNIFY_BODY)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.TERMS_CHANGES_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.TERMS_CHANGES_BODY)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.TERMS_LAW_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.TERMS_LAW_BODY)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
					<Mail className='h-6 w-6 text-primary' />
					{t(LegalKey.TERMS_CONTACT_TITLE)}
				</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.TERMS_CONTACT_INTRO)}</p>
				<div className='callout-muted'>
					<p className='font-semibold mb-2'>{t(LegalKey.TERMS_SUPPORT_NAME)}</p>
					<p className='text-muted-foreground'>Email: legal@everytriv.com</p>
					<p className='text-muted-foreground'>
						Website:{' '}
						<NavLink to={ROUTES.CONTACT} className='link-primary'>
							{t(LegalKey.CONTACT_PAGE)}
						</NavLink>
					</p>
				</div>
			</section>
		</LegalPageLayout>
	);
}
