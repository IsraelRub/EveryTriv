import { ChangeEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, Key } from 'lucide-react';

import { validatePassword, validatePasswordMatch } from '@shared/validation';

import { ButtonVariant, VALIDATION_MESSAGES } from '@/constants';
import {
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
import { clientLogger as logger } from '@/services';
import type { ChangePasswordDialogProps, PasswordFieldErrors } from '@/types';
import { cn } from '@/utils';

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [passwordFieldErrors, setPasswordFieldErrors] = useState<PasswordFieldErrors>({});
	const changePassword = useChangePassword();

	const validatePasswordField = (name: string, value: string): string | null => {
		if (name === 'currentPassword') {
			if (!value.trim()) return VALIDATION_MESSAGES.CURRENT_PASSWORD_REQUIRED;
		}
		if (name === 'newPassword') {
			const validation = validatePassword(value);
			return validation.isValid ? null : (validation.errors[0] ?? VALIDATION_MESSAGES.PASSWORD_INVALID);
		}
		if (name === 'confirmPassword') {
			const validation = validatePasswordMatch(passwordData.newPassword, value);
			return validation.isValid ? null : (validation.errors[0] ?? VALIDATION_MESSAGES.PASSWORD_CONFIRMATION_INVALID);
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

	const isPasswordFormValid = (): boolean => {
		if (!passwordData.currentPassword.trim()) return false;
		const passwordValidation = validatePassword(passwordData.newPassword);
		const passwordMatchValidation =
			passwordData.confirmPassword !== undefined
				? validatePasswordMatch(passwordData.newPassword, passwordData.confirmPassword)
				: { isValid: true, errors: [] };
		return passwordValidation.isValid && passwordMatchValidation.isValid;
	};

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

		if (!isPasswordFormValid()) {
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
			logger.authSuccess('Your password has been updated successfully.');
		} catch (error) {
			// authError will handle toast display for unexpected errors
			// Expected errors (like CURRENT_PASSWORD_INCORRECT) are handled in auth.service.ts
			logger.authError(error instanceof Error ? error : new Error('Failed to change password'), {
				contextMessage: 'Failed to change password',
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
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Key className='h-5 w-5' />
						Change Password
					</DialogTitle>
					<DialogDescription>Update your account password</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					<div className='space-y-2'>
						<Label htmlFor='current-password'>Current Password</Label>
						<Input
							id='current-password'
							name='currentPassword'
							type='password'
							value={passwordData.currentPassword}
							onChange={handlePasswordChange}
							className={cn(passwordFieldErrors.currentPassword && 'border-destructive')}
							placeholder='Enter current password'
						/>
						{passwordFieldErrors.currentPassword && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='h-3 w-3' />
								{passwordFieldErrors.currentPassword}
							</p>
						)}
					</div>
					<div className='space-y-2'>
						<Label htmlFor='new-password'>New Password</Label>
						<Input
							id='new-password'
							name='newPassword'
							type='password'
							value={passwordData.newPassword}
							onChange={handlePasswordChange}
							className={cn(passwordFieldErrors.newPassword && 'border-destructive')}
							placeholder='Enter new password'
						/>
						{passwordFieldErrors.newPassword && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='h-3 w-3' />
								{passwordFieldErrors.newPassword}
							</p>
						)}
					</div>
					<div className='space-y-2'>
						<Label htmlFor='confirm-password'>Confirm New Password</Label>
						<div className='relative'>
							<Input
								id='confirm-password'
								name='confirmPassword'
								type='password'
								value={passwordData.confirmPassword}
								onChange={handlePasswordChange}
								className={cn(passwordFieldErrors.confirmPassword && 'border-destructive')}
								placeholder='Confirm new password'
							/>
							{passwordData.confirmPassword &&
								passwordData.newPassword === passwordData.confirmPassword &&
								!passwordFieldErrors.confirmPassword && (
									<CheckCircle2 className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500' />
								)}
						</div>
						{passwordFieldErrors.confirmPassword && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='h-3 w-3' />
								{passwordFieldErrors.confirmPassword}
							</p>
						)}
					</div>
					<div className='flex gap-2 pt-2'>
						<Button variant={ButtonVariant.OUTLINE} onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button onClick={handlePasswordSave} disabled={changePassword.isPending}>
							{changePassword.isPending ? 'Changing...' : 'Change Password'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
