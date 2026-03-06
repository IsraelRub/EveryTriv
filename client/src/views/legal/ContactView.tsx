import { ChangeEvent, FormEvent, useState } from 'react';
import { CheckCircle, Clock, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';

import { TIME_PERIODS_MS } from '@shared/constants';
import { delay } from '@shared/utils';

import { ButtonSize, Colors, ComponentSize, LoadingMessages } from '@/constants';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Spinner, Textarea } from '@/components';
import { clientLogger as logger } from '@/services';
import { cn } from '@/utils';

export function ContactView() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		subject: '',
		message: '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		// Simulate form submission
		await delay(TIME_PERIODS_MS.SECOND);

		setIsSubmitting(false);
		setIsSubmitted(true);

		logger.userSuccess('Thank you for contacting us. We will get back to you soon.', {
			name: formData.name,
			contactEmail: formData.email,
			contactSubject: formData.subject,
		});

		// Reset form after 3 seconds
		setTimeout(() => {
			setFormData({ name: '', email: '', subject: '', message: '' });
			setIsSubmitted(false);
		}, TIME_PERIODS_MS.THREE_SECONDS);
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData(prev => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	return (
		<main className='view-main lg:pb-8 animate-fade-in-up-simple'>
			<div className='view-content-6xl-scroll'>
				<Card>
					<CardHeader>
						<div className='flex items-center gap-3 mb-2'>
							<MessageSquare className='h-8 w-8 text-primary' />
							<CardTitle className='text-4xl font-bold'>Contact Us</CardTitle>
						</div>
						<p className='text-muted-foreground'>
							We'd love to hear from you. Send us a message and we'll respond as soon as possible.
						</p>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
							{/* Contact Information */}
							<div className='space-y-6'>
								<div>
									<h3 className='text-2xl font-semibold mb-6'>Get in Touch</h3>
									<div className='space-y-4'>
										<div className='flex items-start gap-4'>
											<div className='p-3 rounded-lg bg-primary/10'>
												<Mail className='h-5 w-5 text-primary' />
											</div>
											<div>
												<h4 className='font-semibold mb-1'>Email</h4>
												<p className='text-muted-foreground'>support@everytriv.com</p>
												<p className='text-muted-foreground text-sm'>We'll respond within 24 hours</p>
											</div>
										</div>

										<div className='flex items-start gap-4'>
											<div className='p-3 rounded-lg bg-primary/10'>
												<Phone className='h-5 w-5 text-primary' />
											</div>
											<div>
												<h4 className='font-semibold mb-1'>Phone</h4>
												<p className='text-muted-foreground'>+1 (555) 123-4567</p>
												<p className='text-muted-foreground text-sm'>Mon-Fri, 9am-5pm EST</p>
											</div>
										</div>

										<div className='flex items-start gap-4'>
											<div className='p-3 rounded-lg bg-primary/10'>
												<MapPin className='h-5 w-5 text-primary' />
											</div>
											<div>
												<h4 className='font-semibold mb-1'>Address</h4>
												<p className='text-muted-foreground'>123 Game Street</p>
												<p className='text-muted-foreground'>New York, NY 10001</p>
												<p className='text-muted-foreground'>United States</p>
											</div>
										</div>

										<div className='flex items-start gap-4'>
											<div className='p-3 rounded-lg bg-primary/10'>
												<Clock className='h-5 w-5 text-primary' />
											</div>
											<div>
												<h4 className='font-semibold mb-1'>Business Hours</h4>
												<p className='text-muted-foreground'>Monday - Friday: 9:00 AM - 5:00 PM</p>
												<p className='text-muted-foreground'>Saturday - Sunday: Closed</p>
											</div>
										</div>
									</div>
								</div>

								<div className='pt-6 border-t'>
									<h4 className='font-semibold mb-3'>Other Ways to Reach Us</h4>
									<div className='space-y-2 text-muted-foreground'>
										<p>
											• For privacy concerns:{' '}
											<a href='mailto:privacy@everytriv.com' className='link-primary'>
												privacy@everytriv.com
											</a>
										</p>
										<p>
											• For legal matters:{' '}
											<a href='mailto:legal@everytriv.com' className='link-primary'>
												legal@everytriv.com
											</a>
										</p>
										<p>
											• For press inquiries:{' '}
											<a href='mailto:press@everytriv.com' className='link-primary'>
												press@everytriv.com
											</a>
										</p>
									</div>
								</div>
							</div>

							{/* Contact Form */}
							<div>
								<h3 className='text-2xl font-semibold mb-6'>Send us a Message</h3>
								{isSubmitted ? (
									<div className='flex flex-col items-center justify-center py-12 space-y-4'>
										<CheckCircle className={cn('h-16 w-16', Colors.GREEN_500.text)} />
										<h4 className='text-xl font-semibold'>Message Sent Successfully!</h4>
										<p className='text-muted-foreground text-center'>
											Thank you for contacting us. We'll get back to you as soon as possible.
										</p>
									</div>
								) : (
									<form onSubmit={handleSubmit} className='space-y-4'>
										<div>
											<Label htmlFor='name' className='block text-sm font-medium mb-2'>
												Name *
											</Label>
											<Input
												id='name'
												name='name'
												type='text'
												required
												value={formData.name}
												onChange={handleChange}
												placeholder='Your name'
											/>
										</div>

										<div>
											<Label htmlFor='email' className='block text-sm font-medium mb-2'>
												Email *
											</Label>
											<Input
												id='email'
												name='email'
												type='email'
												required
												value={formData.email}
												onChange={handleChange}
												placeholder='your.email@example.com'
											/>
										</div>

										<div>
											<Label htmlFor='subject' className='block text-sm font-medium mb-2'>
												Subject *
											</Label>
											<Input
												id='subject'
												name='subject'
												type='text'
												required
												value={formData.subject}
												onChange={handleChange}
												placeholder='What is this regarding?'
											/>
										</div>

										<div>
											<Label htmlFor='message' className='block text-sm font-medium mb-2'>
												Message *
											</Label>
											<Textarea
												id='message'
												name='message'
												required
												value={formData.message}
												onChange={handleChange}
												placeholder='Tell us how we can help...'
												rows={6}
												className='resize-none'
											/>
										</div>

										<Button type='submit' size={ButtonSize.LG} className='w-full' disabled={isSubmitting}>
											{isSubmitting ? (
												<Spinner size={ComponentSize.SM} message={LoadingMessages.SENDING} messageInline />
											) : (
												<>
													<Send className='mr-2 h-4 w-4' />
													Send Message
												</>
											)}
										</Button>
									</form>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
