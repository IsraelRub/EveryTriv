import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeDollarSign, ExternalLink, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';

import {
	ADMIN_CREDIT_PACKAGES_COUNT_MAX,
	ADMIN_CREDIT_PACKAGES_COUNT_MIN,
	CREDIT_PURCHASE_PACKAGES,
	ERROR_MESSAGES,
	TIME_PERIODS_MS,
} from '@shared/constants';
import { generateCreditPackageId } from '@shared/utils';

import { AdminKey, ButtonSize, CommonKey, QUERY_KEYS, ROUTES, SkeletonVariant, VariantBase } from '@/constants';
import type { AdminPricingResponse, AdminPricingUpdatePayload, CreditPackageEditItem } from '@/types';
import { adminService } from '@/services';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	SectionCard,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components';
import { useUserRole } from '@/hooks';

const MIN_PACKAGE_CREDITS = 1;
const MAX_PACKAGE_CREDITS = 100_000;
const MIN_PACKAGE_PRICE = 0.01;
const MAX_PACKAGE_PRICE = 99_999.99;

function toLocalPackages(packages: AdminPricingResponse['packages']): CreditPackageEditItem[] {
	return packages.map(p => ({
		id: p.id,
		credits: p.credits,
		price: p.price,
		tier: undefined,
	}));
}

function validatePackageCredits(value: number): boolean {
	return Number.isInteger(value) && value >= MIN_PACKAGE_CREDITS && value <= MAX_PACKAGE_CREDITS;
}

function validatePackagePrice(value: number): boolean {
	return Number.isFinite(value) && value >= MIN_PACKAGE_PRICE && value <= MAX_PACKAGE_PRICE;
}

function validatePackagesForSave(packages: CreditPackageEditItem[]): AdminKey | null {
	if (packages.length < ADMIN_CREDIT_PACKAGES_COUNT_MIN || packages.length > ADMIN_CREDIT_PACKAGES_COUNT_MAX) {
		return AdminKey.PRICING_VALIDATION_PACKAGE_COUNT;
	}
	const ids = packages.map(p => p.id);
	if (new Set(ids).size !== ids.length) {
		return AdminKey.PRICING_VALIDATION_DUPLICATE_IDS;
	}
	for (const pkg of packages) {
		if (!validatePackageCredits(pkg.credits)) {
			return AdminKey.PRICING_VALIDATION_CREDITS;
		}
		if (!validatePackagePrice(pkg.price)) {
			return AdminKey.PRICING_VALIDATION_PRICE;
		}
	}
	return null;
}

