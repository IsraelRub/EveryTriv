import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPaypal } from 'react-icons/fa6';
import { CreditCard } from 'lucide-react';

import { ERROR_MESSAGES, PaymentMethod, PaymentStatus } from '@shared/constants';
import type { PayPalOrderRequest } from '@shared/types';
import { isPaymentMethod } from '@shared/validation';

import {
	AlertVariant,
	ButtonSize,
	CommonKey,
	ComponentSize,
	LoadingKey,
	PaymentKey,
	SEMANTIC_ICON_TEXT,
	VariantBase,
} from '@/constants';
import type { CreditsPurchaseResponse, PaymentDialogProps, PayPalButtonInstance } from '@/types';
import { clientLogger as logger } from '@/services';
import { cn, getTranslatedErrorMessage } from '@/utils';
import {
	Alert,
	AlertDescription,
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	RadioGroup,
	RadioGroupItem,
	Spinner,
} from '@/components';
import { usePurchaseCredits } from '@/hooks';

function isManualCreditPaymentMethodEnabledInClient(): boolean {
	return import.meta.env.VITE_ENABLE_MANUAL_CREDIT_PAYMENT === 'true' || import.meta.env.MODE === 'development';
}

export function PaymentDialog({ open, onOpenChange, package: pkg, onSuccess }: PaymentDialogProps) {
	const { t } = useTranslation(['payment', 'loading', 'common', 'errors']);
	const purchaseCredits = usePurchaseCredits();
	const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.PAYPAL);
	const [isProcessing, setIsProcessing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [paypalButtonContainer, setPaypalButtonContainer] = useState<HTMLDivElement | null>(null);
	const paypalButtonRef = useRef<PayPalButtonInstance | null>(null);
	const paypalScriptRef = useRef<HTMLScriptElement | null>(null);
	const [paypalOrderRequest, setPaypalOrderRequest] = useState<PayPalOrderRequest | null>(null);
	const [paypalCheckoutStarted, setPaypalCheckoutStarted] = useState(false);
	const [paypalWidgetReady, setPaypalWidgetReady] = useState(false);
	const [manualConfirmOpen, setManualConfirmOpen] = useState(false);

	const manualMethodAvailable = useMemo(
		() =>
			isManualCreditPaymentMethodEnabledInClient() &&
			(pkg.supportedMethods?.includes(PaymentMethod.MANUAL_CREDIT) ?? false),
		[pkg.supportedMethods]
	);

	const totalCredits = useMemo(() => pkg.credits + (pkg.bonus ?? 0), [pkg.credits, pkg.bonus]);

	const handlePaymentSuccess = useCallback(
		(result: CreditsPurchaseResponse) => {
			logger.paymentSuccess(result.message ?? t(PaymentKey.CREDITS_ADDED_TO_ACCOUNT_SHORT), {
				packageId: pkg.id,
				credits: totalCredits,
			});
			onSuccess(totalCredits);
			onOpenChange(false);
		},
		[totalCredits, pkg.id, onSuccess, onOpenChange, t]
	);

	const cleanupPayPal = useCallback(() => {
		setPaypalWidgetReady(false);
		if (paypalButtonRef.current) {
			paypalButtonRef.current.close();
			paypalButtonRef.current = null;
		}
		if (paypalScriptRef.current?.parentNode) {
			paypalScriptRef.current.parentNode.removeChild(paypalScriptRef.current);
			paypalScriptRef.current = null;
		}
	}, []);

	const renderPayPalButton = useCallback(() => {
		if (!window.paypal || !paypalButtonContainer) {
			setIsProcessing(false);
			return;
		}

		if (paypalButtonRef.current) {
			paypalButtonRef.current.close();
			paypalButtonRef.current = null;
		}

		if (!paypalOrderRequest) {
			setIsProcessing(false);
			return;
		}

		const button = window.paypal.Buttons({
			createOrder: async (_paypalData, actions) => {
				try {
					return actions.order.create({
						purchase_units: [
							{
								amount: {
									value: paypalOrderRequest.amount,
									currency_code: paypalOrderRequest.currencyCode,
								},
								description: pkg.description ?? t(PaymentKey.CREDITS_PACKAGE, { count: pkg.credits }),
							},
						],
					});
				} catch (error) {
					const errorMsg = getTranslatedErrorMessage(t, error);
					logger.paymentFailed(pkg.id, errorMsg, {
						errorInfo: { message: errorMsg },
						packageId: pkg.id,
						paymentMethod: PaymentMethod.PAYPAL,
						operation: 'createOrder',
					});
					throw error;
				}
			},
			onApprove: async (data: { orderID: string }) => {
				try {
					setIsProcessing(true);
					const result = await purchaseCredits.mutateAsync({
						packageId: pkg.id,
						paymentMethod: PaymentMethod.PAYPAL,
						paypalOrderId: data.orderID,
					});

					if (result.status === PaymentStatus.COMPLETED) {
						handlePaymentSuccess(result);
					} else {
						throw new Error(result.message ?? ERROR_MESSAGES.payment.PAYMENT_NOT_COMPLETED);
					}
				} catch (error) {
					const errorMsg = getTranslatedErrorMessage(t, error);
					logger.paymentFailed(pkg.id, errorMsg, {
						errorInfo: { message: errorMsg },
						packageId: pkg.id,
						paymentMethod: PaymentMethod.PAYPAL,
						orderId: data.orderID,
						operation: 'onApprove',
					});
					setErrorMessage(errorMsg);
				} finally {
					setIsProcessing(false);
				}
			},
			onError: (err: Error) => {
				const errorMsg = getTranslatedErrorMessage(t, err);
				logger.paymentFailed(pkg.id, errorMsg, {
					errorInfo: { message: errorMsg },
					packageId: pkg.id,
					paymentMethod: PaymentMethod.PAYPAL,
					operation: 'onError',
				});
				setErrorMessage(errorMsg);
				setIsProcessing(false);
			},
			onCancel: () => {
				setIsProcessing(false);
			},
		});

		if (paypalButtonContainer) {
			void button.render(paypalButtonContainer).then(() => {
				setPaypalWidgetReady(true);
			});
			paypalButtonRef.current = button;
			setIsProcessing(false);
		}
	}, [
		paypalButtonContainer,
		paypalOrderRequest,
		pkg.id,
		pkg.description,
		pkg.credits,
		purchaseCredits,
		handlePaymentSuccess,
		t,
	]);

	const loadPayPalScript = useCallback(
		(clientId: string, environment: string) => {
			if (window.paypal) {
				renderPayPalButton();
				return;
			}

			if (paypalScriptRef.current) {
				const existingScript = paypalScriptRef.current;
				const originalOnload = existingScript.onload;
				existingScript.onload = (event: Event) => {
					if (originalOnload && typeof originalOnload === 'function') {
						try {
							originalOnload.call(existingScript, event);
						} catch {
							// Ignore errors from original handler
						}
					}
					renderPayPalButton();
				};
				return;
			}

			const script = document.createElement('script');
			const env = environment === 'production' ? '' : 'sandbox';
			script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture${env ? `&buyer-country=US` : ''}`;
			script.async = true;
			script.onload = () => {
				renderPayPalButton();
			};
			script.onerror = () => {
				const errorMsg = t(PaymentKey.PAYPAL_SDK_FAILED);
				logger.paymentFailed(pkg.id, errorMsg, {
					errorInfo: { message: errorMsg },
					packageId: pkg.id,
					paymentMethod: PaymentMethod.PAYPAL,
				});
				setErrorMessage(errorMsg);
				setIsProcessing(false);
				setPaypalCheckoutStarted(false);
				paypalScriptRef.current = null;
			};
			document.body.appendChild(script);
			paypalScriptRef.current = script;
		},
		[pkg.id, renderPayPalButton, t]
	);

	const initializePayPal = useCallback(async () => {
		try {
			setIsProcessing(true);
			const result = await purchaseCredits.mutateAsync({
				packageId: pkg.id,
				paymentMethod: PaymentMethod.PAYPAL,
			});

			if (result.status === PaymentStatus.REQUIRES_ACTION && result.paypalOrderRequest) {
				setPaypalOrderRequest(result.paypalOrderRequest);
				loadPayPalScript(result.paypalOrderRequest.clientId, result.paypalOrderRequest.environment);
			} else if (result.status === PaymentStatus.COMPLETED) {
				handlePaymentSuccess(result);
			} else {
				throw new Error(result.message ?? ERROR_MESSAGES.payment.FAILED_TO_INITIALIZE_PAYPAL);
			}
		} catch (error) {
			const errorMsg = getTranslatedErrorMessage(t, error);
			logger.paymentFailed(pkg.id, errorMsg, {
				errorInfo: { message: errorMsg },
				packageId: pkg.id,
				paymentMethod: PaymentMethod.PAYPAL,
			});
			setErrorMessage(errorMsg);
			setIsProcessing(false);
			setPaypalCheckoutStarted(false);
		}
	}, [pkg.id, purchaseCredits, handlePaymentSuccess, loadPayPalScript, t]);

	const handleManualPayment = useCallback(async () => {
		setIsProcessing(true);
		try {
			const result = await purchaseCredits.mutateAsync({
				packageId: pkg.id,
				paymentMethod: PaymentMethod.MANUAL_CREDIT,
			});

			if (result.status === PaymentStatus.COMPLETED) {
				handlePaymentSuccess(result);
			} else {
				throw new Error(result.message ?? ERROR_MESSAGES.payment.PAYMENT_NOT_COMPLETED);
			}
		} catch (error) {
			const errorMsg = getTranslatedErrorMessage(t, error);
			logger.paymentFailed(pkg.id, errorMsg, {
				errorInfo: { message: errorMsg },
				packageId: pkg.id,
				paymentMethod: PaymentMethod.MANUAL_CREDIT,
				operation: 'handleManualPayment',
			});
			setErrorMessage(errorMsg);
		} finally {
			setIsProcessing(false);
		}
	}, [pkg.id, purchaseCredits, handlePaymentSuccess, t]);

	const handlePaymentMethodChange = useCallback(
		(value: string) => {
			if (!isPaymentMethod(value)) {
				return;
			}
			setErrorMessage(null);
			if (value !== PaymentMethod.PAYPAL) {
				cleanupPayPal();
				setPaypalOrderRequest(null);
				setPaypalCheckoutStarted(false);
			}
			setSelectedMethod(value);
		},
		[cleanupPayPal]
	);

	useEffect(() => {
		if (!manualMethodAvailable && selectedMethod === PaymentMethod.MANUAL_CREDIT) {
			setSelectedMethod(PaymentMethod.PAYPAL);
		}
	}, [manualMethodAvailable, selectedMethod]);

	useEffect(() => {
		if (!open) {
			cleanupPayPal();
			setPaypalOrderRequest(null);
			setIsProcessing(false);
			setErrorMessage(null);
			setSelectedMethod(PaymentMethod.PAYPAL);
			setPaypalCheckoutStarted(false);
			setPaypalWidgetReady(false);
			setManualConfirmOpen(false);
			return;
		}

		if (
			selectedMethod !== PaymentMethod.PAYPAL ||
			!paypalCheckoutStarted ||
			paypalButtonContainer == null ||
			paypalOrderRequest != null
		) {
			return;
		}

		void initializePayPal();
	}, [
		open,
		selectedMethod,
		paypalCheckoutStarted,
		paypalButtonContainer,
		paypalOrderRequest,
		initializePayPal,
		cleanupPayPal,
	]);

	useEffect(() => {
		return () => {
			cleanupPayPal();
		};
	}, [cleanupPayPal]);

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className='sm:max-w-lg max-h-[90vh] flex flex-col'>
					<DialogHeader className='flex-shrink-0'>
						<DialogTitle>{t(PaymentKey.COMPLETE_PAYMENT)}</DialogTitle>
						<DialogDescription>
							{t(PaymentKey.CHOOSE_PAYMENT_METHOD_TO_PURCHASE, { count: totalCredits })}
						</DialogDescription>
					</DialogHeader>

					<div className='dialog-body'>
						{errorMessage && (
							<Alert variant={AlertVariant.DESTRUCTIVE}>
								<AlertDescription>{errorMessage}</AlertDescription>
							</Alert>
						)}

						<Card>
							<CardHeader>
								<CardTitle className='text-lg'>{t(PaymentKey.ORDER_SUMMARY)}</CardTitle>
							</CardHeader>
							<CardContent className='space-y-2'>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>{t(PaymentKey.PACKAGE_LABEL)}</span>
									<span className='font-medium'>
										{pkg.description ?? t(PaymentKey.CREDITS_PACKAGE, { count: pkg.credits })}
									</span>
								</div>
								{pkg.bonus && pkg.bonus > 0 && (
									<div className={cn('flex justify-between', SEMANTIC_ICON_TEXT.success)}>
										<span>{t(PaymentKey.BONUS_LABEL)}</span>
										<span className='font-medium'>+{pkg.bonus} credits</span>
									</div>
								)}
								<div className='flex justify-between text-lg font-bold pt-2 border-t'>
									<span>{t(PaymentKey.TOTAL_LABEL)}</span>
									<span>{pkg.priceDisplay}</span>
								</div>
							</CardContent>
						</Card>

						<div className='space-y-4'>
							<Label className='text-base font-semibold'>{t(PaymentKey.PAYMENT_METHOD)}</Label>
							{manualMethodAvailable ? (
								<RadioGroup value={selectedMethod} onValueChange={handlePaymentMethodChange} className='space-y-2'>
									<Card className='flex items-center space-x-2 p-4 hover:bg-accent cursor-pointer'>
										<RadioGroupItem value={PaymentMethod.PAYPAL} id='paypal' />
										<Label htmlFor='paypal' className='flex-1 cursor-pointer flex items-center gap-2'>
											<FaPaypal className='h-5 w-5 text-white' />
											<span>PayPal</span>
										</Label>
									</Card>
									<Card className='flex items-center space-x-2 p-4 hover:bg-accent cursor-pointer'>
										<RadioGroupItem value={PaymentMethod.MANUAL_CREDIT} id='manual' />
										<Label htmlFor='manual' className='flex-1 cursor-pointer flex items-center gap-2'>
											<CreditCard className='h-5 w-5' />
											<span>{t(PaymentKey.CREDIT_CARD_MANUAL)}</span>
										</Label>
									</Card>
								</RadioGroup>
							) : (
								<p className='text-sm text-muted-foreground'>
									<span className='inline-flex items-center gap-2 font-medium text-foreground'>
										<FaPaypal className='h-5 w-5' />
										PayPal
									</span>
								</p>
							)}
						</div>

						{selectedMethod === PaymentMethod.PAYPAL && (
							<div className='space-y-2'>
								<Label>{t(PaymentKey.PAYPAL_PAYMENT)}</Label>
								{!paypalCheckoutStarted ? (
									<Button
										type='button'
										className='w-full'
										onClick={() => {
											setPaypalWidgetReady(false);
											setPaypalCheckoutStarted(true);
										}}
										disabled={isProcessing}
										size={ButtonSize.LG}
									>
										{t(PaymentKey.CONTINUE_TO_PAYPAL)}
									</Button>
								) : (
									<div className='relative min-h-[52px] rounded-md border border-border p-2'>
										<div ref={setPaypalButtonContainer} className='min-h-[45px]' />
										{isProcessing && !paypalWidgetReady && (
											<div className='absolute inset-0 flex items-center justify-center rounded-md bg-background/80'>
												<Spinner size={ComponentSize.XL} className='text-primary' message={t(LoadingKey.PROCESSING)} />
											</div>
										)}
									</div>
								)}
							</div>
						)}

						{selectedMethod === PaymentMethod.MANUAL_CREDIT && manualMethodAvailable && (
							<div className='space-y-2'>
								<Label>{t(PaymentKey.CREDIT_CARD_PAYMENT)}</Label>
								<Button
									type='button'
									className='w-full'
									onClick={() => setManualConfirmOpen(true)}
									disabled={isProcessing}
									size={ButtonSize.LG}
								>
									{isProcessing ? (
										<Spinner size={ComponentSize.SM} message={t(LoadingKey.PROCESSING)} messageInline />
									) : (
										<>
											<CreditCard className='mr-2 h-4 w-4' />
											{t(PaymentKey.PAY_AMOUNT, { amount: pkg.priceDisplay })}
										</>
									)}
								</Button>
							</div>
						)}
					</div>

					<DialogFooter className='flex-shrink-0'>
						<Button variant={VariantBase.OUTLINE} onClick={() => onOpenChange(false)} disabled={isProcessing}>
							{t(CommonKey.CANCEL)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={manualConfirmOpen} onOpenChange={setManualConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t(PaymentKey.MANUAL_PAYMENT_CONFIRM_TITLE)}</AlertDialogTitle>
						<AlertDialogDescription>{t(PaymentKey.MANUAL_PAYMENT_CONFIRM_DESCRIPTION)}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isProcessing}>{t(CommonKey.CANCEL)}</AlertDialogCancel>
						<AlertDialogAction
							disabled={isProcessing}
							onClick={() => {
								setManualConfirmOpen(false);
								void handleManualPayment();
							}}
						>
							{t(PaymentKey.MANUAL_PAYMENT_CONFIRM_PAY)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
