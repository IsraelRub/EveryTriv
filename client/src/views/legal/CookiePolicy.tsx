import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CookiePolicy() {
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
            Cookie Policy
          </h1>
          <p className="text-slate-300">
            Last updated: August 10, 2025
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="space-y-6 text-slate-200">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">🍪 What Are Cookies?</h2>
              <p>
                Cookies are small text files that are stored on your device when you visit EveryTriv. 
                They help us provide you with a better gaming experience by remembering your preferences 
                and tracking your progress.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">📊 Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-green-400 mb-2">🔒 Essential Cookies</h3>
                  <p>Required for basic platform functionality:</p>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Authentication state (keeping you logged in)</li>
                    <li>Security tokens and session management</li>
                    <li>Language and accessibility preferences</li>
                  </ul>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-400 mb-2">🎮 Gaming Cookies</h3>
                  <p>Enhance your trivia experience:</p>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Game progress and scores</li>
                    <li>Favorite topics and custom difficulties</li>
                    <li>Audio and visual preferences</li>
                    <li>Leaderboard positions</li>
                  </ul>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-purple-400 mb-2">📈 Analytics Cookies</h3>
                  <p>Help us improve EveryTriv:</p>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>Usage patterns and popular topics</li>
                    <li>Performance metrics and load times</li>
                    <li>Feature usage statistics</li>
                    <li>Error tracking and debugging</li>
                  </ul>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-yellow-400 mb-2">🎯 Personalization Cookies</h3>
                  <p>Customize your experience:</p>
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>AI-driven question recommendations</li>
                    <li>Difficulty level suggestions</li>
                    <li>Theme and interface preferences</li>
                    <li>Social sharing settings</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">⚙️ Managing Your Cookie Preferences</h2>
              <p>You have control over how cookies are used:</p>
              
              <div className="bg-slate-800/30 p-4 rounded-lg mt-4">
                <h4 className="font-semibold text-white mb-3">Browser Settings:</h4>
                <ul className="list-disc ml-6 space-y-2">
                  <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                  <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                  <li><strong>Edge:</strong> Settings → Site Permissions → Cookies</li>
                </ul>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mt-4">
                <p className="text-blue-200">
                  <strong>⚠️ Note:</strong> Disabling essential cookies may affect core functionality 
                  like staying logged in or saving your game progress.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">🔐 Third-Party Cookies</h2>
              <p>We use some third-party services that may set their own cookies:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Google OAuth:</strong> For secure authentication</li>
                <li><strong>Analytics Services:</strong> For usage insights and improvements</li>
                <li><strong>CDN Providers:</strong> For faster content delivery</li>
              </ul>
              <p className="mt-4">
                These services have their own privacy policies and cookie practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">📱 Mobile and App Cookies</h2>
              <p>
                When using EveryTriv on mobile devices or through app wrappers, 
                similar local storage technologies may be used to provide the same 
                functionality as cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">🔄 Cookie Lifespan</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-800/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-400 mb-2">Session Cookies</h4>
                  <p className="text-sm">Deleted when you close your browser</p>
                </div>
                <div className="bg-slate-800/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-400 mb-2">Persistent Cookies</h4>
                  <p className="text-sm">Stored for up to 1 year (or until you delete them)</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">📧 Contact Us</h2>
              <p>
                Questions about our cookie policy or want to request data deletion?
              </p>
              <p className="bg-slate-800 p-4 rounded-lg">
                📧 cookies@everytrivia.com<br />
                🌐 EveryTriv Privacy Team
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
