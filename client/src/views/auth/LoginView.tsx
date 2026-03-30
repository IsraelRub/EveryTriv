import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { isNonEmptyString } from '@shared/utils';
import { validateEmail } from '@shared/validation';

import {
	AlertIconSize,
	AlertVariant,
	AudioKey,
	AuthKey,
	ButtonSize,
	ComponentSize,
	LoadingKey,
	PLACEHOLDER_EMAIL,
	ROUTES,
	ValidationKey,
	VariantBase,
} from '@/constants';
import type { LoginFieldErrors } from '@/types';
import { audioService, authService } from '@/services';
import { getTranslatedErrorMessage } from '@/utils';
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
import { useLogin, useModalRoute } from '@/hooks';

export function LoginView() {
	const { t } = useTranslation(['auth', 'loading', 'validation']);
	const navigate = useNavigate();
	const loginMutation = useLogin();
	const { isModal, closeModal, returnUrl } = useModalRoute();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

	const isLoading = loginMutation.isPending;
	const isFormValid = validateEmail(email).isValid && isNonEmptyString(password);

	const validateField = (name: string, value: string): string | null => {
		switch (name) {
			case 'email': {
				const validation = validateEmail(value);
				return validation.isValid ? null : (validation.errors[0] ?? t(ValidationKey.EMAIL_INVALID));
			}
			case 'password':
				if (!value.trim()) return t(ValidationKey.PASSWORD_REQUIRED);
				break;
		}
		return null;
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		switch (name) {
			case 'email':
				setEmail(value);
				break;
			case 'password':
				setPassword(value);
				break;
		}
		setError(null);

		const fieldError = validateField(name, value);
		setFieldErrors(prev => ({
			...prev,
			[name]: fieldError ?? undefined,
		}));
	};

	const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		const emailError = validateField('email', email);
		const passwordError = validateField('password', password);

		const newFieldErrors: typeof fieldErrors = {};
		if (emailError) newFieldErrors.email = emailError;
		if (passwordError) newFieldErrors.password = passwordError;

		setFieldErrors(newFieldErrors);

		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		if (emailError || passwordError) {
			audioService.play(AudioKey.ERROR);
			return;
		}

		try {
			await loginMutation.mutateAsync({ email, password });
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

	const handleGoogleLogin = async () => {
		setError(null);
		try {
			await authService.initiateGoogleLogin();
		} catch (err) {
			setError(getTranslatedErrorMessage(t, err));
		}
	};

	return (
		<Card className='w-full max-w-md relative'>
			<CloseButton className='absolute top-4 left-4' />
			<CardHeader className='text-center space-y-2'>
				<CardTitle className='text-3xl font-bold'>{t(AuthKey.WELCOME_BACK)}</CardTitle>
				<CardDescription>{t(AuthKey.SIGN_IN_TO_CONTINUE)}</CardDescription>
			</CardHeader>

			<CardContent className='space-y-6'>
				{error && (
					<Alert variant={AlertVariant.DESTRUCTIVE}>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleLogin} className='space-y-4'>
					<div className='space-y-2'>
						<Label>{t(AuthKey.EMAIL)}</Label>
						<Input
							id='email'
							name='email'
							type='email'
							placeholder={PLACEHOLDER_EMAIL}
							value={email}
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
						<Label>{t(AuthKey.PASSWORD)}</Label>
						<Input
							id='password'
							name='password'
							type='password'
							placeholder={t(AuthKey.PASSWORD_PLACEHOLDER)}
							value={password}
							onChange={handleChange}
							disabled={isLoading}
							autoComplete='current-password'
							error={!!fieldErrors.password}
						/>
						{fieldErrors.password && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertIcon size={AlertIconSize.SM} />
								{fieldErrors.password}
							</p>
						)}
					</div>

					<Button type='submit' className='w-full' size={ButtonSize.LG} disabled={isLoading || !isFormValid}>
						{!isLoading ? (
							t(AuthKey.SIGN_IN)
						) : (
							<Spinner size={ComponentSize.SM} message={t(LoadingKey.SIGNING_IN)} messageInline />
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

				<GoogleAuthButton onClick={handleGoogleLogin} disabled={isLoading} />

				<div className='text-center text-sm'>
					<span className='text-muted-foreground'>{t(AuthKey.DONT_HAVE_ACCOUNT)} </span>
					<Button
						type='button'
						variant={VariantBase.MINIMAL}
						size={ButtonSize.SM}
						onClick={() => navigate(ROUTES.REGISTER, { state: { modal: isModal } })}
						className='link-primary h-auto p-0 font-medium'
					>
						{t(AuthKey.SIGN_UP)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
