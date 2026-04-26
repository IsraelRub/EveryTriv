import type { TFunction } from 'i18next';
import { Baby, Cookie, Database, Eye, History, Lock, Mail, Scale, Share, ShieldCheck } from 'lucide-react';

import { LegalKey, Routes } from '@/constants';
import type { LegalDocumentSectionSpec } from '@/types';
import { NavLink } from '@/components/navigation/NavLink';

export function buildPrivacyPolicySections(t: TFunction<'legal'>): LegalDocumentSectionSpec[] {
	return [
		{
			id: 'privacy-intro',
			trigger: (
				<span className='flex items-center gap-2'>
					<Lock className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.PRIVACY_INTRO_TITLE)}
				</span>
			),
			content: (
				<div className='space-y-4'>
					<p>{t(LegalKey.PRIVACY_INTRO_P1)}</p>
					<p>{t(LegalKey.PRIVACY_INTRO_P2)}</p>
				</div>
			),
		},
		{
			id: 'privacy-collect',
			trigger: (
				<span className='flex items-center gap-2'>
					<Database className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.PRIVACY_COLLECT_TITLE)}
				</span>
			),
			content: (
				<div className='space-y-4'>
					<div>
						<h3 className='mb-2 text-xl font-semibold text-foreground'>{t(LegalKey.PRIVACY_PERSONAL_TITLE)}</h3>
						<p className='mb-2'>{t(LegalKey.PRIVACY_PERSONAL_INTRO)}</p>
						<ul className='ml-4 list-inside list-disc space-y-1'>
							<li>{t(LegalKey.PRIVACY_PERSONAL_LI1)}</li>
							<li>{t(LegalKey.PRIVACY_PERSONAL_LI2)}</li>
							<li>{t(LegalKey.PRIVACY_PERSONAL_LI3)}</li>
							<li>{t(LegalKey.PRIVACY_PERSONAL_LI4)}</li>
							<li>{t(LegalKey.PRIVACY_PERSONAL_LI5)}</li>
						</ul>
					</div>
					<div>
						<h3 className='mb-2 text-xl font-semibold text-foreground'>{t(LegalKey.PRIVACY_GAME_TITLE)}</h3>
						<p className='mb-2'>{t(LegalKey.PRIVACY_GAME_INTRO)}</p>
						<ul className='ml-4 list-inside list-disc space-y-1'>
							<li>{t(LegalKey.PRIVACY_GAME_LI1)}</li>
							<li>{t(LegalKey.PRIVACY_GAME_LI2)}</li>
							<li>{t(LegalKey.PRIVACY_GAME_LI3)}</li>
							<li>{t(LegalKey.PRIVACY_GAME_LI4)}</li>
							<li>{t(LegalKey.PRIVACY_GAME_LI5)}</li>
						</ul>
					</div>
					<div>
						<h3 className='mb-2 text-xl font-semibold text-foreground'>{t(LegalKey.PRIVACY_PAYMENT_TITLE)}</h3>
						<p>{t(LegalKey.PRIVACY_PAYMENT_BODY)}</p>
					</div>
					<div>
						<h3 className='mb-2 text-xl font-semibold text-foreground'>{t(LegalKey.PRIVACY_TECHNICAL_TITLE)}</h3>
						<p className='mb-2'>{t(LegalKey.PRIVACY_TECHNICAL_INTRO)}</p>
						<ul className='ml-4 list-inside list-disc space-y-1'>
							<li>{t(LegalKey.PRIVACY_TECHNICAL_LI1)}</li>
							<li>{t(LegalKey.PRIVACY_TECHNICAL_LI2)}</li>
							<li>{t(LegalKey.PRIVACY_TECHNICAL_LI3)}</li>
							<li>{t(LegalKey.PRIVACY_TECHNICAL_LI4)}</li>
							<li>{t(LegalKey.PRIVACY_TECHNICAL_LI5)}</li>
						</ul>
					</div>
				</div>
			),
		},
		{
			id: 'privacy-use',
			trigger: (
				<span className='flex items-center gap-2'>
					<Eye className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.PRIVACY_USE_TITLE)}
				</span>
			),
			content: (
				<div>
					<p className='mb-4'>{t(LegalKey.PRIVACY_USE_INTRO)}</p>
					<ul className='ml-4 list-inside list-disc space-y-2'>
						<li>{t(LegalKey.PRIVACY_USE_LI1)}</li>
						<li>{t(LegalKey.PRIVACY_USE_LI2)}</li>
						<li>{t(LegalKey.PRIVACY_USE_LI3)}</li>
						<li>{t(LegalKey.PRIVACY_USE_LI4)}</li>
						<li>{t(LegalKey.PRIVACY_USE_LI5)}</li>
						<li>{t(LegalKey.PRIVACY_USE_LI6)}</li>
						<li>{t(LegalKey.PRIVACY_USE_LI7)}</li>
						<li>{t(LegalKey.PRIVACY_USE_LI8)}</li>
					</ul>
				</div>
			),
		},
		{
			id: 'privacy-sharing',
			trigger: (
				<span className='flex items-center gap-2'>
					<Share className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.PRIVACY_SHARING_TITLE)}
				</span>
			),
			content: (
				<div>
					<p className='mb-4'>{t(LegalKey.PRIVACY_SHARING_INTRO)}</p>
					<ul className='ml-4 list-inside list-disc space-y-2'>
						<li>{t(LegalKey.PRIVACY_SHARING_LI1)}</li>
						<li>{t(LegalKey.PRIVACY_SHARING_LI2)}</li>
						<li>{t(LegalKey.PRIVACY_SHARING_LI3)}</li>
						<li>{t(LegalKey.PRIVACY_SHARING_LI4)}</li>
					</ul>
				</div>
			),
		},
		{
			id: 'privacy-security',
			trigger: (
				<span className='flex items-center gap-2'>
					<ShieldCheck className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.PRIVACY_SECURITY_TITLE)}
				</span>
			),
			content: <p>{t(LegalKey.PRIVACY_SECURITY_BODY)}</p>,
		},
		{
			id: 'privacy-rights',
			trigger: (
				<span className='flex items-center gap-2'>
					<Scale className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.PRIVACY_RIGHTS_TITLE)}
				</span>
			),
			content: (
				<div>
					<p className='mb-4'>{t(LegalKey.PRIVACY_RIGHTS_INTRO)}</p>
					<ul className='ml-4 list-inside list-disc space-y-2'>
						<li>{t(LegalKey.PRIVACY_RIGHTS_LI1)}</li>
						<li>{t(LegalKey.PRIVACY_RIGHTS_LI2)}</li>
						<li>{t(LegalKey.PRIVACY_RIGHTS_LI3)}</li>
						<li>{t(LegalKey.PRIVACY_RIGHTS_LI4)}</li>
						<li>{t(LegalKey.PRIVACY_RIGHTS_LI5)}</li>
						<li>{t(LegalKey.PRIVACY_RIGHTS_LI6)}</li>
						<li>{t(LegalKey.PRIVACY_RIGHTS_LI7)}</li>
					</ul>
				</div>
			),
		},
		{
			id: 'privacy-cookies',
			trigger: (
				<span className='flex items-center gap-2'>
					<Cookie className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.PRIVACY_COOKIES_TITLE)}
				</span>
			),
			content: <p>{t(LegalKey.PRIVACY_COOKIES_BODY)}</p>,
		},
		{
			id: 'privacy-children',
			trigger: (
				<span className='flex items-center gap-2'>
					<Baby className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.PRIVACY_CHILDREN_TITLE)}
				</span>
			),
			content: <p>{t(LegalKey.PRIVACY_CHILDREN_BODY)}</p>,
		},
		{
			id: 'privacy-changes',
			trigger: (
				<span className='flex items-center gap-2'>
					<History className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.PRIVACY_CHANGES_TITLE)}
				</span>
			),
			content: <p>{t(LegalKey.PRIVACY_CHANGES_BODY)}</p>,
		},
		{
			id: 'privacy-contact',
			trigger: (
				<span className='flex items-center gap-2'>
					<Mail className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.PRIVACY_CONTACT_TITLE)}
				</span>
			),
			content: (
				<div>
					<p className='mb-4'>{t(LegalKey.PRIVACY_CONTACT_INTRO)}</p>
					<div className='callout-muted'>
						<p className='mb-2 font-semibold text-foreground'>{t(LegalKey.PRIVACY_SUPPORT_NAME)}</p>
						<p>Email: privacy@everytriv.com</p>
						<p>
							Website:{' '}
							<NavLink to={Routes.CONTACT} className='link-primary'>
								{t(LegalKey.CONTACT_PAGE)}
							</NavLink>
						</p>
					</div>
				</div>
			),
		},
	];
}
