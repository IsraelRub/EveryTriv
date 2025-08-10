import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
            Terms of Service
          </h1>
          <p className="text-slate-300">
            Last updated: August 10, 2025
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="space-y-6 text-slate-200">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using EveryTriv, you accept and agree to be bound by the terms 
                and provision of this agreement. Our platform provides AI-powered trivia gaming 
                experiences with custom difficulty levels and competitive features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily use EveryTriv for personal, non-commercial 
                entertainment purposes. This includes:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Playing trivia games and quizzes</li>
                <li>Creating custom difficulty levels</li>
                <li>Participating in leaderboards</li>
                <li>Sharing achievements on social media</li>
              </ul>
              <p className="mt-4">
                This license shall automatically terminate if you violate any of these restrictions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Conduct</h2>
              <p>You agree NOT to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Use automated systems or bots to play games</li>
                <li>Attempt to manipulate scores or leaderboards</li>
                <li>Share inappropriate content in custom difficulties</li>
                <li>Reverse engineer or copy our AI algorithms</li>
                <li>Use the platform for any commercial purposes without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Content Policy</h2>
              <p>
                EveryTriv uses AI to generate trivia content. While we strive for accuracy:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Content is provided for entertainment purposes only</li>
                <li>We don't guarantee the accuracy of all trivia questions</li>
                <li>Users can report inappropriate or incorrect content</li>
                <li>We reserve the right to moderate and remove content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Account Responsibilities</h2>
              <p>When using Google OAuth to sign in:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>You're responsible for maintaining account security</li>
                <li>One account per person</li>
                <li>Don't share account credentials</li>
                <li>Report suspicious activity immediately</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Credits and Virtual Currency</h2>
              <p>
                EveryTriv may use a credit system for premium features:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Credits have no real-world monetary value</li>
                <li>Credits cannot be transferred between accounts</li>
                <li>We reserve the right to adjust credit values</li>
                <li>No refunds for virtual currency</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
              <p>
                EveryTriv shall not be liable for any damages arising from the use or inability 
                to use our platform, including but not limited to direct, indirect, incidental, 
                punitive, and consequential damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Service Availability</h2>
              <p>
                We strive to maintain 99% uptime, but cannot guarantee uninterrupted service. 
                Maintenance windows and updates may temporarily affect availability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Modifications</h2>
              <p>
                We reserve the right to modify these terms at any time. Users will be notified 
                of significant changes via email or platform notifications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Contact Information</h2>
              <p>
                For questions about these Terms of Service:
              </p>
              <p className="bg-slate-800 p-4 rounded-lg">
                📧 legal@everytrivia.com<br />
                🌐 EveryTriv Legal Team
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
