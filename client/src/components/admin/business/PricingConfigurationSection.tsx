import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BadgeDollarSign, Loader2, RotateCcw, Save } from 'lucide-react';

import { CREDIT_PURCHASE_PACKAGES } from '@shared/constants';
import type { CreditPurchaseOption } from '@shared/types';

import { AdminKey, ButtonSize, CommonKey, SkeletonVariant, VariantBase } from '@/constants';
import type { CreditPackageEditItem } from '@/types';
import {
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
import { useAdminPricing, useUpdateAdminPricing } from '@/hooks';

function toLocalPackages(packages: CreditPurchaseOption[]): CreditPackageEditItem[] {
	return packages.map(p => ({
		id: p.id,
		credits: p.credits,
		price: p.price,
		tier: undefined,
	}));
}

export function PricingConfigurationSection() {
	const { t } = useTranslation('admin');
	const { data: pricingData, isLoading: pricingLoading } = useAdminPricing();
	const updatePricing = useUpdateAdminPricing();
	const [localPackages, setLocalPackages] = useState<CreditPackageEditItem[]>([]);
	const [hasChanges, setHasChanges] = useState(false);

	useEffect(() => {
		if (pricingData?.packages) {
			setLocalPackages(toLocalPackages(pricingData.packages));
			setHasChanges(false);
		}
	}, [pricingData?.packages]);

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

	const handlePriceChange = useCallback((index: number, value: number) => {
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
		updatePricing.mutate(
			{ packages: localPackages },
			{
				onSuccess: () => setHasChanges(false),
			}
		);
	}, [localPackages, updatePricing]);

	const handleRestoreDefaults = useCallback(() => {
		const defaults: CreditPackageEditItem[] = CREDIT_PURCHASE_PACKAGES.map(p => ({
			id: p.id,
			credits: p.credits,
			price: p.price,
			tier: p.tier,
		}));
		setLocalPackages(defaults);
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
					<div className='flex gap-2'>
						<Button
							size={ButtonSize.SM}
							variant={VariantBase.OUTLINE}
							onClick={handleRestoreDefaults}
							disabled={updatePricing.isPending}
						>
							<RotateCcw className='h-4 w-4' />
							{t(AdminKey.RESTORE_DEFAULTS)}
						</Button>
						<Button size={ButtonSize.SM} onClick={handleSave} disabled={!hasChanges || updatePricing.isPending}>
							{!updatePricing.isPending ? <Save className='h-4 w-4' /> : <Loader2 className='h-4 w-4 animate-spin' />}
							{t(CommonKey.SAVE)}
						</Button>
					</div>
				</div>
				<CardDescription>{t(AdminKey.PRICING_CONFIG_DESC)}</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t(AdminKey.PACKAGE_ID)}</TableHead>
							<TableHead>{t(AdminKey.CREDITS_TABLE_HEAD)}</TableHead>
							<TableHead>{t(AdminKey.PRICE_USD)}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{localPackages.map((pkg, index) => (
							<TableRow key={pkg.id}>
								<TableCell className='font-mono text-muted-foreground'>{pkg.id}</TableCell>
								<TableCell>
									<Input
										type='number'
										min={1}
										value={pkg.credits}
										onChange={e => handleCreditsChange(index, Number(e.target.value) || 0)}
										className='w-24'
									/>
								</TableCell>
								<TableCell>
									<Input
										type='number'
										min={0.01}
										step={0.01}
										value={pkg.price}
										onChange={e => handlePriceChange(index, Number(e.target.value) || 0)}
										className='w-24'
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				{updatePricing.isError && (
					<p className='mt-2 text-sm text-destructive'>
						{updatePricing.error instanceof Error ? updatePricing.error.message : t(AdminKey.FAILED_TO_SAVE)}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
