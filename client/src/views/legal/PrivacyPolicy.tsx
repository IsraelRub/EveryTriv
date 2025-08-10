import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 pt-20">
      <motion.div
        className="w-full max-w-4xl glass-morphism rounded-lg p-8 mx-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 gradient-text">
            Privacy Policy
          </h1>
          <p className="text-slate-300">
            Last updated: August 10, 2025
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="space-y-6 text-slate-200">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p>
                EveryTriv collects minimal information necessary to provide our trivia gaming experience:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Basic profile information when you sign in with Google (name, email, profile picture)</li>
                <li>Game statistics and history to track your progress</li>
                <li>Usage analytics to improve our platform</li>
                <li>Custom difficulty preferences and favorite topics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Provide personalized trivia experiences</li>
                <li>Track your progress and maintain leaderboards</li>
                <li>Improve our AI-powered question generation</li>
                <li>Send you updates about new features (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Data Protection</h2>
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Encrypted data transmission (HTTPS)</li>
                <li>Secure authentication via Google OAuth</li>
                <li>Regular security audits and updates</li>
                <li>Limited data retention policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
              <p>
                EveryTriv integrates with the following third-party services:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Google OAuth for authentication</li>
                <li>Analytics providers for usage insights</li>
                <li>Content delivery networks for performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Access your personal data</li>
                <li>Request data correction or deletion</li>
                <li>Export your game history</li>
                <li>Opt out of analytics tracking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="bg-slate-800 p-4 rounded-lg">
                📧 privacy@everytrivia.com<br />
                🌐 EveryTriv Support Team
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 
                     text-white rounded-lg transition-colors"
          >
            <span>🏠</span>
            <span>Back to Home</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
