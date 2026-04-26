import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeDollarSign, ExternalLink, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';

import { CREDIT_PURCHASE_PACKAGES, ERROR_MESSAGES, TIME_PERIODS_MS, VALIDATION_COUNT } from '@shared/constants';
import { clamp, generateCreditPackageId } from '@shared/utils';

import { AdminKey, ButtonSize, CommonKey, QUERY_KEYS, Routes, SkeletonVariant, VariantBase } from '@/constants';
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
	NumberInput,
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

function normalizeAdminPackagePrice(value: number): number {
	const { MIN, MAX } = VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PRICE;
	return clamp(Math.round(value), MIN, MAX);
}

function toLocalPackages(packages: AdminPricingResponse['packages']): CreditPackageEditItem[] {
	return packages.map(p => ({
		id: p.id,
		credits: p.credits,
		price: normalizeAdminPackagePrice(p.price),
		priceIls: normalizeAdminPackagePrice(p.priceIls),
		tier: undefined,
	}));
}

function validatePackageCredits(value: number): boolean {
	const { MIN, MAX } = VALIDATION_COUNT.CREDITS;
	return Number.isInteger(value) && value >= MIN && value <= MAX;
}

function validatePackagePrice(value: number): boolean {
	const { MIN, MAX } = VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PRICE;
	return Number.isFinite(value) && Number.isInteger(value) && value >= MIN && value <= MAX;
}

function validatePackagesForSave(packages: CreditPackageEditItem[]): AdminKey | null {
	if (
		packages.length < VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PACKAGES_COUNT.MIN ||
		packages.length > VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PACKAGES_COUNT.MAX
	) {
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
		if (!validatePackagePrice(pkg.priceIls)) {
			return AdminKey.PRICING_VALIDATION_PRICE_ILS;
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

	const handleCreditsChange = useCallback((index: number, value: number) => {
		setLocalPackages(prev => {
			const next = [...prev];
			const current = next[index];
			if (current == null) return next;
			next[index] = { ...current, credits: value };
			return next;
		});
		setHasChanges(true);
	}, []);

	const handlePriceUsdChange = useCallback((index: number, value: number) => {
		setLocalPackages(prev => {
			const next = [...prev];
			const current = next[index];
			if (current == null) return next;
			next[index] = { ...current, price: value };
			return next;
		});
		setHasChanges(true);
	}, []);

	const handlePriceIlsChange = useCallback((index: number, value: number) => {
		setLocalPackages(prev => {
			const next = [...prev];
			const current = next[index];
			if (current == null) return next;
			next[index] = { ...current, priceIls: value };
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
			priceIls: p.priceIls,
			tier: p.tier,
		}));
		setLocalPackages(defaults);
		setHasChanges(true);
		setRestoreDialogOpen(false);
	}, []);

	const handleAddPackage = useCallback(() => {
		setLocalPackages(prev => {
			if (prev.length >= VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PACKAGES_COUNT.MAX) {
				return prev;
			}
			return [
				...prev,
				{
					id: generateCreditPackageId(),
					credits: 100,
					price: 5,
					priceIls: 20,
				},
			];
		});
		setHasChanges(true);
	}, []);

	const handleRemovePackage = useCallback((index: number) => {
		setLocalPackages(prev => {
			if (prev.length <= VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PACKAGES_COUNT.MIN) {
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
						to={Routes.PAYMENT}
						target='_blank'
						rel='noopener noreferrer'
						className='mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline'
					>
						<ExternalLink className='h-4 w-4 shrink-0' />
						{t(AdminKey.VIEW_PAYMENT_PAGE)}
					</Link>
				</CardHeader>
				<CardContent>
					{firstInvalidKey != null && (
						<p className='mb-3 text-sm text-destructive'>
							{t(firstInvalidKey, {
								min: VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PACKAGES_COUNT.MIN,
								max: VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PACKAGES_COUNT.MAX,
								minCredits: VALIDATION_COUNT.CREDITS.MIN,
								maxCredits: VALIDATION_COUNT.CREDITS.MAX,
								minPrice: VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PRICE.MIN,
								maxPrice: VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PRICE.MAX,
							})}
						</p>
					)}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t(AdminKey.PACKAGE_ID)}</TableHead>
								<TableHead>{t(AdminKey.CREDITS_TABLE_HEAD)}</TableHead>
								<TableHead>{t(AdminKey.PRICE_USD)}</TableHead>
								<TableHead>{t(AdminKey.PRICE_ILS)}</TableHead>
								<TableHead className='w-[1%] whitespace-nowrap text-end'>{t(AdminKey.PRICING_ACTIONS)}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{localPackages.map((pkg, index) => {
								const creditsInvalid = !validatePackageCredits(pkg.credits);
								const priceInvalid = !validatePackagePrice(pkg.price);
								const priceIlsInvalid = !validatePackagePrice(pkg.priceIls);
								return (
									<TableRow key={pkg.id}>
										<TableCell className='font-mono text-muted-foreground'>{pkg.id}</TableCell>
										<TableCell>
											<NumberInput
												value={pkg.credits}
												onChange={v => handleCreditsChange(index, v)}
												min={VALIDATION_COUNT.CREDITS.MIN}
												max={VALIDATION_COUNT.CREDITS.MAX}
												step={1}
												disabled={updatePricing.isPending}
												error={creditsInvalid}
											/>
										</TableCell>
										<TableCell>
											<NumberInput
												value={pkg.price}
												onChange={v => handlePriceUsdChange(index, v)}
												min={VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PRICE.MIN}
												max={VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PRICE.MAX}
												step={VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PRICE.STEP}
												disabled={updatePricing.isPending}
												error={priceInvalid}
											/>
										</TableCell>
										<TableCell>
											<NumberInput
												value={pkg.priceIls}
												onChange={v => handlePriceIlsChange(index, v)}
												min={VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PRICE.MIN}
												max={VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PRICE.MAX}
												step={VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PRICE.STEP}
												disabled={updatePricing.isPending}
												error={priceIlsInvalid}
											/>
										</TableCell>
										<TableCell className='text-end'>
											<Button
												type='button'
												size={ButtonSize.SM}
												variant={VariantBase.OUTLINE}
												className='shrink-0'
												disabled={
													updatePricing.isPending ||
													localPackages.length <= VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PACKAGES_COUNT.MIN
												}
												onClick={() => handleRemovePackage(index)}
											>
												<Trash2 className='h-4 w-4' />
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
							disabled={
								updatePricing.isPending ||
								localPackages.length >= VALIDATION_COUNT.ADMIN_CREDIT_PACKAGE.PACKAGES_COUNT.MAX
							}
							onClick={handleAddPackage}
						>
							<Plus className='h-4 w-4 me-1' />
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
