import { useTranslation } from 'react-i18next';
import { Database, Eye, Lock, Mail, Shield } from 'lucide-react';

import { LegalKey, ROUTES } from '@/constants';
import { NavLink } from '@/components';
import { LegalPageLayout } from './LegalPageLayout';

export function PrivacyPolicyView() {
	const { t } = useTranslation('legal');
	return (
		<LegalPageLayout
			icon={<Shield className='h-6 md:h-8 w-6 md:w-8 text-primary' />}
			titleKey={LegalKey.PRIVACY_POLICY}
		>
			<section>
				<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
					<Lock className='h-6 w-6 text-primary' />
					{t(LegalKey.PRIVACY_INTRO_TITLE)}
				</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.PRIVACY_INTRO_P1)}</p>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.PRIVACY_INTRO_P2)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
					<Database className='h-6 w-6 text-primary' />
					{t(LegalKey.PRIVACY_COLLECT_TITLE)}
				</h2>
				<div className='space-y-4'>
					<div>
						<h3 className='text-xl font-semibold mb-2'>{t(LegalKey.PRIVACY_PERSONAL_TITLE)}</h3>
						<p className='text-muted-foreground leading-relaxed mb-2'>{t(LegalKey.PRIVACY_PERSONAL_INTRO)}</p>
						<ul className='list-disc list-inside space-y-1 text-muted-foreground ml-4'>
							<li>{t(LegalKey.PRIVACY_PERSONAL_LI1)}</li>
							<li>{t(LegalKey.PRIVACY_PERSONAL_LI2)}</li>
							<li>{t(LegalKey.PRIVACY_PERSONAL_LI3)}</li>
							<li>{t(LegalKey.PRIVACY_PERSONAL_LI4)}</li>
							<li>{t(LegalKey.PRIVACY_PERSONAL_LI5)}</li>
						</ul>
					</div>
					<div>
						<h3 className='text-xl font-semibold mb-2'>{t(LegalKey.PRIVACY_GAME_TITLE)}</h3>
						<p className='text-muted-foreground leading-relaxed mb-2'>{t(LegalKey.PRIVACY_GAME_INTRO)}</p>
						<ul className='list-disc list-inside space-y-1 text-muted-foreground ml-4'>
							<li>{t(LegalKey.PRIVACY_GAME_LI1)}</li>
							<li>{t(LegalKey.PRIVACY_GAME_LI2)}</li>
							<li>{t(LegalKey.PRIVACY_GAME_LI3)}</li>
							<li>{t(LegalKey.PRIVACY_GAME_LI4)}</li>
							<li>{t(LegalKey.PRIVACY_GAME_LI5)}</li>
						</ul>
					</div>
					<div>
						<h3 className='text-xl font-semibold mb-2'>{t(LegalKey.PRIVACY_PAYMENT_TITLE)}</h3>
						<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.PRIVACY_PAYMENT_BODY)}</p>
					</div>
					<div>
						<h3 className='text-xl font-semibold mb-2'>{t(LegalKey.PRIVACY_TECHNICAL_TITLE)}</h3>
						<p className='text-muted-foreground leading-relaxed mb-2'>{t(LegalKey.PRIVACY_TECHNICAL_INTRO)}</p>
						<ul className='list-disc list-inside space-y-1 text-muted-foreground ml-4'>
							<li>{t(LegalKey.PRIVACY_TECHNICAL_LI1)}</li>
							<li>{t(LegalKey.PRIVACY_TECHNICAL_LI2)}</li>
							<li>{t(LegalKey.PRIVACY_TECHNICAL_LI3)}</li>
							<li>{t(LegalKey.PRIVACY_TECHNICAL_LI4)}</li>
							<li>{t(LegalKey.PRIVACY_TECHNICAL_LI5)}</li>
						</ul>
					</div>
				</div>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
					<Eye className='h-6 w-6 text-primary' />
					{t(LegalKey.PRIVACY_USE_TITLE)}
				</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.PRIVACY_USE_INTRO)}</p>
				<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
					<li>{t(LegalKey.PRIVACY_USE_LI1)}</li>
					<li>{t(LegalKey.PRIVACY_USE_LI2)}</li>
					<li>{t(LegalKey.PRIVACY_USE_LI3)}</li>
					<li>{t(LegalKey.PRIVACY_USE_LI4)}</li>
					<li>{t(LegalKey.PRIVACY_USE_LI5)}</li>
					<li>{t(LegalKey.PRIVACY_USE_LI6)}</li>
					<li>{t(LegalKey.PRIVACY_USE_LI7)}</li>
					<li>{t(LegalKey.PRIVACY_USE_LI8)}</li>
				</ul>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.PRIVACY_SHARING_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.PRIVACY_SHARING_INTRO)}</p>
				<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
					<li>{t(LegalKey.PRIVACY_SHARING_LI1)}</li>
					<li>{t(LegalKey.PRIVACY_SHARING_LI2)}</li>
					<li>{t(LegalKey.PRIVACY_SHARING_LI3)}</li>
					<li>{t(LegalKey.PRIVACY_SHARING_LI4)}</li>
				</ul>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.PRIVACY_SECURITY_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.PRIVACY_SECURITY_BODY)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.PRIVACY_RIGHTS_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed mb-4'>{t(LegalKey.PRIVACY_RIGHTS_INTRO)}</p>
				<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
					<li>{t(LegalKey.PRIVACY_RIGHTS_LI1)}</li>
					<li>{t(LegalKey.PRIVACY_RIGHTS_LI2)}</li>
					<li>{t(LegalKey.PRIVACY_RIGHTS_LI3)}</li>
					<li>{t(LegalKey.PRIVACY_RIGHTS_LI4)}</li>
					<li>{t(LegalKey.PRIVACY_RIGHTS_LI5)}</li>
					<li>{t(LegalKey.PRIVACY_RIGHTS_LI6)}</li>
					<li>{t(LegalKey.PRIVACY_RIGHTS_LI7)}</li>
				</ul>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.PRIVACY_COOKIES_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.PRIVACY_COOKIES_BODY)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.PRIVACY_CHILDREN_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.PRIVACY_CHILDREN_BODY)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4'>{t(LegalKey.PRIVACY_CHANGES_TITLE)}</h2>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.PRIVACY_CHANGES_BODY)}</p>
			</section>

			<section>
				<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
					<Mail className='h-6 w-6 text-primary' />
					{t(LegalKey.PRIVACY_CONTACT_TITLE)}
				</h2>
				<p className='text-muted-foreground leading-relaxed'>{t(LegalKey.PRIVACY_CONTACT_INTRO)}</p>
				<div className='callout-muted'>
					<p className='font-semibold mb-2'>{t(LegalKey.PRIVACY_SUPPORT_NAME)}</p>
					<p className='text-muted-foreground'>Email: privacy@everytriv.com</p>
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
