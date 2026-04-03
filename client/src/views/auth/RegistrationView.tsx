import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

import { LengthKey } from '@shared/constants';
import { validateEmail, validatePasswordMatch, validateStringLength } from '@shared/validation';

import {
	AlertIconSize,
	AlertVariant,
	AudioKey,
	AuthKey,
	ButtonSize,
	ComponentSize,
	getRegisterOptionalAvatarSearch,
	LegalDocumentKind,
	LoadingMessages,
	PLACEHOLDER_EMAIL,
	REGISTER_POST_STEP_AVATAR,
	REGISTER_POST_STEP_QUERY_KEY,
	ROUTES,
	SEMANTIC_ICON_TEXT,
	STORAGE_KEYS,
	ValidationKey,
	VariantBase,
} from '@/constants';
import type { RegistrationFieldErrors } from '@/types';
import { audioService, authService } from '@/services';
import { cn, getTranslatedErrorMessage, translateValidationMessage } from '@/utils';
import {
	Alert,
	AlertDescription,
	AlertIcon,
	AvatarSelector,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	CloseButton,
	GoogleAuthButton,
	Input,
	Label,
	LegalDocumentModal,
	Separator,
	Spinner,
} from '@/components';
import { useCurrentUserData, useIsAuthenticated, useModalRoute, useRegister } from '@/hooks';

type PostRegisterPhase = 'form' | 'optional-avatar';

