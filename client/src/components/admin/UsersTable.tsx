import { useState } from 'react';
import { User } from 'lucide-react';

import type { AdminUserData } from '@shared/types';
import { calculateTotalPages } from '@shared/utils';

import { DEFAULT_ITEMS_PER_PAGE, VariantBase } from '@/constants';
import {
	Badge,
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
	TablePagination,
	TableRow,
} from '@/components';
import { useAllUsers } from '@/hooks';
import { formatDate } from '@/utils';

export function UsersTable() {
	const [limit] = useState(DEFAULT_ITEMS_PER_PAGE);
	const [offset, setOffset] = useState(0);

	const { data, isLoading, error } = useAllUsers(limit, offset);

	const users = data?.users ?? [];
	const totalUsers = data?.pagination?.total ?? users.length;
	const totalPages = calculateTotalPages(totalUsers, limit);

	const startIndex = offset;
	const endIndex = Math.min(offset + limit, totalUsers);
	const hasNextPage = offset + limit < totalUsers;
	const hasPreviousPage = offset > 0;

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
							<TablePagination
								totalPages={totalPages}
								totalItems={totalUsers}
								startIndex={startIndex}
								endIndex={endIndex}
								hasNextPage={hasNextPage}
								hasPreviousPage={hasPreviousPage}
								onNextPage={handleNextPage}
								onPreviousPage={handlePreviousPage}
								isLoading={isLoading}
								itemsLabel='users'
							/>
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
											<TableCell>{formatDate(user.createdAt)}</TableCell>
											<TableCell>{formatDate(user.lastLogin, 'Never')}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