export function PricingConfigurationSection() {
	const { t } = useTranslation('admin');
	const queryClient = useQueryClient();
	const { isAdmin } = useUserRole();
	const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

	const { data: pricingData, isLoading: pricingLoading } = useQuery<AdminPricingResponse>({
		queryKey: QUERY_KEYS.admin.pricing(),
		queryFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return adminService.getAdminPricing();
		},
		enabled: isAdmin,
		staleTime: TIME_PERIODS_MS.MINUTE,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
	});

	const updatePricing = useMutation({
		mutationFn: (payload: AdminPricingUpdatePayload) => adminService.updateAdminPricing(payload),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.pricing() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credits.packages() });
		},
	});
	const [localPackages, setLocalPackages] = useState<CreditPackageEditItem[]>([]);
	const [hasChanges, setHasChanges] = useState(false);

	useEffect(() => {
		if (pricingData?.packages) {
			setLocalPackages(toLocalPackages(pricingData.packages));
			setHasChanges(false);
		}
	}, [pricingData?.packages]);

	const firstInvalidKey = useMemo(() => validatePackagesForSave(localPackages), [localPackages]);

	const handleCreditsChange = useCallback((index: number, raw: string) => {
		const parsed = Number.parseInt(raw, 10);
		const value = Number.isFinite(parsed) ? parsed : 0;
		setLocalPackages(prev => {
			const next = [...prev];
			const current = next[index];
			if (current == null) return next;
			next[index] = { ...current, credits: value };
			return next;
		});
		setHasChanges(true);
	}, []);

	const handlePriceChange = useCallback((index: number, raw: string) => {
		const parsed = Number.parseFloat(raw);
		const value = Number.isFinite(parsed) ? parsed : 0;
		setLocalPackages(prev => {
			const next = [...prev];
			const current = next[index];
			if (current == null) return next;
			next[index] = { ...current, price: value };
			return next;
		});
		setHasChanges(true);
	}, []);

	const handleSave = useCallback(() => {
		const invalid = validatePackagesForSave(localPackages);
		if (invalid != null) {
			return;
		}
		updatePricing.mutate(
			{ packages: localPackages },
			{
				onSuccess: () => setHasChanges(false),
			}
		);
	}, [localPackages, updatePricing]);

	const applyRestoreDefaults = useCallback(() => {
		const defaults: CreditPackageEditItem[] = CREDIT_PURCHASE_PACKAGES.map(p => ({
			id: p.id,
			credits: p.credits,
			price: p.price,
			tier: p.tier,
		}));
		setLocalPackages(defaults);
		setHasChanges(true);
		setRestoreDialogOpen(false);
	}, []);

	const handleAddPackage = useCallback(() => {
		setLocalPackages(prev => {
			if (prev.length >= ADMIN_CREDIT_PACKAGES_COUNT_MAX) {
				return prev;
			}
			return [
				...prev,
				{
					id: generateCreditPackageId(),
					credits: 100,
					price: 4.99,
				},
			];
		});
		setHasChanges(true);
	}, []);

	const handleRemovePackage = useCallback((index: number) => {
		setLocalPackages(prev => {
			if (prev.length <= ADMIN_CREDIT_PACKAGES_COUNT_MIN) {
				return prev;
			}
			return prev.filter((_, i) => i !== index);
		});
		setHasChanges(true);
	}, []);

	if (pricingLoading) {
		return (
			<SectionCard title={t(AdminKey.PRICING_CONFIG_TITLE)} icon={BadgeDollarSign}>
				<Skeleton variant={SkeletonVariant.BlockTall} className='h-48' />
			</SectionCard>
		);
	}

	return (
		<>
			<Card className='card-muted-tint'>
				<CardHeader>
					<div className='flex flex-wrap items-center justify-between gap-2'>
						<div className='flex flex-wrap items-center gap-2'>
							<CardTitle className='flex items-center gap-2'>
								<BadgeDollarSign className='h-5 w-5 text-primary' />
								{t(AdminKey.PRICING_CONFIG_TITLE)}
							</CardTitle>
							{pricingData?.isDefault ? (
								<Badge variant={VariantBase.SECONDARY}>{t(AdminKey.DEFAULT_BADGE)}</Badge>
							) : (
								<Badge variant={VariantBase.OUTLINE}>{t(AdminKey.CUSTOM_BADGE)}</Badge>
							)}
						</div>
						<div className='flex flex-wrap gap-2'>
							<Button
								size={ButtonSize.SM}
								variant={VariantBase.OUTLINE}
								onClick={() => setRestoreDialogOpen(true)}
								disabled={updatePricing.isPending}
							>
								<RotateCcw className='h-4 w-4' />
								{t(AdminKey.RESTORE_DEFAULTS)}
							</Button>
							<Button
								size={ButtonSize.SM}
								onClick={handleSave}
								disabled={!hasChanges || updatePricing.isPending || firstInvalidKey != null}
							>
								{!updatePricing.isPending ? <Save className='h-4 w-4' /> : <Loader2 className='h-4 w-4 animate-spin' />}
								{t(CommonKey.SAVE)}
							</Button>
						</div>
					</div>
					<CardDescription>{t(AdminKey.PRICING_CONFIG_DESC)}</CardDescription>
					<Link
						to={ROUTES.PAYMENT}
						target='_blank'
						rel='noopener noreferrer'
						className='mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline'
					>
						<ExternalLink className='h-4 w-4 shrink-0' aria-hidden />
						{t(AdminKey.VIEW_PAYMENT_PAGE)}
					</Link>
				</CardHeader>
				<CardContent>
					{firstInvalidKey != null && (
						<p className='mb-3 text-sm text-destructive' role='status'>
							{t(firstInvalidKey, {
								min: ADMIN_CREDIT_PACKAGES_COUNT_MIN,
								max: ADMIN_CREDIT_PACKAGES_COUNT_MAX,
							})}
						</p>
					)}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t(AdminKey.PACKAGE_ID)}</TableHead>
								<TableHead>{t(AdminKey.CREDITS_TABLE_HEAD)}</TableHead>
								<TableHead>{t(AdminKey.PRICE_USD)}</TableHead>
								<TableHead className='w-[1%] whitespace-nowrap text-end'>{t(AdminKey.PRICING_ACTIONS)}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{localPackages.map((pkg, index) => {
								const creditsInvalid = !validatePackageCredits(pkg.credits);
								const priceInvalid = !validatePackagePrice(pkg.price);
								return (
									<TableRow key={pkg.id}>
										<TableCell className='font-mono text-muted-foreground'>{pkg.id}</TableCell>
										<TableCell>
											<Input
												type='number'
												min={MIN_PACKAGE_CREDITS}
												max={MAX_PACKAGE_CREDITS}
												step={1}
												value={pkg.credits}
												onChange={e => handleCreditsChange(index, e.target.value)}
												className='w-28'
												aria-invalid={creditsInvalid}
											/>
										</TableCell>
										<TableCell>
											<Input
												type='number'
												min={MIN_PACKAGE_PRICE}
												max={MAX_PACKAGE_PRICE}
												step={0.01}
												value={pkg.price}
												onChange={e => handlePriceChange(index, e.target.value)}
												className='w-28'
												aria-invalid={priceInvalid}
											/>
										</TableCell>
										<TableCell className='text-end'>
											<Button
												type='button'
												size={ButtonSize.SM}
												variant={VariantBase.OUTLINE}
												className='shrink-0'
												disabled={updatePricing.isPending || localPackages.length <= ADMIN_CREDIT_PACKAGES_COUNT_MIN}
												onClick={() => handleRemovePackage(index)}
												aria-label={t(AdminKey.PRICING_REMOVE_PACKAGE)}
											>
												<Trash2 className='h-4 w-4' aria-hidden />
											</Button>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
					<div className='mt-3 flex justify-end'>
						<Button
							type='button'
							size={ButtonSize.SM}
							variant={VariantBase.OUTLINE}
							disabled={updatePricing.isPending || localPackages.length >= ADMIN_CREDIT_PACKAGES_COUNT_MAX}
							onClick={handleAddPackage}
						>
							<Plus className='h-4 w-4 me-1' aria-hidden />
							{t(AdminKey.PRICING_ADD_PACKAGE)}
						</Button>
					</div>
					{updatePricing.isError && (
						<p className='mt-2 text-sm text-destructive'>
							{updatePricing.error instanceof Error ? updatePricing.error.message : t(AdminKey.FAILED_TO_SAVE)}
						</p>
					)}
				</CardContent>
			</Card>

			<AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t(AdminKey.RESTORE_DEFAULTS_CONFIRM_TITLE)}</AlertDialogTitle>
						<AlertDialogDescription>{t(AdminKey.RESTORE_DEFAULTS_CONFIRM_DESC)}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t(CommonKey.CANCEL)}</AlertDialogCancel>
						<AlertDialogAction type='button' onClick={applyRestoreDefaults}>
							{t(AdminKey.RESTORE_DEFAULTS)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
