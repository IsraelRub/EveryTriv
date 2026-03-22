import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Key } from 'lucide-react';

import { LengthKey, validatePasswordMatch, validateStringLength } from '@shared/validation';

import { AlertIconSize, AuthKey, Colors, CommonKey, ValidationKey, VariantBase } from '@/constants';
import type { ChangePasswordDialogProps, ChangePasswordValidationErrorKey } from '@/types';
import { clientLogger as logger } from '@/services';
import { cn } from '@/utils';
import {
	AlertIcon,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
} from '@/components';
import { useChangePassword } from '@/hooks';

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
	const { t } = useTranslation(['auth', 'validation', 'common']);
	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [passwordFieldErrors, setPasswordFieldErrors] = useState<
		Record<string, ChangePasswordValidationErrorKey | undefined>
	>({});
	const changePassword = useChangePassword();

	const validatePasswordField = (name: string, value: string): ChangePasswordValidationErrorKey | null => {
		if (name === 'currentPassword') {
			if (!value.trim()) return 'currentPasswordRequired';
		}
		if (name === 'newPassword') {
			const validation = validateStringLength(value, LengthKey.PASSWORD);
			return validation.isValid ? null : 'passwordInvalid';
		}
		if (name === 'confirmPassword') {
			const validation = validatePasswordMatch(passwordData.newPassword, value);
			return validation.isValid ? null : 'passwordConfirmationInvalid';
		}
		return null;
	};

	const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setPasswordData(prev => ({
			...prev,
			[name]: value,
		}));

		const fieldError = validatePasswordField(name, value);
		setPasswordFieldErrors(prev => ({
			...prev,
			[name]: fieldError ?? undefined,
		}));

		if (name === 'newPassword' && passwordData.confirmPassword) {
			const confirmError = validatePasswordField('confirmPassword', passwordData.confirmPassword);
			setPasswordFieldErrors(prev => ({
				...prev,
				confirmPassword: confirmError ?? undefined,
			}));
		}
	};

	const passwordValidation = validateStringLength(passwordData.newPassword, LengthKey.PASSWORD);
	const passwordMatchValidation =
		passwordData.confirmPassword !== undefined
			? validatePasswordMatch(passwordData.newPassword, passwordData.confirmPassword)
			: { isValid: true, errors: [] };
	const isPasswordFormValid =
		passwordData.currentPassword.trim() !== '' && passwordValidation.isValid && passwordMatchValidation.isValid;

	const handlePasswordSave = async () => {
		const currentPasswordError = validatePasswordField('currentPassword', passwordData.currentPassword);
		const newPasswordError = validatePasswordField('newPassword', passwordData.newPassword);
		const confirmPasswordError = validatePasswordField('confirmPassword', passwordData.confirmPassword);

		const newFieldErrors: typeof passwordFieldErrors = {};
		if (currentPasswordError) newFieldErrors.currentPassword = currentPasswordError;
		if (newPasswordError) newFieldErrors.newPassword = newPasswordError;
		if (confirmPasswordError) newFieldErrors.confirmPassword = confirmPasswordError;

		setPasswordFieldErrors(newFieldErrors);

		if (currentPasswordError ?? newPasswordError ?? confirmPasswordError) {
			return;
		}

		try {
			await changePassword.mutateAsync({
				currentPassword: passwordData.currentPassword,
				newPassword: passwordData.newPassword,
			});
			setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
			setPasswordFieldErrors({});
			onOpenChange(false);
			logger.authSuccess(t(AuthKey.PASSWORD_UPDATED_SUCCESS));
		} catch (error) {
			logger.authError(error instanceof Error ? error : new Error(t(AuthKey.FAILED_TO_CHANGE_PASSWORD)), {
				contextMessage: t(AuthKey.FAILED_TO_CHANGE_PASSWORD),
			});
		}
	};

	const handleDialogClose = (shouldClose: boolean) => {
		if (shouldClose) {
			setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
			setPasswordFieldErrors({});
		}
		onOpenChange(shouldClose);
	};

	return (
		<Dialog open={open} onOpenChange={handleDialogClose}>
			<DialogContent className='max-w-md max-h-[90vh] flex flex-col'>
				<DialogHeader className='flex-shrink-0'>
					<DialogTitle className='flex items-center gap-2'>
						<Key className='h-5 w-5 text-primary' />
						{t(AuthKey.CHANGE_PASSWORD)}
					</DialogTitle>
					<DialogDescription>{t(AuthKey.UPDATE_ACCOUNT_PASSWORD)}</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-4 view-scroll-inline'>
					<div className='space-y-2'>
						<Label>{t(AuthKey.CURRENT_PASSWORD)}</Label>
						<Input
							id='current-password'
							name='currentPassword'
							type='password'
							value={passwordData.currentPassword}
							onChange={handlePasswordChange}
							error={!!passwordFieldErrors.currentPassword}
							placeholder={t(AuthKey.ENTER_CURRENT_PASSWORD)}
						/>
						{passwordFieldErrors.currentPassword && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertIcon size={AlertIconSize.SM} />
								{t(
									passwordFieldErrors.currentPassword === 'currentPasswordRequired'
										? ValidationKey.CURRENT_PASSWORD_REQUIRED
										: passwordFieldErrors.currentPassword === 'passwordInvalid'
											? ValidationKey.PASSWORD_INVALID
											: ValidationKey.PASSWORD_CONFIRMATION_INVALID
								)}
							</p>
						)}
					</div>
					<div className='space-y-2'>
						<Label>{t(AuthKey.NEW_PASSWORD)}</Label>
						<Input
							id='new-password'
							name='newPassword'
							type='password'
							value={passwordData.newPassword}
							onChange={handlePasswordChange}
							error={!!passwordFieldErrors.newPassword}
							placeholder={t(AuthKey.ENTER_NEW_PASSWORD)}
						/>
						{passwordFieldErrors.newPassword && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertIcon size={AlertIconSize.SM} />
								{t(`validation:${passwordFieldErrors.newPassword}`)}
							</p>
						)}
					</div>
					<div className='space-y-2'>
						<Label>{t(AuthKey.CONFIRM_NEW_PASSWORD)}</Label>
						<div className='relative'>
							<Input
								id='confirm-password'
								name='confirmPassword'
								type='password'
								value={passwordData.confirmPassword}
								onChange={handlePasswordChange}
								error={!!passwordFieldErrors.confirmPassword}
								placeholder={t(AuthKey.CONFIRM_NEW_PASSWORD_PLACEHOLDER)}
							/>
							{passwordData.confirmPassword &&
								passwordData.newPassword === passwordData.confirmPassword &&
								!passwordFieldErrors.confirmPassword && (
									<CheckCircle
										className={cn('form-success-icon', Colors.GREEN_500.text)}
									/>
								)}
						</div>
						{passwordFieldErrors.confirmPassword && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertIcon size={AlertIconSize.SM} />
								{t(
									passwordFieldErrors.confirmPassword === 'currentPasswordRequired'
										? ValidationKey.CURRENT_PASSWORD_REQUIRED
										: passwordFieldErrors.confirmPassword === 'passwordInvalid'
											? ValidationKey.PASSWORD_INVALID
											: ValidationKey.PASSWORD_CONFIRMATION_INVALID
								)}
							</p>
						)}
					</div>
					<div className='flex gap-2 pt-2 flex-shrink-0'>
						<Button variant={VariantBase.OUTLINE} onClick={() => onOpenChange(false)}>
							{t(CommonKey.CANCEL)}
						</Button>
						<Button onClick={handlePasswordSave} disabled={changePassword.isPending || !isPasswordFormValid}>
							{changePassword.isPending ? t(AuthKey.CHANGING) : t(AuthKey.CHANGE_PASSWORD_BUTTON)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
