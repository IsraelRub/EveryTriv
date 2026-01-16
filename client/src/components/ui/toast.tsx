import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';

import { ToastVariant } from '@/constants';
import type { ToastProps } from '@/types';
import { cn } from '@/utils';

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = forwardRef<
	ElementRef<typeof ToastPrimitive.Viewport>,
	ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
	<ToastPrimitive.Viewport
		ref={ref}
		className={cn(
			'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
			className
		)}
		{...props}
	/>
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

export const toastVariants = cva(
	'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
	{
		variants: {
			variant: {
				[ToastVariant.DEFAULT]: 'border bg-background text-foreground',
				[ToastVariant.DESTRUCTIVE]: 'destructive group border-destructive bg-destructive text-destructive-foreground',
				[ToastVariant.SUCCESS]: 'border-green-500 bg-green-50 text-green-900',
				[ToastVariant.WARNING]: 'border-yellow-500 bg-yellow-50 text-yellow-900',
				[ToastVariant.INFO]: 'border-blue-500 bg-blue-50 text-blue-900',
			},
		},
		defaultVariants: {
			variant: ToastVariant.DEFAULT,
		},
	}
);

export const Toast = forwardRef<ElementRef<typeof ToastPrimitive.Root>, ToastProps>(
	({ className, variant, ...props }, ref) => {
		return <ToastPrimitive.Root ref={ref} className={toastVariants({ variant, className })} {...props} />;
	}
);
Toast.displayName = ToastPrimitive.Root.displayName;

export const ToastClose = forwardRef<
	ElementRef<typeof ToastPrimitive.Close>,
	ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
	<ToastPrimitive.Close
		ref={ref}
		className={cn(
			'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-foreground group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:outline-none focus:ring-2 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
			className
		)}
		toast-close=''
		{...props}
	>
		<X className='h-4 w-4' />
	</ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

export const ToastTitle = forwardRef<
	ElementRef<typeof ToastPrimitive.Title>,
	ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
	<ToastPrimitive.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

export const ToastDescription = forwardRef<
	ElementRef<typeof ToastPrimitive.Description>,
	ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
	<ToastPrimitive.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;
