import { motion } from 'framer-motion';
import { Database, Eye, Lock, Mail, Shield } from 'lucide-react';

import { ROUTES } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components';

export function PrivacyPolicyView() {
	return (
		<motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='min-h-screen py-12 px-4'>
			<div className='max-w-4xl mx-auto space-y-8'>
				<Card>
					<CardHeader>
						<div className='flex items-center gap-3 mb-2'>
							<Shield className='h-8 w-8 text-primary' />
							<CardTitle className='text-4xl font-bold'>Privacy Policy</CardTitle>
						</div>
						<p className='text-muted-foreground'>
							Last updated:{' '}
							{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
						</p>
					</CardHeader>
					<CardContent className='space-y-8'>
						<section>
							<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
								<Lock className='h-6 w-6 text-primary' />
								1. Introduction
							</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>
								Welcome to EveryTriv. We are committed to protecting your privacy and ensuring the security of your
								personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your
								information when you use our trivia game platform.
							</p>
							<p className='text-muted-foreground leading-relaxed'>
								By using EveryTriv, you agree to the collection and use of information in accordance with this policy.
								If you do not agree with our policies and practices, please do not use our service.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
								<Database className='h-6 w-6 text-primary' />
								2. Information We Collect
							</h2>
							<div className='space-y-4'>
								<div>
									<h3 className='text-xl font-semibold mb-2'>2.1 Personal Information</h3>
									<p className='text-muted-foreground leading-relaxed mb-2'>
										When you register for an account, we may collect:
									</p>
									<ul className='list-disc list-inside space-y-1 text-muted-foreground ml-4'>
										<li>Email address</li>
										<li>Username</li>
										<li>First name and last name (optional)</li>
										<li>Profile picture/avatar</li>
										<li>Authentication information (for OAuth providers like Google)</li>
									</ul>
								</div>
								<div>
									<h3 className='text-xl font-semibold mb-2'>2.2 Game Data</h3>
									<p className='text-muted-foreground leading-relaxed mb-2'>
										We collect information about your gameplay, including:
									</p>
									<ul className='list-disc list-inside space-y-1 text-muted-foreground ml-4'>
										<li>Game scores and statistics</li>
										<li>Game history and performance</li>
										<li>Questions answered and accuracy</li>
										<li>Time spent on questions</li>
										<li>Achievements and progress</li>
									</ul>
								</div>
								<div>
									<h3 className='text-xl font-semibold mb-2'>2.3 Payment Information</h3>
									<p className='text-muted-foreground leading-relaxed'>
										When you make purchases, we collect payment information through secure third-party payment
										processors. We do not store your full credit card details on our servers.
									</p>
								</div>
								<div>
									<h3 className='text-xl font-semibold mb-2'>2.4 Technical Information</h3>
									<p className='text-muted-foreground leading-relaxed mb-2'>
										We automatically collect certain technical information, including:
									</p>
									<ul className='list-disc list-inside space-y-1 text-muted-foreground ml-4'>
										<li>IP address</li>
										<li>Browser type and version</li>
										<li>Device information</li>
										<li>Operating system</li>
										<li>Usage patterns and analytics data</li>
									</ul>
								</div>
							</div>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
								<Eye className='h-6 w-6 text-primary' />
								3. How We Use Your Information
							</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>
								We use the information we collect for the following purposes:
							</p>
							<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
								<li>To provide, maintain, and improve our services</li>
								<li>To process your transactions and manage your account</li>
								<li>To personalize your gaming experience</li>
								<li>To track your progress and achievements</li>
								<li>To communicate with you about your account and our services</li>
								<li>To send you updates, newsletters, and promotional materials (with your consent)</li>
								<li>To detect, prevent, and address technical issues and security threats</li>
								<li>To comply with legal obligations and enforce our terms of service</li>
							</ul>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>4. Data Sharing and Disclosure</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>
								We do not sell your personal information. We may share your information only in the following
								circumstances:
							</p>
							<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
								<li>
									<strong>Service Providers:</strong> With trusted third-party service providers who assist us in
									operating our platform
								</li>
								<li>
									<strong>Legal Requirements:</strong> When required by law or to protect our rights and safety
								</li>
								<li>
									<strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets
								</li>
								<li>
									<strong>With Your Consent:</strong> When you explicitly authorize us to share your information
								</li>
							</ul>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>5. Data Security</h2>
							<p className='text-muted-foreground leading-relaxed'>
								We implement appropriate technical and organizational security measures to protect your personal
								information against unauthorized access, alteration, disclosure, or destruction. However, no method of
								transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>6. Your Rights</h2>
							<p className='text-muted-foreground leading-relaxed mb-4'>
								Depending on your location, you may have the following rights regarding your personal information:
							</p>
							<ul className='list-disc list-inside space-y-2 text-muted-foreground ml-4'>
								<li>Right to access your personal data</li>
								<li>Right to rectify inaccurate data</li>
								<li>Right to erasure ("right to be forgotten")</li>
								<li>Right to restrict processing</li>
								<li>Right to data portability</li>
								<li>Right to object to processing</li>
								<li>Right to withdraw consent</li>
							</ul>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>7. Cookies and Tracking Technologies</h2>
							<p className='text-muted-foreground leading-relaxed'>
								We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and
								improve our services. You can control cookie preferences through your browser settings.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>8. Children's Privacy</h2>
							<p className='text-muted-foreground leading-relaxed'>
								Our service is not intended for children under the age of 13. We do not knowingly collect personal
								information from children under 13. If you believe we have collected information from a child under 13,
								please contact us immediately.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4'>9. Changes to This Privacy Policy</h2>
							<p className='text-muted-foreground leading-relaxed'>
								We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
								new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this
								Privacy Policy periodically for any changes.
							</p>
						</section>

						<section>
							<h2 className='text-2xl font-semibold mb-4 flex items-center gap-2'>
								<Mail className='h-6 w-6 text-primary' />
								10. Contact Us
							</h2>
							<p className='text-muted-foreground leading-relaxed'>
								If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us
								at:
							</p>
							<div className='mt-4 p-4 bg-muted rounded-lg'>
								<p className='font-semibold mb-2'>EveryTriv Support</p>
								<p className='text-muted-foreground'>Email: privacy@everytriv.com</p>
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
