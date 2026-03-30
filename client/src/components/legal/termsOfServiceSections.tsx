import type { TFunction } from 'i18next';
import {
	Ban,
	Copyright,
	CreditCard,
	Gavel,
	Handshake,
	History,
	Mail,
	Scale,
	ScrollText,
	ShieldUser,
	UserCheck,
	Users,
} from 'lucide-react';

import { AlertIconSize, LegalKey, ROUTES } from '@/constants';
import type { LegalDocumentSectionSpec } from '@/types';
import { NavLink } from '@/components/navigation/NavLink';
import { AlertIcon } from '@/components/ui/alert';

export function buildTermsOfServiceSections(t: TFunction<'legal'>): LegalDocumentSectionSpec[] {
	return [
		{
			id: 'terms-acceptance',
			trigger: (
				<span className='flex items-center gap-2'>
					<Users className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_ACCEPTANCE_TITLE)}
				</span>
			),
			content: (
				<div className='space-y-4'>
					<p>{t(LegalKey.TERMS_ACCEPTANCE_P1)}</p>
					<p>{t(LegalKey.TERMS_ACCEPTANCE_P2)}</p>
				</div>
			),
		},
		{
			id: 'terms-description',
			trigger: (
				<span className='flex items-center gap-2'>
					<ScrollText className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_DESCRIPTION_TITLE)}
				</span>
			),
			content: (
				<div>
					<p className='mb-4'>{t(LegalKey.TERMS_DESCRIPTION_INTRO)}</p>
					<ul className='ml-4 list-inside list-disc space-y-2'>
						<li>{t(LegalKey.TERMS_DESCRIPTION_LI1)}</li>
						<li>{t(LegalKey.TERMS_DESCRIPTION_LI2)}</li>
						<li>{t(LegalKey.TERMS_DESCRIPTION_LI3)}</li>
						<li>{t(LegalKey.TERMS_DESCRIPTION_LI4)}</li>
						<li>{t(LegalKey.TERMS_DESCRIPTION_LI5)}</li>
					</ul>
				</div>
			),
		},
		{
			id: 'terms-accounts',
			trigger: (
				<span className='flex items-center gap-2'>
					<ShieldUser className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_ACCOUNTS_TITLE)}
				</span>
			),
			content: (
				<div className='space-y-4'>
					<div>
						<h3 className='mb-2 text-xl font-semibold text-foreground'>{t(LegalKey.TERMS_ACCOUNT_CREATION_TITLE)}</h3>
						<p>{t(LegalKey.TERMS_ACCOUNT_CREATION_BODY)}</p>
					</div>
					<div>
						<h3 className='mb-2 text-xl font-semibold text-foreground'>{t(LegalKey.TERMS_ACCOUNT_SECURITY_TITLE)}</h3>
						<p>{t(LegalKey.TERMS_ACCOUNT_SECURITY_BODY)}</p>
					</div>
					<div>
						<h3 className='mb-2 text-xl font-semibold text-foreground'>{t(LegalKey.TERMS_ACCOUNT_TERMINATION_TITLE)}</h3>
						<p>{t(LegalKey.TERMS_ACCOUNT_TERMINATION_BODY)}</p>
					</div>
				</div>
			),
		},
		{
			id: 'terms-payments',
			trigger: (
				<span className='flex items-center gap-2'>
					<CreditCard className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_PAYMENTS_TITLE)}
				</span>
			),
			content: (
				<div className='space-y-4'>
					<div>
						<h3 className='mb-2 text-xl font-semibold text-foreground'>{t(LegalKey.TERMS_CREDITS_TITLE)}</h3>
						<p>{t(LegalKey.TERMS_CREDITS_BODY)}</p>
					</div>
					<div>
						<h3 className='mb-2 text-xl font-semibold text-foreground'>{t(LegalKey.TERMS_PURCHASES_TITLE)}</h3>
						<p className='mb-2'>{t(LegalKey.TERMS_PURCHASES_INTRO)}</p>
						<ul className='ml-4 list-inside list-disc space-y-1'>
							<li>{t(LegalKey.TERMS_PURCHASES_LI1)}</li>
							<li>{t(LegalKey.TERMS_PURCHASES_LI2)}</li>
							<li>{t(LegalKey.TERMS_PURCHASES_LI3)}</li>
						</ul>
					</div>
				</div>
			),
		},
		{
			id: 'terms-conduct',
			trigger: (
				<span className='flex items-center gap-2'>
					<UserCheck className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_CONDUCT_TITLE)}
				</span>
			),
			content: (
				<div>
					<p className='mb-4'>{t(LegalKey.TERMS_CONDUCT_INTRO)}</p>
					<ul className='ml-4 list-inside list-disc space-y-2'>
						<li>{t(LegalKey.TERMS_CONDUCT_LI1)}</li>
						<li>{t(LegalKey.TERMS_CONDUCT_LI2)}</li>
						<li>{t(LegalKey.TERMS_CONDUCT_LI3)}</li>
						<li>{t(LegalKey.TERMS_CONDUCT_LI4)}</li>
						<li>{t(LegalKey.TERMS_CONDUCT_LI5)}</li>
						<li>{t(LegalKey.TERMS_CONDUCT_LI6)}</li>
						<li>{t(LegalKey.TERMS_CONDUCT_LI7)}</li>
						<li>{t(LegalKey.TERMS_CONDUCT_LI8)}</li>
					</ul>
				</div>
			),
		},
		{
			id: 'terms-prohibited',
			trigger: (
				<span className='flex items-center gap-2'>
					<Ban className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_PROHIBITED_TITLE)}
				</span>
			),
			content: (
				<div>
					<p className='mb-4'>{t(LegalKey.TERMS_PROHIBITED_INTRO)}</p>
					<ul className='ml-4 list-inside list-disc space-y-2'>
						<li>{t(LegalKey.TERMS_PROHIBITED_LI1)}</li>
						<li>{t(LegalKey.TERMS_PROHIBITED_LI2)}</li>
						<li>{t(LegalKey.TERMS_PROHIBITED_LI3)}</li>
						<li>{t(LegalKey.TERMS_PROHIBITED_LI4)}</li>
						<li>{t(LegalKey.TERMS_PROHIBITED_LI5)}</li>
					</ul>
				</div>
			),
		},
		{
			id: 'terms-ip',
			trigger: (
				<span className='flex items-center gap-2'>
					<Copyright className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_IP_TITLE)}
				</span>
			),
			content: (
				<div className='space-y-4'>
					<p>{t(LegalKey.TERMS_IP_BODY1)}</p>
					<p>{t(LegalKey.TERMS_IP_BODY2)}</p>
				</div>
			),
		},
		{
			id: 'terms-warranties',
			trigger: (
				<span className='flex items-center gap-2'>
					<AlertIcon size={AlertIconSize.BASE} className='shrink-0 text-primary' />
					{t(LegalKey.TERMS_WARRANTIES_TITLE)}
				</span>
			),
			content: (
				<div className='space-y-4'>
					<p>{t(LegalKey.TERMS_WARRANTIES_BODY1)}</p>
					<p>{t(LegalKey.TERMS_WARRANTIES_BODY2)}</p>
				</div>
			),
		},
		{
			id: 'terms-liability',
			trigger: (
				<span className='flex items-center gap-2'>
					<Scale className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_LIABILITY_TITLE)}
				</span>
			),
			content: <p>{t(LegalKey.TERMS_LIABILITY_BODY)}</p>,
		},
		{
			id: 'terms-indemnify',
			trigger: (
				<span className='flex items-center gap-2'>
					<Handshake className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_INDEMNIFY_TITLE)}
				</span>
			),
			content: <p>{t(LegalKey.TERMS_INDEMNIFY_BODY)}</p>,
		},
		{
			id: 'terms-changes',
			trigger: (
				<span className='flex items-center gap-2'>
					<History className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_CHANGES_TITLE)}
				</span>
			),
			content: <p>{t(LegalKey.TERMS_CHANGES_BODY)}</p>,
		},
		{
			id: 'terms-law',
			trigger: (
				<span className='flex items-center gap-2'>
					<Gavel className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_LAW_TITLE)}
				</span>
			),
			content: <p>{t(LegalKey.TERMS_LAW_BODY)}</p>,
		},
		{
			id: 'terms-contact',
			trigger: (
				<span className='flex items-center gap-2'>
					<Mail className='h-6 w-6 shrink-0 text-primary' />
					{t(LegalKey.TERMS_CONTACT_TITLE)}
				</span>
			),
			content: (
				<div>
					<p className='mb-4'>{t(LegalKey.TERMS_CONTACT_INTRO)}</p>
					<div className='callout-muted'>
						<p className='mb-2 font-semibold text-foreground'>{t(LegalKey.TERMS_SUPPORT_NAME)}</p>
						<p>Email: legal@everytriv.com</p>
						<p>
							Website:{' '}
							<NavLink to={ROUTES.CONTACT} className='link-primary'>
								{t(LegalKey.CONTACT_PAGE)}
							</NavLink>
						</p>
					</div>
				</div>
			),
		},
	];
}
