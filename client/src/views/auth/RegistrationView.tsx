import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

import { LengthKey, validateEmail, validatePasswordMatch, validateStringLength } from '@shared/validation';

import {
	AlertIconSize,
	AlertVariant,
	AudioKey,
	AuthKey,
	ButtonSize,
	Colors,
	ComponentSize,
	LoadingMessages,
	PLACEHOLDER_EMAIL,
	ROUTES,
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
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CloseButton,
	GoogleAuthButton,
	Input,
	Label,
	Separator,
	Spinner,
} from '@/components';
import { useModalRoute, useRegister } from '@/hooks';

export function RegistrationView() {
	const { t } = useTranslation(['auth', 'validation', 'errors']);
	const navigate = useNavigate();
	const registerMutation = useRegister();
	const { isModal, closeModal, returnUrl } = useModalRoute();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
		confirmPassword: '',
		firstName: '',
		lastName: '',
	});
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});

	const isLoading = registerMutation.isPending;

	const emailValidation = validateEmail(formData.email);
	const passwordValidation = validateStringLength(formData.password, LengthKey.PASSWORD);
	const passwordMatchValidation =
		formData.confirmPassword !== undefined
			? validatePasswordMatch(formData.password, formData.confirmPassword)
			: { isValid: true, errors: [] };
	const isFormValid = emailValidation.isValid && passwordValidation.isValid && passwordMatchValidation.isValid;

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
			if (isModal) {
				closeModal();
			} else {
				navigate(returnUrl ?? '/');
			}
		} catch (err) {
			setError(getTranslatedErrorMessage(t, err));
			audioService.play(AudioKey.ERROR);
		}
	};

	const handleGoogleSignup = async () => {
		setError(null);
		try {
			await authService.initiateGoogleLogin();
		} catch (err) {
			setError(getTranslatedErrorMessage(t, err));
		}
	};

	return (
		<Card className='w-full max-w-md relative'>
			{!isModal && <CloseButton className='absolute top-4 left-4' />}
			<CardHeader className='text-center space-y-2'>
				<CardTitle className='text-3xl font-bold'>{t(AuthKey.CREATE_ACCOUNT)}</CardTitle>
				<CardDescription>{t(AuthKey.JOIN_EVERY_TRIV_SHORT)}</CardDescription>
			</CardHeader>

			<CardContent className='space-y-6'>
				{error && (
					<Alert variant={AlertVariant.DESTRUCTIVE}>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='firstName'>{t(AuthKey.FIRST_NAME)}</Label>
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
							<Label htmlFor='lastName'>{t(AuthKey.LAST_NAME)}</Label>
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
						<Label htmlFor='email'>
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
						<Label htmlFor='password'>
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
						<Label htmlFor='confirmPassword'>
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
									<CheckCircle
										className={cn('form-success-icon', Colors.GREEN_500.text)}
										fill='currentColor'
										strokeWidth={0}
									/>
								)}
						</div>
						{fieldErrors.confirmPassword && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertIcon size={AlertIconSize.SM} />
								{fieldErrors.confirmPassword}
							</p>
						)}
					</div>

					<Button type='submit' className='w-full' size={ButtonSize.LG} disabled={isLoading || !isFormValid}>
						{isLoading ? (
							<Spinner size={ComponentSize.SM} message={LoadingMessages.CREATING_ACCOUNT} messageInline />
						) : (
							t(AuthKey.CREATE_ACCOUNT)
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

				<GoogleAuthButton onClick={handleGoogleSignup} disabled={isLoading} />

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
			</CardContent>
		</Card>
	);
}
