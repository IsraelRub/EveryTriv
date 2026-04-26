import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react';

import { TIME_PERIODS_MS } from '@shared/constants';
import { delay } from '@shared/utils';

import {
	ButtonSize,
	ComponentSize,
	LegalKey,
	LoadingMessages,
	PLACEHOLDER_EMAIL,
	SEMANTIC_ICON_TEXT,
} from '@/constants';
import { clientLogger as logger } from '@/services';
import { cn } from '@/utils';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Spinner, Textarea } from '@/components';

export function ContactView() {
	const { t } = useTranslation();
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

		logger.userSuccess(t(LegalKey.THANK_YOU_CONTACT), {
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
		<main className='view-main-fill animate-fade-in-up-simple lg:pb-8'>
			<div className='view-container-inner'>
				<div className='view-content-7xl-fill'>
					<Card>
						<CardHeader>
							<div className='flex items-center gap-3 mb-2'>
								<MessageSquare className='h-8 w-8 text-primary' />
								<CardTitle className='text-4xl font-bold'>{t(LegalKey.CONTACT_US)}</CardTitle>
							</div>
							<p className='text-muted-foreground'>{t(LegalKey.CONTACT_TAGLINE)}</p>
						</CardHeader>
						<CardContent>
							<div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
								{/* Contact Information */}
								<div className='space-y-6'>
									<div>
										<h3 className='text-2xl font-semibold mb-6'>{t(LegalKey.GET_IN_TOUCH)}</h3>
										<div className='space-y-4'>
											<div className='flex items-start gap-4'>
												<div className='contact-icon-well'>
													<Mail className='h-5 w-5 text-primary' />
												</div>
												<div>
													<h4 className='font-semibold mb-1'>{t(LegalKey.EMAIL)}</h4>
													<p className='text-muted-foreground'>{t(LegalKey.EMAIL_SUPPORT)}</p>
													<p className='text-muted-foreground text-sm'>{t(LegalKey.RESPOND_WITHIN_24)}</p>
												</div>
											</div>

											<div className='flex items-start gap-4'>
												<div className='contact-icon-well'>
													<Phone className='h-5 w-5 text-primary' />
												</div>
												<div>
													<h4 className='font-semibold mb-1'>{t(LegalKey.PHONE)}</h4>
													<p className='text-muted-foreground'>{t(LegalKey.PHONE_NUMBER)}</p>
													<p className='text-muted-foreground text-sm'>{t(LegalKey.BUSINESS_HOURS_SHORT)}</p>
												</div>
											</div>

											<div className='flex items-start gap-4'>
												<div className='contact-icon-well'>
													<MapPin className='h-5 w-5 text-primary' />
												</div>
												<div>
													<h4 className='font-semibold mb-1'>{t(LegalKey.ADDRESS)}</h4>
													<p className='text-muted-foreground'>{t(LegalKey.ADDRESS_STREET)}</p>
													<p className='text-muted-foreground'>{t(LegalKey.ADDRESS_CITY)}</p>
													<p className='text-muted-foreground'>{t(LegalKey.ADDRESS_COUNTRY)}</p>
												</div>
											</div>

											<div className='flex items-start gap-4'>
												<div className='contact-icon-well'>
													<Clock className='h-5 w-5 text-primary' />
												</div>
												<div>
													<h4 className='font-semibold mb-1'>{t(LegalKey.BUSINESS_HOURS)}</h4>
													<p className='text-muted-foreground'>{t(LegalKey.BUSINESS_HOURS_WEEKDAY)}</p>
													<p className='text-muted-foreground'>{t(LegalKey.BUSINESS_HOURS_WEEKEND)}</p>
												</div>
											</div>
										</div>
									</div>

									<div className='pt-6 border-t'>
										<h4 className='font-semibold mb-3'>{t(LegalKey.OTHER_WAYS_TO_REACH)}</h4>
										<div className='space-y-2 text-muted-foreground'>
											<p>
												• {t(LegalKey.FOR_PRIVACY_CONCERNS)}{' '}
												<a href='mailto:privacy@everytriv.com' className='link-primary'>
													privacy@everytriv.com
												</a>
											</p>
											<p>
												• {t(LegalKey.FOR_LEGAL_MATTERS)}{' '}
												<a href='mailto:legal@everytriv.com' className='link-primary'>
													legal@everytriv.com
												</a>
											</p>
											<p>
												• {t(LegalKey.FOR_PRESS_INQUIRIES)}{' '}
												<a href='mailto:press@everytriv.com' className='link-primary'>
													press@everytriv.com
												</a>
											</p>
										</div>
									</div>
								</div>

								{/* Contact Form */}
								<div>
									<h3 className='text-2xl font-semibold mb-2'>{t(LegalKey.SEND_US_MESSAGE)}</h3>
									<p className='text-sm text-muted-foreground mb-6'>{t(LegalKey.CONTACT_FORM_DISCLAIMER)}</p>
									{isSubmitted ? (
										<div className='flex flex-col items-center justify-center py-12 space-y-4'>
											<CheckCircle2 className={cn('h-16 w-16', SEMANTIC_ICON_TEXT.success)} />
											<h4 className='text-xl font-semibold'>{t(LegalKey.MESSAGE_SENT_SUCCESSFULLY)}</h4>
											<p className='text-muted-foreground text-center'>{t(LegalKey.THANK_YOU_CONTACT_SHORT)}</p>
										</div>
									) : (
										<form onSubmit={handleSubmit} className='space-y-4'>
											<div>
												<Label className='block text-sm font-medium mb-2'>{t(LegalKey.NAME)} *</Label>
												<Input
													id='name'
													name='name'
													type='text'
													required
													value={formData.name}
													onChange={handleChange}
													placeholder={t(LegalKey.NAME_PLACEHOLDER)}
												/>
											</div>

											<div>
												<Label className='block text-sm font-medium mb-2'>
													{t(LegalKey.EMAIL)} {t(LegalKey.REQUIRED_ASTERISK)}
												</Label>
												<Input
													id='email'
													name='email'
													type='email'
													required
													value={formData.email}
													onChange={handleChange}
													placeholder={PLACEHOLDER_EMAIL}
												/>
											</div>

											<div>
												<Label className='block text-sm font-medium mb-2'>{t(LegalKey.SUBJECT)} *</Label>
												<Input
													id='subject'
													name='subject'
													type='text'
													required
													value={formData.subject}
													onChange={handleChange}
													placeholder={t(LegalKey.SUBJECT_PLACEHOLDER_2)}
												/>
											</div>

											<div>
												<Label className='block text-sm font-medium mb-2'>{t(LegalKey.MESSAGE)} *</Label>
												<Textarea
													id='message'
													name='message'
													required
													value={formData.message}
													onChange={handleChange}
													placeholder={t(LegalKey.MESSAGE_PLACEHOLDER_2)}
													rows={6}
													className='resize-none'
												/>
											</div>

											<Button type='submit' size={ButtonSize.LG} className='w-full' disabled={isSubmitting}>
												{isSubmitting ? (
													<Spinner size={ComponentSize.SM} message={t(LoadingMessages.SENDING)} messageInline />
												) : (
													<>
														<Send className='me-2 h-4 w-4' />
														{t(LegalKey.SEND_MESSAGE)}
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
			</div>
		</main>
	);
}
