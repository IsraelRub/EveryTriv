import type { DashboardTabEntry } from '@/types/domain/dashboard-tabs.types';

export const ADMIN_TAB_ENTRIES: DashboardTabEntry[] = [
	{
		label: 'Performance',
		loader: async () => {
			const m = await import('@/views/admin/tabs/AdminPerformanceTab');
			return { default: m.AdminPerformanceTab };
		},
	},
	{
		label: 'Topics',
		loader: async () => {
			const m = await import('@/views/admin/tabs/AdminTopicsTab');
			return { default: m.AdminTopicsTab };
		},
	},
	{
		label: 'Trivia',
		loader: async () => {
			const m = await import('@/views/admin/tabs/AdminGamesTab');
			return { default: m.AdminGamesTab };
		},
	},
	{
		label: 'Users',
		loader: async () => {
			const m = await import('@/views/admin/tabs/AdminUsersTab');
			return { default: m.AdminUsersTab };
		},
	},
	{
		label: 'Business',
		loader: async () => {
			const m = await import('@/views/admin/tabs/AdminBusinessTab');
			return { default: m.AdminBusinessTab };
		},
	},
	{
		label: 'System',
		loader: async () => {
			const m = await import('@/views/admin/tabs/AdminSystemTab');
			return { default: m.AdminSystemTab };
		},
	},
	{
		label: 'AI Providers',
		loader: async () => {
			const m = await import('@/views/admin/tabs/AdminAiProvidersTab');
			return { default: m.AdminAiProvidersTab };
		},
	},
];
