import { ChangeEvent, useState } from 'react';

import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { ToastVariant } from '@/constants';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Input,
	Label,
} from '@/components';

import { useChangePassword, useToast } from '@/hooks';

import type { ChangePasswordDialogProps, PasswordFieldErrors } from '@/types';

import { validatePasswordForm, validatePasswordLength, validatePasswordMatch } from '@/utils/validation';

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
	const { toast } = useToast();
	const changePassword = useChangePassword();
	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});
	const [fieldErrors, setFieldErrors] = useState<PasswordFieldErrors>({});

	const isFormValid = (): boolean => {
		if (!passwordData.currentPassword.trim()) return false;
		const passwordValidation = validatePasswordForm({
			newPassword: passwordData.newPassword,
			confirmPassword: passwordData.confirmPassword,
		});
		return passwordValidation.isValid;
	};

	const validateField = (name: string, value: string): string | null => {
		if (name === 'currentPassword') {
			if (!value.trim()) return 'Current password is required';
		}
		if (name === 'newPassword') {
			const validation = validatePasswordLength(value);
			if (!validation.isValid) {
				return validation.errors[0] || 'Invalid password';
			}
		}
		if (name === 'confirmPassword') {
			const validation = validatePasswordMatch(passwordData.newPassword, value);
			if (!validation.isValid) {
				return validation.errors[0] || 'Invalid password confirmation';
			}
		}
		return null;
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setPasswordData(prev => ({
			...prev,
			[name]: value,
		}));

		const fieldError = validateField(name, value);
		setFieldErrors(prev => ({
			...prev,
			[name]: fieldError || undefined,
		}));

		if (name === 'newPassword' && passwordData.confirmPassword) {
			const confirmError = validateField('confirmPassword', passwordData.confirmPassword);
			setFieldErrors(prev => ({
				...prev,
				confirmPassword: confirmError || undefined,
			}));
		}
	};

	const handlePasswordChange = async () => {
		const currentPasswordError = validateField('currentPassword', passwordData.currentPassword);
		const newPasswordError = validateField('newPassword', passwordData.newPassword);
		const confirmPasswordError = validateField('confirmPassword', passwordData.confirmPassword);

		const newFieldErrors: typeof fieldErrors = {};
		if (currentPasswordError) newFieldErrors.currentPassword = currentPasswordError;
		if (newPasswordError) newFieldErrors.newPassword = newPasswordError;
		if (confirmPasswordError) newFieldErrors.confirmPassword = confirmPasswordError;

		setFieldErrors(newFieldErrors);

		if (currentPasswordError || newPasswordError || confirmPasswordError) {
			return;
		}

		if (!isFormValid()) {
			return;
		}

		try {
			await changePassword.mutateAsync({
				currentPassword: passwordData.currentPassword,
				newPassword: passwordData.newPassword,
			});
			onOpenChange(false);
			setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
			setFieldErrors({});
			toast({
				title: 'Password Changed',
				description: 'Your password has been updated successfully.',
			});
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to change password. Please check your current password.',
				variant: ToastVariant.DESTRUCTIVE,
			});
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Change Password</AlertDialogTitle>
					<AlertDialogDescription>Enter your current password and choose a new one.</AlertDialogDescription>
				</AlertDialogHeader>
				<div className='space-y-4 py-4'>
					<div className='space-y-2'>
						<Label htmlFor='current-password'>Current Password</Label>
						<Input
							id='current-password'
							name='currentPassword'
							type='password'
							value={passwordData.currentPassword}
							onChange={handleChange}
							className={fieldErrors.currentPassword ? 'border-destructive' : ''}
						/>
						{fieldErrors.currentPassword && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='h-3 w-3' />
								{fieldErrors.currentPassword}
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
							onChange={handleChange}
							className={fieldErrors.newPassword ? 'border-destructive' : ''}
						/>
						{fieldErrors.newPassword && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='h-3 w-3' />
								{fieldErrors.newPassword}
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
								onChange={handleChange}
								className={fieldErrors.confirmPassword ? 'border-destructive' : ''}
							/>
							{passwordData.confirmPassword &&
								passwordData.newPassword === passwordData.confirmPassword &&
								!fieldErrors.confirmPassword && (
									<CheckCircle2 className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500' />
								)}
						</div>
						{fieldErrors.confirmPassword && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='h-3 w-3' />
								{fieldErrors.confirmPassword}
							</p>
						)}
					</div>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handlePasswordChange} disabled={changePassword.isPending || !isFormValid()}>
						{changePassword.isPending ? 'Changing...' : 'Change Password'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
