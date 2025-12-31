import { useCallback, useEffect, useRef, useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';

import { PaymentMethod, PaymentStatus } from '@shared/constants';
import type { PayPalOrderRequest } from '@shared/types';
import { isPaymentMethod } from '@shared/validation';
import { AudioKey, ButtonSize, ButtonVariant, SpinnerSize, SpinnerVariant, ToastVariant } from '@/constants';
import {
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
import { useAudio, usePurchaseCredits, useToast } from '@/hooks';
import type { CreditsPurchaseResponse, PaymentDialogProps } from '@/types';

export function PaymentDialog({ open, onOpenChange, package: pkg, onSuccess }: PaymentDialogProps) {
	const { toast } = useToast();
	const audioService = useAudio();
	const purchaseCredits = usePurchaseCredits();
	const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.PAYPAL);
	const [isProcessing, setIsProcessing] = useState(false);
	const [paypalButtonContainer, setPaypalButtonContainer] = useState<HTMLDivElement | null>(null);
	const paypalButtonRef = useRef<{
		render: (container: string | HTMLElement) => Promise<void>;
		close: () => void;
	} | null>(null);
	const [paypalOrderRequest, setPaypalOrderRequest] = useState<PayPalOrderRequest | null>(null);

	const handlePaymentSuccess = useCallback(
		(result: CreditsPurchaseResponse) => {
			const totalCredits = pkg.credits + (pkg.bonus ?? 0);
			audioService.play(AudioKey.SUCCESS);
			toast({
				title: 'Payment Successful',
				description: result.message || 'Credits have been added to your account.',
			});
			onSuccess(totalCredits);
			onOpenChange(false);
		},
		[pkg.credits, pkg.bonus, audioService, toast, onSuccess, onOpenChange]
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
				throw new Error(result.message || 'Failed to initialize PayPal');
			}
		} catch (error) {
			audioService.play(AudioKey.ERROR);
			toast({
				title: 'Payment Error',
				description: error instanceof Error ? error.message : 'Failed to initialize payment',
				variant: ToastVariant.DESTRUCTIVE,
			});
			setIsProcessing(false);
		}
	}, [pkg.id, purchaseCredits, audioService, toast, handlePaymentSuccess]);

	useEffect(() => {
		if (!open) {
			if (paypalButtonRef.current) {
				paypalButtonRef.current.close();
				paypalButtonRef.current = null;
			}
			setPaypalOrderRequest(null);
			setIsProcessing(false);
			setSelectedMethod(PaymentMethod.PAYPAL);
			return;
		}

		if (selectedMethod === PaymentMethod.PAYPAL && paypalButtonContainer && !paypalOrderRequest) {
			initializePayPal();
		}

		return () => {
			if (paypalButtonRef.current) {
				paypalButtonRef.current.close();
				paypalButtonRef.current = null;
			}
		};
	}, [open, selectedMethod, paypalButtonContainer, paypalOrderRequest, initializePayPal]);

	const loadPayPalScript = (clientId: string, environment: string) => {
		if (window.paypal) {
			renderPayPalButton();
			return;
		}

		const script = document.createElement('script');
		const env = environment === 'production' ? '' : 'sandbox';
		script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD${env ? `&buyer-country=US` : ''}`;
		script.async = true;
		script.onload = () => {
			renderPayPalButton();
		};
		script.onerror = () => {
			audioService.play(AudioKey.ERROR);
			toast({
				title: 'PayPal Error',
				description: 'Failed to load PayPal SDK',
				variant: ToastVariant.DESTRUCTIVE,
			});
			setIsProcessing(false);
		};
		document.body.appendChild(script);
	};

	const renderPayPalButton = () => {
		if (!window.paypal || !paypalButtonContainer) {
			setIsProcessing(false);
			return;
		}

		if (paypalButtonRef.current) {
			paypalButtonRef.current.close();
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
								description: pkg.description || `${pkg.credits} Credits`,
							},
						],
					});
				} catch (error) {
					audioService.play(AudioKey.ERROR);
					toast({
						title: 'Payment Error',
						description: error instanceof Error ? error.message : 'Failed to create PayPal order',
						variant: ToastVariant.DESTRUCTIVE,
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
						throw new Error(result.message || 'Payment not completed');
					}
				} catch (error) {
					audioService.play(AudioKey.ERROR);
					toast({
						title: 'Payment Failed',
						description: error instanceof Error ? error.message : 'Failed to complete payment',
						variant: ToastVariant.DESTRUCTIVE,
					});
				} finally {
					setIsProcessing(false);
				}
			},
			onError: (err: Error) => {
				audioService.play(AudioKey.ERROR);
				toast({
					title: 'PayPal Error',
					description: err.message || 'An error occurred with PayPal',
					variant: ToastVariant.DESTRUCTIVE,
				});
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
	};

	const handleManualPayment = async () => {
		setIsProcessing(true);
		try {
			const result = await purchaseCredits.mutateAsync({
				packageId: pkg.id,
				paymentMethod: PaymentMethod.MANUAL_CREDIT,
			});

			if (result.status === PaymentStatus.COMPLETED) {
				handlePaymentSuccess(result);
			} else {
				throw new Error(result.message || 'Payment not completed');
			}
		} catch (error) {
			audioService.play(AudioKey.ERROR);
			toast({
				title: 'Payment Failed',
				description: error instanceof Error ? error.message : 'Failed to process payment',
				variant: ToastVariant.DESTRUCTIVE,
			});
		} finally {
			setIsProcessing(false);
		}
	};

	const totalCredits = pkg.credits + (pkg.bonus ?? 0);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>Complete Payment</DialogTitle>
					<DialogDescription>Choose your payment method to purchase {totalCredits} credits</DialogDescription>
				</DialogHeader>

				<div className='space-y-6 py-4'>
					{/* Package Summary */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>Order Summary</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2'>
							<div className='flex justify-between'>
								<span className='text-muted-foreground'>Package:</span>
								<span className='font-medium'>{pkg.description || `${pkg.credits} Credits`}</span>
							</div>
							{pkg.bonus && pkg.bonus > 0 && (
								<div className='flex justify-between text-green-600'>
									<span>Bonus:</span>
									<span className='font-medium'>+{pkg.bonus} credits</span>
								</div>
							)}
							<div className='flex justify-between text-lg font-bold pt-2 border-t'>
								<span>Total:</span>
								<span>{pkg.priceDisplay}</span>
							</div>
						</CardContent>
					</Card>

					{/* Payment Method Selection */}
					<div className='space-y-4'>
						<Label className='text-base font-semibold'>Payment Method</Label>
						<RadioGroup
							value={selectedMethod}
							onValueChange={value => {
								if (isPaymentMethod(value)) {
									setSelectedMethod(value);
								}
							}}
						>
							<div className='flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer'>
								<RadioGroupItem value={PaymentMethod.PAYPAL} id='paypal' />
								<Label htmlFor='paypal' className='flex-1 cursor-pointer flex items-center gap-2'>
									<Lock className='h-5 w-5' />
									<span>PayPal</span>
								</Label>
							</div>
							<div className='flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer'>
								<RadioGroupItem value={PaymentMethod.MANUAL_CREDIT} id='manual' />
								<Label htmlFor='manual' className='flex-1 cursor-pointer flex items-center gap-2'>
									<CreditCard className='h-5 w-5' />
									<span>Credit Card (Manual)</span>
								</Label>
							</div>
						</RadioGroup>
					</div>

					{/* PayPal Button Container */}
					{selectedMethod === PaymentMethod.PAYPAL && (
						<div className='space-y-2'>
							<Label>PayPal Payment</Label>
						{isProcessing ? (
							<div className='flex items-center justify-center p-8 border rounded-lg'>
								<Spinner variant={SpinnerVariant.BUTTON} size={SpinnerSize.LG} className='text-primary' />
							</div>
						) : (
								<div ref={setPaypalButtonContainer} className='min-h-[50px]' />
							)}
						</div>
					)}

					{/* Manual Payment Button */}
					{selectedMethod === PaymentMethod.MANUAL_CREDIT && (
						<div className='space-y-2'>
							<Label>Credit Card Payment</Label>
							<Button className='w-full' onClick={handleManualPayment} disabled={isProcessing} size={ButtonSize.LG}>
								{isProcessing ? (
									<>
										<Spinner variant={SpinnerVariant.BUTTON} size={SpinnerSize.SM} className='mr-2' />
										Processing...
									</>
								) : (
									<>
										<CreditCard className='mr-2 h-4 w-4' />
										Pay {pkg.priceDisplay}
									</>
								)}
							</Button>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant={ButtonVariant.OUTLINE} onClick={() => onOpenChange(false)} disabled={isProcessing}>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
