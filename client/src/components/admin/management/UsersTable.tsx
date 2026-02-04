import { useState } from 'react';
import { User } from 'lucide-react';

import type { AdminUserData } from '@shared/types';
import { calculateTotalPages } from '@shared/utils';

import { DEFAULT_ITEMS_PER_PAGE, VariantBase } from '@/constants';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, PaginationButtons, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableRowsSkeleton } from '@/components';
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
				<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<User className='h-5 w-5' />
							All Users
						</CardTitle>
						<CardDescription>
							Showing {startIndex + 1}-{endIndex} of {totalUsers} users
						</CardDescription>
					</div>
					{totalPages > 1 && (
						<PaginationButtons
							onPrevious={handlePreviousPage}
							onNext={handleNextPage}
							hasPrevious={hasPreviousPage}
							hasNext={hasNextPage}
							currentPage={Math.floor(offset / limit) + 1}
							totalPages={totalPages}
							disabled={isLoading}
						/>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<TableRowsSkeleton rowCount={5} />
				) : users.length === 0 ? (
					<EmptyState
						data='users'
						icon={User}
						title='No users found'
						description='No users have been registered yet.'
						action={null}
					/>
				) : (
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
											<TableCell>{formatDate(user.createdAt)}</TableCell>
											<TableCell>{formatDate(user.lastLogin, 'Never')}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
