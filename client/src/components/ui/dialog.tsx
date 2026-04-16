import { forwardRef, useCallback, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';

import { AudioKey, ButtonSize, DialogContentSize, VariantBase } from '@/constants';
import { audioService } from '@/services';
import { cn, getDocumentDirection } from '@/utils';
import { buttonVariants } from '@/components';

const dialogContentVariants = cva(
	'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
	{
		variants: {
			size: {
				[DialogContentSize.SM]: 'max-w-lg',
				[DialogContentSize.MD]: 'max-w-xl',
				[DialogContentSize.LG]: 'max-w-2xl',
			},
		},
		defaultVariants: {
			size: DialogContentSize.SM,
		},
	}
);

const Overlay = forwardRef<
	ElementRef<typeof DialogPrimitive.Overlay>,
	ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
		component: typeof DialogPrimitive.Overlay | typeof AlertDialogPrimitive.Overlay;
	}
>(({ component: Component, className, ...props }, ref) => (
	<Component
		ref={ref}
		className={cn(
			'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
			className
		)}
		{...props}
	/>
));
Overlay.displayName = 'Overlay';

const Content = forwardRef<
	ElementRef<typeof DialogPrimitive.Content>,
	ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
		component: typeof DialogPrimitive.Content | typeof AlertDialogPrimitive.Content;
		overlay: typeof DialogPrimitive.Overlay | typeof AlertDialogPrimitive.Overlay;
		portal: typeof DialogPrimitive.Portal | typeof AlertDialogPrimitive.Portal;
		showClose?: boolean;
		size?: DialogContentSize;
	}
>(
	(
		{
			component: Component,
			overlay: OverlayComponent,
			portal: PortalComponent,
			showClose = false,
			size = DialogContentSize.SM,
			className,
			children,
			style,
			...props
		},
		ref
	) => (
		<PortalComponent>
			<OverlayComponent />
			<Component
				ref={ref}
				className={cn(dialogContentVariants({ size }), className)}
				style={{ direction: getDocumentDirection() ?? 'ltr', ...style }}
				{...props}
			>
				{children}
				{showClose && (
					<DialogPrimitive.Close className='absolute end-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none'>
						<X className='h-4 w-4' />
					</DialogPrimitive.Close>
				)}
			</Component>
		</PortalComponent>
	)
);
Content.displayName = 'Content';

const Header = ({ className, spaceY = '1.5', ...props }: HTMLAttributes<HTMLDivElement> & { spaceY?: '1.5' | '2' }) => (
	<div className={cn(`flex flex-col space-y-${spaceY} text-center sm:text-start`, className)} {...props} />
);
Header.displayName = 'Header';

const Footer = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2', className)} {...props} />
);
Footer.displayName = 'Footer';

const Description = forwardRef<
	ElementRef<typeof DialogPrimitive.Description>,
	ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & {
		component: typeof DialogPrimitive.Description | typeof AlertDialogPrimitive.Description;
	}
>(({ component: Component, className, ...props }, ref) => (
	<Component ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
Description.displayName = 'Description';

function DialogWithCloseSound(props: ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
	const { onOpenChange, ...rest } = props;
	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				audioService.play(AudioKey.DIALOG_CLOSE);
			}
			onOpenChange?.(open);
		},
		[onOpenChange]
	);
	return <DialogPrimitive.Root {...rest} onOpenChange={handleOpenChange} />;
}
DialogWithCloseSound.displayName = 'Dialog';

export const Dialog = DialogWithCloseSound;

export const DialogContent = forwardRef<
	ElementRef<typeof DialogPrimitive.Content>,
	ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { size?: DialogContentSize }
>(({ size, ...props }, ref) => (
	<Content
		{...props}
		ref={ref}
		component={DialogPrimitive.Content}
		overlay={DialogPrimitive.Overlay}
		portal={DialogPrimitive.Portal}
		showClose
		size={size}
	/>
));
DialogContent.displayName = 'DialogContent';

export const DialogHeader = (props: HTMLAttributes<HTMLDivElement>) => <Header {...props} spaceY='1.5' />;
DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = (props: HTMLAttributes<HTMLDivElement>) => <Footer {...props} />;
DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = forwardRef<
	ElementRef<typeof DialogPrimitive.Title>,
	ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		ref={ref}
		className={cn('text-lg font-semibold leading-none tracking-tight', className)}
		{...props}
	/>
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = forwardRef<
	ElementRef<typeof DialogPrimitive.Description>,
	ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>((props, ref) => <Description {...props} ref={ref} component={DialogPrimitive.Description} />);
DialogDescription.displayName = 'DialogDescription';

function AlertDialogWithCloseSound(props: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Root>) {
	const { onOpenChange, ...rest } = props;
	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				audioService.play(AudioKey.DIALOG_CLOSE);
			}
			onOpenChange?.(open);
		},
		[onOpenChange]
	);
	return <AlertDialogPrimitive.Root {...rest} onOpenChange={handleOpenChange} />;
}
AlertDialogWithCloseSound.displayName = 'AlertDialog';

export const AlertDialog = AlertDialogWithCloseSound;

export const AlertDialogContent = forwardRef<
	ElementRef<typeof AlertDialogPrimitive.Content>,
	ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & { size?: DialogContentSize }
>(({ size, ...props }, ref) => (
	<Content
		{...props}
		ref={ref}
		component={AlertDialogPrimitive.Content}
		overlay={AlertDialogPrimitive.Overlay}
		portal={AlertDialogPrimitive.Portal}
		size={size}
	/>
));
AlertDialogContent.displayName = 'AlertDialogContent';

export const AlertDialogHeader = (props: HTMLAttributes<HTMLDivElement>) => <Header {...props} spaceY='2' />;
AlertDialogHeader.displayName = 'AlertDialogHeader';

export const AlertDialogFooter = (props: HTMLAttributes<HTMLDivElement>) => <Footer {...props} />;
AlertDialogFooter.displayName = 'AlertDialogFooter';

export const AlertDialogTitle = forwardRef<
	ElementRef<typeof AlertDialogPrimitive.Title>,
	ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<AlertDialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

export const AlertDialogDescription = forwardRef<
	ElementRef<typeof AlertDialogPrimitive.Description>,
	ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>((props, ref) => <Description {...props} ref={ref} component={AlertDialogPrimitive.Description} />);
AlertDialogDescription.displayName = 'AlertDialogDescription';

export const AlertDialogAction = forwardRef<
	ElementRef<typeof AlertDialogPrimitive.Action>,
	ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & {
		variant?: VariantBase;
		size?: ButtonSize;
	}
>(({ className, variant, size, ...props }, ref) => (
	<AlertDialogPrimitive.Action ref={ref} className={buttonVariants({ variant, size, className })} {...props} />
));
AlertDialogAction.displayName = 'AlertDialogAction';

export const AlertDialogCancel = forwardRef<
	ElementRef<typeof AlertDialogPrimitive.Cancel>,
	ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
	<AlertDialogPrimitive.Cancel
		ref={ref}
		className={cn(buttonVariants({ variant: VariantBase.OUTLINE, className }), 'mt-2 sm:mt-0')}
		{...props}
	/>
));
AlertDialogCancel.displayName = 'AlertDialogCancel';
