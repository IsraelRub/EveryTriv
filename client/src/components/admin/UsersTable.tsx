import { useState } from 'react';

import { ChevronLeft, ChevronRight, User } from 'lucide-react';

import type { AdminUserData } from '@shared/types';
import { calculateCurrentPage, calculateTotalPages } from '@shared/utils';

import { ButtonSize, ButtonVariant, VariantBase } from '@/constants';

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components';

import { useAllUsers } from '@/hooks';

import { formatDate } from '@/utils';

/**
 * Users Table Component
 * Displays a table of all users with pagination
 */
export function UsersTable() {
	const [limit] = useState(50);
	const [offset, setOffset] = useState(0);

	const { data, isLoading, error } = useAllUsers(limit, offset);

	const users = data?.users ?? [];
	const totalUsers = data?.pagination?.total ?? users.length;
	const currentPage = calculateCurrentPage(offset, limit);
	const totalPages = calculateTotalPages(totalUsers, limit);

	const handlePreviousPage = () => {
		if (offset > 0) {
			setOffset(Math.max(0, offset - limit));
		}
	};

	const handleNextPage = () => {
		if (offset + limit < totalUsers) {
			setOffset(offset + limit);
		}
	};

	const handleRowClick = (userId: string) => {
		// This could open UserSearchSection with the selected user
		// For now, we'll just ignore it
		void userId;
	};

	if (error) {
		return (
			<Card>
				<CardContent className='p-6 text-center'>
					<p className='text-destructive'>Failed to load users. Please try again later.</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<User className='h-5 w-5' />
					All Users
				</CardTitle>
				<CardDescription>
					Showing {users.length} of {totalUsers} users
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className='space-y-4'>
						{[...Array(5)].map((_, i) => (
							<Skeleton key={i} className='h-12 w-full' />
						))}
					</div>
				) : users.length === 0 ? (
					<div className='text-center py-8 text-muted-foreground'>
						<User className='h-12 w-12 mx-auto mb-4 opacity-50' />
						<p>No users found</p>
					</div>
				) : (
					<>
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Created At</TableHead>
										<TableHead>Last Login</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{users.map((user: AdminUserData) => (
										<TableRow key={user.id} onClick={() => handleRowClick(user.id)} className='cursor-pointer'>
											<TableCell className='font-medium'>{user.email}</TableCell>
											<TableCell>
												<Badge variant={user.role === 'admin' ? VariantBase.DEFAULT : VariantBase.SECONDARY}>
													{user.role}
												</Badge>
											</TableCell>
											<TableCell>{user.createdAt ? formatDate(user.createdAt) : '-'}</TableCell>
											<TableCell>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{totalPages > 1 && (
							<div className='flex items-center justify-between mt-4'>
								<div className='text-sm text-muted-foreground'>
									Page {currentPage} of {totalPages}
								</div>
								<div className='flex gap-2'>
									<Button
										variant={ButtonVariant.OUTLINE}
										size={ButtonSize.SM}
										onClick={handlePreviousPage}
										disabled={offset === 0 || isLoading}
									>
										<ChevronLeft className='h-4 w-4 mr-1' />
										Previous
									</Button>
									<Button
										variant={ButtonVariant.OUTLINE}
										size={ButtonSize.SM}
										onClick={handleNextPage}
										disabled={offset + limit >= totalUsers || isLoading}
									>
										Next
										<ChevronRight className='h-4 w-4 ml-1' />
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
