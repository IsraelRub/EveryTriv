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
	Colors,
	CommonKey,
	ComponentSize,
	LoadingKey,
	PaymentKey,
	VariantBase,
} from '@/constants';
import type { CreditsPurchaseResponse, PaymentDialogProps, PayPalButtonInstance } from '@/types';
import { clientLogger as logger } from '@/services';
import { cn, getTranslatedErrorMessage } from '@/utils';
import {
	Alert,
	AlertDescription,
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

	// Memoize total credits calculation
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

	// Cleanup PayPal button and script
	const cleanupPayPal = useCallback(() => {
		if (paypalButtonRef.current) {
			paypalButtonRef.current.close();
			paypalButtonRef.current = null;
		}
		if (paypalScriptRef.current?.parentNode) {
			paypalScriptRef.current.parentNode.removeChild(paypalScriptRef.current);
			paypalScriptRef.current = null;
		}
	}, []);

	// Render PayPal button - must be defined before loadPayPalScript
	const renderPayPalButton = useCallback(() => {
		if (!window.paypal || !paypalButtonContainer) {
			setIsProcessing(false);
			return;
		}

		// Clean up existing button before creating new one
		if (paypalButtonRef.current) {
			paypalButtonRef.current.close();
			paypalButtonRef.current = null;
		}

		if (!paypalOrderRequest) {
			setIsProcessing(false);
			return;
		}

		const button = window.paypal.Buttons({
			createOrder: async (_data, actions) => {
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
			button.render(paypalButtonContainer);
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

	// Load PayPal SDK script - must be defined before initializePayPal
	const loadPayPalScript = useCallback(
		(clientId: string, environment: string) => {
			// Check if PayPal SDK is already loaded
			if (window.paypal) {
				renderPayPalButton();
				return;
			}

			// Check if script is already being loaded - wait for it to complete
			if (paypalScriptRef.current) {
				// Script is loading, attach listener to existing script
				const existingScript = paypalScriptRef.current;
				const originalOnload = existingScript.onload;
				existingScript.onload = (event: Event) => {
					if (originalOnload && typeof originalOnload === 'function') {
						try {
							// Call original handler with event (HTMLScriptElement.onload always expects Event parameter)
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
				paypalScriptRef.current = null;
			};
			document.body.appendChild(script);
			paypalScriptRef.current = script;
		},
		[pkg.id, renderPayPalButton, t]
	);

	// Initialize PayPal payment flow
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
		}
	}, [pkg.id, purchaseCredits, handlePaymentSuccess, loadPayPalScript, t]);

	// Handle manual payment method
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

	// Handle payment method selection change
	const handlePaymentMethodChange = useCallback((value: string) => {
		if (isPaymentMethod(value)) {
			setSelectedMethod(value);
			setErrorMessage(null); // Clear error when changing payment method
		}
	}, []);

	// Effect to manage PayPal initialization and cleanup
	useEffect(() => {
		if (!open) {
			// Cleanup when dialog closes
			cleanupPayPal();
			setPaypalOrderRequest(null);
			setIsProcessing(false);
			setErrorMessage(null);
			setSelectedMethod(PaymentMethod.PAYPAL);
			return;
		}

		// Initialize PayPal when dialog opens and PayPal method is selected
		if (selectedMethod === PaymentMethod.PAYPAL && paypalButtonContainer && !paypalOrderRequest) {
			initializePayPal();
		}

		// Cleanup on unmount
		return () => {
			cleanupPayPal();
		};
	}, [open, selectedMethod, paypalButtonContainer, paypalOrderRequest, initializePayPal, cleanupPayPal]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-lg max-h-[90vh] flex flex-col'>
				<DialogHeader className='flex-shrink-0'>
					<DialogTitle>{t(PaymentKey.COMPLETE_PAYMENT)}</DialogTitle>
					<DialogDescription>
						{t(PaymentKey.CHOOSE_PAYMENT_METHOD_TO_PURCHASE, { count: totalCredits })}
					</DialogDescription>
				</DialogHeader>

				<div className='dialog-body'>
					{/* Error Message */}
					{errorMessage && (
						<Alert variant={AlertVariant.DESTRUCTIVE}>
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					)}

					{/* Package Summary */}
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
								<div className={cn('flex justify-between', Colors.GREEN_500.text)}>
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

					{/* Payment Method Selection */}
					<div className='space-y-4'>
						<Label className='text-base font-semibold'>{t(PaymentKey.PAYMENT_METHOD)}</Label>
						<RadioGroup value={selectedMethod} onValueChange={handlePaymentMethodChange} className='space-y-2'>
							<Card className='flex items-center space-x-2 p-4 hover:bg-accent cursor-pointer'>
								<RadioGroupItem value={PaymentMethod.PAYPAL} id='paypal' />
								<Label className='flex-1 cursor-pointer flex items-center gap-2'>
									<FaPaypal className='h-5 w-5 text-white' />
									<span>PayPal</span>
								</Label>
							</Card>
							<Card className='flex items-center space-x-2 p-4 hover:bg-accent cursor-pointer'>
								<RadioGroupItem value={PaymentMethod.MANUAL_CREDIT} id='manual' />
								<Label className='flex-1 cursor-pointer flex items-center gap-2'>
									<CreditCard className='h-5 w-5' />
									<span>{t(PaymentKey.CREDIT_CARD_MANUAL)}</span>
								</Label>
							</Card>
						</RadioGroup>
					</div>

					{/* PayPal Button Container */}
					{selectedMethod === PaymentMethod.PAYPAL && (
						<div className='space-y-2'>
							<Label>{t(PaymentKey.PAYPAL_PAYMENT)}</Label>
							{isProcessing ? (
								<Card className='flex items-center justify-center p-8'>
									<Spinner size={ComponentSize.XL} className='text-primary' message={t(LoadingKey.PROCESSING)} />
								</Card>
							) : (
								<div ref={setPaypalButtonContainer} className='min-h-[50px]' />
							)}
						</div>
					)}

					{/* Manual Payment Button */}
					{selectedMethod === PaymentMethod.MANUAL_CREDIT && (
						<div className='space-y-2'>
							<Label>{t(PaymentKey.CREDIT_CARD_PAYMENT)}</Label>
							<Button className='w-full' onClick={handleManualPayment} disabled={isProcessing} size={ButtonSize.LG}>
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
	);
}
