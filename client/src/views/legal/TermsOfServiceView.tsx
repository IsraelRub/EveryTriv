import { motion } from 'framer-motion';
import { AlertTriangle, Ban, CreditCard, FileText, Mail, Shield, Users } from 'lucide-react';

import { ROUTES } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components';

export function TermsOfServiceView() {
	return (
		<motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='min-h-screen py-12 px-4'>
			<div className='max-w-4xl mx-auto space-y-8'>
				<Card>
					<CardHeader>
						<div className='flex items-center gap-3 mb-2'>
							<FileText className='h-8 w-8 text-primary' />
							<CardTitle className='text-4xl font-bold'>Terms of Service</CardTitle>
						</div>
						<p className='text-muted-foreground'>
							Last updated:{' '}
							{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
						</p>
					</CardHeader>
					<CardContent className='space-y-8'>
						<section>
							<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
								<Users className='h-6 w-6 text-primary' />
								1. Acceptance of Terms
							</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>
								By accessing and using EveryTriv, you accept and agree to be bound by the terms and provision of this
								agreement. If you do not agree to abide by the above, please do not use this service.
							</p>
							<p className='text-muted-foreground leading-relaxed'>
								These Terms of Service ("Terms") govern your access to and use of the EveryTriv trivia game platform,
								including all features, content, and services provided by us.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>2. Description of Service</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>
								EveryTriv is an online trivia game platform that provides:
							</p>
							<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
								<li>Single-player and multiplayer trivia games</li>
								<li>Various difficulty levels and topics</li>
								<li>Leaderboards and statistics tracking</li>
								<li>User profiles and achievements</li>
								<li>Credit-based game system</li>
							</ul>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
								<Shield className='h-6 w-6 text-primary' />
								3. User Accounts
							</h2>
							<div className='space-y-4'>
								<div>
									<h3 className='text-xl font-semibold mb-2'>3.1 Account Creation</h3>
									<p className='text-muted-foreground leading-relaxed'>
										To use certain features of our service, you must create an account. You agree to provide accurate,
										current, and complete information during registration and to update such information to keep it
										accurate, current, and complete.
									</p>
								</div>
								<div>
									<h3 className='text-xl font-semibold mb-2'>3.2 Account Security</h3>
									<p className='text-muted-foreground leading-relaxed'>
										You are responsible for maintaining the confidentiality of your account credentials and for all
										activities that occur under your account. You agree to notify us immediately of any unauthorized use
										of your account.
									</p>
								</div>
								<div>
									<h3 className='text-xl font-semibold mb-2'>3.3 Account Termination</h3>
									<p className='text-muted-foreground leading-relaxed'>
										We reserve the right to suspend or terminate your account at any time, with or without notice, for
										conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or
										for any other reason.
									</p>
								</div>
							</div>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
								<CreditCard className='h-6 w-6 text-primary' />
								4. Payments and Credits
							</h2>
							<div className='space-y-4'>
								<div>
									<h3 className='text-xl font-semibold mb-2'>4.1 Credits</h3>
									<p className='text-muted-foreground leading-relaxed'>
										Our platform operates on a credit-based system. Credits are required to play games. Credits may be
										purchased or earned through various means as described in our service.
									</p>
								</div>
								<div>
									<h3 className='text-xl font-semibold mb-2'>4.2 Purchases</h3>
									<p className='text-muted-foreground leading-relaxed mb-2'>
										All purchases are final. Credits are non-refundable except as required by law or at our sole
										discretion. By making a purchase, you agree to:
									</p>
									<ul className='list-disc list-inside space-y-1 text-muted-foreground ml-4'>
										<li>Pay all charges incurred by your account</li>
										<li>Provide accurate payment information</li>
										<li>Authorize us to charge your payment method</li>
									</ul>
								</div>
							</div>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>5. User Conduct</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>You agree not to:</p>
							<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
								<li>Use the service for any illegal purpose or in violation of any laws</li>
								<li>Attempt to gain unauthorized access to the service or related systems</li>
								<li>Interfere with or disrupt the service or servers</li>
								<li>Use automated systems (bots, scripts) to access the service</li>
								<li>Impersonate any person or entity</li>
								<li>Harass, abuse, or harm other users</li>
								<li>Share your account credentials with others</li>
								<li>Reverse engineer, decompile, or disassemble any part of the service</li>
							</ul>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
								<Ban className='h-6 w-6 text-primary' />
								6. Prohibited Activities
							</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>
								The following activities are strictly prohibited:
							</p>
							<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
								<li>Cheating, exploiting bugs, or using unfair advantages</li>
								<li>Manipulating scores or leaderboards</li>
								<li>Creating multiple accounts to gain unfair advantages</li>
								<li>Sharing answers or collaborating during competitive games</li>
								<li>Using third-party tools to automate gameplay</li>
							</ul>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>7. Intellectual Property</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>
								All content, features, and functionality of the service, including but not limited to text, graphics,
								logos, icons, images, audio clips, and software, are the exclusive property of EveryTriv and are
								protected by international copyright, trademark, and other intellectual property laws.
							</p>
							<p className='text-muted-foreground leading-relaxed'>
								You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise
								use our content without our express written permission.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
								<AlertTriangle className='h-6 w-6 text-primary' />
								8. Disclaimer of Warranties
							</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>
								THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
								IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
								PURPOSE, AND NON-INFRINGEMENT.
							</p>
							<p className='text-muted-foreground leading-relaxed'>
								We do not warrant that the service will be uninterrupted, secure, or error-free, or that defects will be
								corrected.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>9. Limitation of Liability</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>
								TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL EVERTRIV, ITS AFFILIATES, OR THEIR RESPECTIVE
								OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
								CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR
								INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>10. Indemnification</h2>
							<p className='text-muted-foreground leading-relaxed'>
								You agree to indemnify, defend, and hold harmless EveryTriv and its affiliates from and against any and
								all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including
								attorney's fees) arising from your use of the service or violation of these Terms.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>11. Changes to Terms</h2>
							<p className='text-muted-foreground leading-relaxed'>
								We reserve the right to modify these Terms at any time. We will notify users of any material changes by
								posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the
								service after such modifications constitutes acceptance of the updated Terms.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>12. Governing Law</h2>
							<p className='text-muted-foreground leading-relaxed'>
								These Terms shall be governed by and construed in accordance with applicable laws, without regard to its
								conflict of law provisions. Any disputes arising from these Terms or your use of the service shall be
								resolved through appropriate legal channels.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
								<Mail className='h-6 w-6 text-primary' />
								13. Contact Information
							</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>
								If you have any questions about these Terms of Service, please contact us:
							</p>
							<div className='mt-4 p-4 bg-muted rounded-lg'>
								<p className='font-semibold mb-2'>EveryTriv Support</p>
								<p className='text-muted-foreground'>Email: legal@everytriv.com</p>
								<p className='text-muted-foreground'>
									Website:{' '}
									<a href={ROUTES.CONTACT} className='text-primary hover:underline'>
										Contact Page
									</a>
								</p>
							</div>
						</section>
					</CardContent>
				</Card>
			</div>
		</motion.main>
	);
}
