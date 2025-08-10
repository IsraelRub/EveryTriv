import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { 
      name: 'Facebook', 
      icon: '📘', 
      url: 'https://facebook.com/everytrivia',
      hoverColor: 'hover:text-blue-500'
    },
    { 
      name: 'Twitter', 
      icon: '🐦', 
      url: 'https://twitter.com/everytrivia',
      hoverColor: 'hover:text-sky-400'
    },
    { 
      name: 'Instagram', 
      icon: '📷', 
      url: 'https://instagram.com/everytrivia',
      hoverColor: 'hover:text-pink-500'
    },
    { 
      name: 'YouTube', 
      icon: '📺', 
      url: 'https://youtube.com/@everytrivia',
      hoverColor: 'hover:text-red-500'
    },
    { 
      name: 'Discord', 
      icon: '🎮', 
      url: 'https://discord.gg/everytrivia',
      hoverColor: 'hover:text-indigo-400'
    },
  ];

  const quickLinks = [
    { label: 'Home', path: '/' },
    { label: 'Game History', path: '/history' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Profile', path: '/profile' },
    { label: 'Help Center', path: '/help' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Cookie Policy', path: '/cookies' },
  ];

  return (
    <footer className="bg-slate-900/90 backdrop-blur-sm text-white py-12 mt-auto border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-span-1 md:col-span-2"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold">🧠</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold gradient-text">EveryTriv</h3>
                <p className="text-sm text-slate-400">Smart Trivia Platform</p>
              </div>
            </div>
            <p className="text-slate-300 mb-4 max-w-md">
              Challenge your knowledge with our AI-powered trivia platform. 
              Custom difficulty levels, unlimited topics, and competitive gameplay 
              await you in the ultimate trivia experience.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <p>📧 support@everytrivia.com</p>
              <p>🌐 Made with ❤️ for trivia enthusiasts worldwide</p>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-slate-300 hover:text-white transition-colors duration-200 text-sm hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social & Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-lg font-semibold mb-4 text-white">Connect & Legal</h4>
            
            {/* Social Links */}
            <div className="mb-6">
              <h5 className="text-sm font-medium mb-3 text-slate-300">Follow Us</h5>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-2xl transition-all duration-200 transform hover:scale-110 ${social.hoverColor}`}
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Legal Links */}
            <div>
              <h5 className="text-sm font-medium mb-3 text-slate-300">Legal</h5>
              <ul className="space-y-1">
                {legalLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-slate-400 hover:text-slate-300 transition-colors duration-200 text-xs hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 pt-8 border-t border-slate-700"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © {currentYear} EveryTriv. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-slate-400 text-xs">Built with</span>
              <div className="flex space-x-2">
                <span title="React" className="text-blue-400">⚛️</span>
                <span title="TypeScript" className="text-blue-500">📘</span>
                <span title="Tailwind CSS" className="text-cyan-400">🎨</span>
                <span title="Node.js" className="text-green-500">💚</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
