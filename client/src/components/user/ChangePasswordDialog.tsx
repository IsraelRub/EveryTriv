import { useState } from 'react';

import { VALIDATION_LIMITS } from '@shared/constants';

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

interface ChangePasswordDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
	const { toast } = useToast();
	const changePassword = useChangePassword();
	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	const handlePasswordChange = async () => {
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast({
				title: 'Error',
				description: 'New passwords do not match.',
				variant: 'destructive',
			});
			return;
		}

		if (passwordData.newPassword.length < VALIDATION_LIMITS.PASSWORD.MIN_LENGTH) {
			toast({
				title: 'Error',
				description: `Password must be at least ${VALIDATION_LIMITS.PASSWORD.MIN_LENGTH} characters.`,
				variant: 'destructive',
			});
			return;
		}

		try {
			await changePassword.mutateAsync({
				currentPassword: passwordData.currentPassword,
				newPassword: passwordData.newPassword,
			});
			onOpenChange(false);
			setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
			toast({
				title: 'Password Changed',
				description: 'Your password has been updated successfully.',
			});
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to change password. Please check your current password.',
				variant: 'destructive',
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
							type='password'
							value={passwordData.currentPassword}
							onChange={e => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='new-password'>New Password</Label>
						<Input
							id='new-password'
							type='password'
							value={passwordData.newPassword}
							onChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='confirm-password'>Confirm New Password</Label>
						<Input
							id='confirm-password'
							type='password'
							value={passwordData.confirmPassword}
							onChange={e => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
						/>
					</div>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handlePasswordChange} disabled={changePassword.isPending}>
						{changePassword.isPending ? 'Changing...' : 'Change Password'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
