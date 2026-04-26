import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
	AlertIconSize,
	AlertVariant,
	AudioKey,
	AuthKey,
	ButtonSize,
	ComponentSize,
	LegalDocumentKind,
	LoadingMessages,
	Routes,
	VariantBase,
} from '@/constants';
import { audioService, authService } from '@/services';
import { applyPostLoginNavigation, getTranslatedErrorMessage } from '@/utils';
import {
	Alert,
	AlertDescription,
	AlertIcon,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	LegalDocumentModal,
	Spinner,
} from '@/components';
import { useAcceptLegalConsent, useCurrentUser } from '@/hooks';

export function LegalAcceptanceView() {
	const { t } = useTranslation(['auth', 'errors']);
	const navigate = useNavigate();
	const { data: user, isLoading: isUserLoading, isSuccess } = useCurrentUser();
	const acceptMutation = useAcceptLegalConsent();

	const [acceptedTermsPrivacy, setAcceptedTermsPrivacy] = useState(false);
	const [termsPrivacyError, setTermsPrivacyError] = useState<string | null>(null);
	const [legalModalDocument, setLegalModalDocument] = useState<LegalDocumentKind | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isUserLoading) return;
		if (isSuccess && user && user.needsLegalAcceptance !== true) {
			navigate(Routes.HOME, { replace: true });
		}
	}, [isUserLoading, isSuccess, user, navigate]);

	const handleSubmit = async () => {
		setError(null);
		setTermsPrivacyError(null);
		if (!acceptedTermsPrivacy) {
			setTermsPrivacyError(t(AuthKey.TERMS_PRIVACY_REQUIRED));
			audioService.play(AudioKey.ERROR);
			return;
		}
		try {
			const updatedUser = await acceptMutation.mutateAsync();
			applyPostLoginNavigation(navigate, updatedUser);
			audioService.play(AudioKey.SUCCESS);
		} catch (err) {
			setError(getTranslatedErrorMessage(t, err));
			audioService.play(AudioKey.ERROR);
		}
	};

	const isSubmitting = acceptMutation.isPending;

	if (isUserLoading || !user) {
		return (
			<div className='view-main-fill flex items-center justify-center px-4'>
				<Spinner size={ComponentSize.XL} message={LoadingMessages.AUTHENTICATING} />
			</div>
		);
	}

	return (
		<>
			<div className='view-main-fill flex items-center justify-center px-4 py-8'>
				<Card className='w-full max-w-md'>
					<CardHeader className='text-center space-y-2'>
						<CardTitle className='text-2xl font-bold'>{t(AuthKey.LEGAL_CONSENT_TITLE)}</CardTitle>
						<CardDescription>{t(AuthKey.LEGAL_CONSENT_DESCRIPTION)}</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						{error && (
							<Alert variant={AlertVariant.DESTRUCTIVE}>
								<AlertIcon size={AlertIconSize.SM} />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className='space-y-2'>
							<div className='flex items-start gap-3'>
								<Checkbox
									id='legal-acceptance-terms'
									checked={acceptedTermsPrivacy}
									onCheckedChange={checked => {
										setAcceptedTermsPrivacy(checked === true);
										setTermsPrivacyError(null);
									}}
									disabled={isSubmitting}
									className='mt-0.5'
								/>
								<label
									htmlFor='legal-acceptance-terms'
									className='text-sm leading-snug text-muted-foreground cursor-pointer'
								>
									<Trans
										i18nKey={AuthKey.TERMS_PRIVACY_CONSENT}
										components={{
											termsLink: (
												<button
													type='button'
													className='inline font-medium text-primary underline underline-offset-2 hover:text-primary/90'
													onClick={e => {
														e.preventDefault();
														e.stopPropagation();
														setLegalModalDocument(LegalDocumentKind.TERMS);
													}}
												/>
											),
											privacyLink: (
												<button
													type='button'
													className='inline font-medium text-primary underline underline-offset-2 hover:text-primary/90'
													onClick={e => {
														e.preventDefault();
														e.stopPropagation();
														setLegalModalDocument(LegalDocumentKind.PRIVACY);
													}}
												/>
											),
										}}
									/>
								</label>
							</div>
							{termsPrivacyError ? (
								<p className='text-sm text-destructive flex items-center gap-1'>
									<AlertIcon size={AlertIconSize.SM} />
									{termsPrivacyError}
								</p>
							) : null}
						</div>

						<Button
							type='button'
							className='w-full'
							size={ButtonSize.LG}
							disabled={isSubmitting || !acceptedTermsPrivacy}
							onClick={() => void handleSubmit()}
						>
							{!isSubmitting ? (
								t(AuthKey.ACCEPT_LEGAL_AND_CONTINUE)
							) : (
								<Spinner size={ComponentSize.SM} message={LoadingMessages.SAVING} messageInline />
							)}
						</Button>

						<Button
							type='button'
							variant={VariantBase.OUTLINE}
							className='w-full'
							size={ButtonSize.SM}
							disabled={isSubmitting}
							onClick={() => void authService.logout().then(() => navigate(Routes.HOME, { replace: true }))}
						>
							{t(AuthKey.LEGAL_CONSENT_SIGN_OUT)}
						</Button>
					</CardContent>
				</Card>
			</div>
			<LegalDocumentModal
				open={legalModalDocument !== null}
				onOpenChange={open => {
					if (!open) {
						setLegalModalDocument(null);
					}
				}}
				document={legalModalDocument}
			/>
		</>
	);
}
