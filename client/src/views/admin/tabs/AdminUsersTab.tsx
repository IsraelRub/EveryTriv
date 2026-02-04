import { Users } from 'lucide-react';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	UserSearchSection,
	UsersTable,
} from '@/components';

export function AdminUsersTab() {
	return (
		<Tabs defaultValue='all' className='w-full'>
			<TabsList className='grid w-full grid-cols-2'>
				<TabsTrigger value='all'>All Users</TabsTrigger>
				<TabsTrigger value='search'>Search</TabsTrigger>
			</TabsList>
			<TabsContent value='all' className='mt-4 md:mt-6'>
				<Card className='border-muted bg-muted/20'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Users className='h-5 w-5' />
							All Users
						</CardTitle>
						<CardDescription>Complete list of all registered users</CardDescription>
					</CardHeader>
					<CardContent>
						<UsersTable />
					</CardContent>
				</Card>
			</TabsContent>
			<TabsContent value='search' className='mt-4 md:mt-6'>
				<Card className='border-muted bg-muted/20'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Users className='h-5 w-5' />
							Search Users
						</CardTitle>
						<CardDescription>Search and filter users by various criteria</CardDescription>
					</CardHeader>
					<CardContent>
						<UserSearchSection />
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}