export function RegistrationView() {
	const { t } = useTranslation(['auth', 'validation', 'errors']);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const registerMutation = useRegister();
	const { isModal, closeModal, returnUrl } = useModalRoute();
	const currentUser = useCurrentUserData();
	const isAuthenticated = useIsAuthenticated();

	const [postRegisterPhase, setPostRegisterPhase] = useState<PostRegisterPhase>('form');
	const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);

	const [formData, setFormData] = useState({
		email: '',
		password: '',
		confirmPassword: '',
		firstName: '',
		lastName: '',
	});
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});
	const [acceptedTermsPrivacy, setAcceptedTermsPrivacy] = useState(false);
	const [termsPrivacyError, setTermsPrivacyError] = useState<string | null>(null);
	const [legalModalDocument, setLegalModalDocument] = useState<LegalDocumentKind | null>(null);

	const isLoading = registerMutation.isPending;

	const emailValidation = validateEmail(formData.email);
	const passwordValidation = validateStringLength(formData.password, LengthKey.PASSWORD);
	const passwordMatchValidation =
		formData.confirmPassword !== undefined
			? validatePasswordMatch(formData.password, formData.confirmPassword)
			: { isValid: true, errors: [] };
	const isFormValid =
		emailValidation.isValid && passwordValidation.isValid && passwordMatchValidation.isValid && acceptedTermsPrivacy;

	const finishPostRegister = useCallback(() => {
		if (isModal) {
			closeModal();
		} else {
			navigate(returnUrl ?? ROUTES.HOME, { replace: true });
		}
	}, [isModal, closeModal, navigate, returnUrl]);

	useEffect(() => {
		const wantsAvatarStep = searchParams.get(REGISTER_POST_STEP_QUERY_KEY) === REGISTER_POST_STEP_AVATAR;
		if (wantsAvatarStep && isAuthenticated && currentUser) {
			setPostRegisterPhase('optional-avatar');
		}
	}, [searchParams, isAuthenticated, currentUser]);

	const validateField = (name: string, value: string): string | null => {
		switch (name) {
			case 'email': {
				const emailRes = validateEmail(value);
				return emailRes.isValid
					? null
					: emailRes.errors[0]
						? translateValidationMessage(emailRes.errors[0], t)
						: t(ValidationKey.EMAIL_INVALID);
			}
			case 'password': {
				const res = validateStringLength(value, LengthKey.PASSWORD);
				return res.isValid
					? null
					: res.errors[0]
						? translateValidationMessage(res.errors[0], t)
						: t(ValidationKey.PASSWORD_INVALID);
			}
			case 'confirmPassword': {
				const matchRes = validatePasswordMatch(formData.password, value);
				return matchRes.isValid
					? null
					: matchRes.errors[0]
						? translateValidationMessage(matchRes.errors[0], t)
						: t(ValidationKey.PASSWORD_CONFIRMATION_INVALID);
			}
			default:
				return null;
		}
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
		setError(null);

		// Validate field in real-time
		const fieldError = validateField(name, value);
		setFieldErrors(prev => ({
			...prev,
			[name]: fieldError ?? undefined,
		}));

		// Also validate confirmPassword when password changes
		if (name === 'password' && formData.confirmPassword) {
			const confirmError = validateField('confirmPassword', formData.confirmPassword);
			setFieldErrors(prev => ({
				...prev,
				confirmPassword: confirmError ?? undefined,
			}));
		}
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		setTermsPrivacyError(null);

		if (!acceptedTermsPrivacy) {
			setTermsPrivacyError(t(AuthKey.TERMS_PRIVACY_REQUIRED));
			audioService.play(AudioKey.ERROR);
			return;
		}

		// Validate all fields on submit
		const emailError = validateField('email', formData.email);
		const passwordError = validateField('password', formData.password);
		const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);

		const newFieldErrors: typeof fieldErrors = {};
		if (emailError) newFieldErrors.email = emailError;
		if (passwordError) newFieldErrors.password = passwordError;
		if (confirmPasswordError) newFieldErrors.confirmPassword = confirmPasswordError;

		setFieldErrors(newFieldErrors);

		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		if (emailError || passwordError || confirmPasswordError) {
			audioService.play(AudioKey.ERROR);
			return;
		}

		try {
			await registerMutation.mutateAsync({
				email: formData.email,
				password: formData.password,
				firstName: formData.firstName ?? undefined,
				lastName: formData.lastName ?? undefined,
			});
			audioService.play(AudioKey.SUCCESS);
			setPostRegisterPhase('optional-avatar');
			navigate({ pathname: ROUTES.REGISTER, search: getRegisterOptionalAvatarSearch() }, { replace: true });
		} catch (err) {
			setError(getTranslatedErrorMessage(t, err));
			audioService.play(AudioKey.ERROR);
		}
	};

	const handleGoogleSignup = async () => {
		setError(null);
		setTermsPrivacyError(null);
		if (!acceptedTermsPrivacy) {
			setTermsPrivacyError(t(AuthKey.TERMS_PRIVACY_REQUIRED));
			audioService.play(AudioKey.ERROR);
			return;
		}
		try {
			try {
				sessionStorage.setItem(STORAGE_KEYS.OAUTH_INITIATED_FROM_REGISTRATION, '1');
			} catch {
				// sessionStorage may be unavailable (private mode)
			}
			await authService.initiateGoogleLogin();
		} catch (err) {
			try {
				sessionStorage.removeItem(STORAGE_KEYS.OAUTH_INITIATED_FROM_REGISTRATION);
			} catch {
				// ignore
			}
			setError(getTranslatedErrorMessage(t, err));
		}
	};

	const isOptionalAvatarStep = postRegisterPhase === 'optional-avatar';

	return (
		<>
			<Card className='w-full max-w-md relative'>
				<CloseButton
					className='absolute top-4 left-4'
					{...(isOptionalAvatarStep ? { onClose: finishPostRegister } : {})}
				/>
				<CardHeader className='text-center space-y-2'>
					<CardTitle className='text-3xl font-bold'>
						{isOptionalAvatarStep ? t(AuthKey.ACCOUNT_READY) : t(AuthKey.CREATE_ACCOUNT)}
					</CardTitle>
					<CardDescription>
						{isOptionalAvatarStep ? t(AuthKey.OPTIONAL_AVATAR_PROMPT) : t(AuthKey.JOIN_EVERY_TRIV_SHORT)}
					</CardDescription>
				</CardHeader>

				<CardContent className='space-y-6'>
					{isOptionalAvatarStep ? (
						<div className='space-y-6'>
							<p className='text-sm text-muted-foreground text-center'>{t(AuthKey.OPTIONAL_AVATAR_HINT)}</p>
							<div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
								<Button
									type='button'
									size={ButtonSize.LG}
									className='w-full sm:w-auto'
									onClick={() => setAvatarSelectorOpen(true)}
								>
									{t(AuthKey.CHOOSE_AVATAR_BUTTON)}
								</Button>
								<Button
									type='button'
									variant={VariantBase.OUTLINE}
									size={ButtonSize.LG}
									className='w-full sm:w-auto'
									onClick={finishPostRegister}
								>
									{t(AuthKey.SKIP_FOR_NOW)}
								</Button>
							</div>
							<AvatarSelector
								open={avatarSelectorOpen}
								onOpenChange={setAvatarSelectorOpen}
								currentAvatarId={currentUser?.avatar}
								currentAvatarUrl={currentUser?.avatarUrl}
								onAvatarSaved={finishPostRegister}
							/>
						</div>
					) : (
						<>
							{error && (
								<Alert variant={AlertVariant.DESTRUCTIVE}>
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<form onSubmit={handleSubmit} className='space-y-4'>
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label>{t(AuthKey.FIRST_NAME)}</Label>
										<Input
											id='firstName'
											name='firstName'
											type='text'
											placeholder={t(AuthKey.FIRST_NAME_PLACEHOLDER)}
											value={formData.firstName}
											onChange={handleChange}
											disabled={isLoading}
											autoComplete='given-name'
										/>
									</div>
									<div className='space-y-2'>
										<Label>{t(AuthKey.LAST_NAME)}</Label>
										<Input
											id='lastName'
											name='lastName'
											type='text'
											placeholder={t(AuthKey.LAST_NAME_PLACEHOLDER)}
											value={formData.lastName}
											onChange={handleChange}
											disabled={isLoading}
											autoComplete='family-name'
										/>
									</div>
								</div>

								<div className='space-y-2'>
									<Label>
										{t(AuthKey.EMAIL)} <span className='text-destructive'>*</span>
									</Label>
									<Input
										id='email'
										name='email'
										type='email'
										placeholder={PLACEHOLDER_EMAIL}
										value={formData.email}
										onChange={handleChange}
										disabled={isLoading}
										autoComplete='email'
										error={!!fieldErrors.email}
									/>
									{fieldErrors.email && (
										<p className='text-sm text-destructive flex items-center gap-1'>
											<AlertIcon size={AlertIconSize.SM} />
											{fieldErrors.email}
										</p>
									)}
								</div>

								<div className='space-y-2'>
									<Label>
										{t(AuthKey.PASSWORD)} <span className='text-destructive'>*</span>
									</Label>
									<Input
										id='password'
										name='password'
										type='password'
										placeholder={t(AuthKey.PASSWORD_PLACEHOLDER)}
										value={formData.password}
										onChange={handleChange}
										disabled={isLoading}
										autoComplete='new-password'
										error={!!fieldErrors.password}
									/>
									{fieldErrors.password && (
										<p className='text-sm text-destructive flex items-center gap-1'>
											<AlertIcon size={AlertIconSize.SM} />
											{fieldErrors.password}
										</p>
									)}
								</div>

								<div className='space-y-2'>
									<Label>
										{t(AuthKey.CONFIRM_PASSWORD)} <span className='text-destructive'>*</span>
									</Label>
									<div className='relative'>
										<Input
											id='confirmPassword'
											name='confirmPassword'
											type='password'
											placeholder={t(AuthKey.CONFIRM_PASSWORD_PLACEHOLDER)}
											value={formData.confirmPassword}
											onChange={handleChange}
											disabled={isLoading}
											autoComplete='new-password'
											error={!!fieldErrors.confirmPassword}
										/>
										{formData.confirmPassword &&
											formData.password === formData.confirmPassword &&
											!fieldErrors.confirmPassword && (
												<CheckCircle className={cn('form-success-icon', SEMANTIC_ICON_TEXT.success)} />
											)}
									</div>
									{fieldErrors.confirmPassword && (
										<p className='text-sm text-destructive flex items-center gap-1'>
											<AlertIcon size={AlertIconSize.SM} />
											{fieldErrors.confirmPassword}
										</p>
									)}
								</div>

								<div className='space-y-2'>
									<div className='flex items-start gap-3'>
										<Checkbox
											id='terms-privacy'
											checked={acceptedTermsPrivacy}
											onCheckedChange={checked => {
												setAcceptedTermsPrivacy(checked === true);
												setTermsPrivacyError(null);
											}}
											disabled={isLoading}
											className='mt-0.5'
											aria-invalid={!!termsPrivacyError}
											aria-describedby={termsPrivacyError ? 'terms-privacy-error' : undefined}
										/>
										<label
											htmlFor='terms-privacy'
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
										<p id='terms-privacy-error' className='text-sm text-destructive flex items-center gap-1'>
											<AlertIcon size={AlertIconSize.SM} />
											{termsPrivacyError}
										</p>
									) : null}
								</div>

								<Button type='submit' className='w-full' size={ButtonSize.LG} disabled={isLoading || !isFormValid}>
									{!isLoading ? (
										t(AuthKey.CREATE_ACCOUNT)
									) : (
										<Spinner size={ComponentSize.SM} message={LoadingMessages.CREATING_ACCOUNT} messageInline />
									)}
								</Button>
							</form>

							<div className='relative'>
								<div className='absolute inset-0 flex items-center'>
									<Separator className='w-full' />
								</div>
								<div className='relative flex justify-center text-xs uppercase'>
									<span className='bg-card px-2 text-muted-foreground'>{t(AuthKey.OR_CONTINUE_WITH)}</span>
								</div>
							</div>

							<GoogleAuthButton onClick={handleGoogleSignup} disabled={isLoading || !acceptedTermsPrivacy} />

							<div className='text-center text-sm'>
								<span className='text-muted-foreground'>{t(AuthKey.ALREADY_HAVE_ACCOUNT)} </span>
								<Button
									type='button'
									variant={VariantBase.MINIMAL}
									size={ButtonSize.SM}
									onClick={() => navigate(ROUTES.LOGIN, { state: { modal: isModal } })}
									className='link-primary h-auto p-0 font-medium'
								>
									{t(AuthKey.SIGN_IN)}
								</Button>
							</div>
						</>
					)}
				</CardContent>
			</Card>
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
