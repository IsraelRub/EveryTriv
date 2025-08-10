import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpButtonProps {
  className?: string;
}

export default function FloatingHelpButton({ className = '' }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const helpOptions = [
    {
      icon: '❓',
      title: 'How to Play',
      description: 'Learn the basics of EveryTriv',
      action: () => window.open('/help/how-to-play', '_blank')
    },
    {
      icon: '🎯',
      title: 'Game Modes',
      description: 'Understand different game modes',
      action: () => window.open('/help/game-modes', '_blank')
    },
    {
      icon: '⚙️',
      title: 'Custom Difficulty',
      description: 'Create your own difficulty levels',
      action: () => window.open('/help/custom-difficulty', '_blank')
    },
    {
      icon: '📧',
      title: 'Contact Support',
      description: 'Get help from our team',
      action: () => window.open('mailto:support@everytrivia.com', '_blank')
    },
    {
      icon: '💬',
      title: 'Send Feedback',
      description: 'Help us improve',
      action: () => handleFeedback()
    }
  ];

  const handleFeedback = () => {
    // Simulate feedback submission
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Help Options Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 mb-2"
          >
            <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600 rounded-xl 
                          shadow-2xl p-4 w-80 max-w-[calc(100vw-2rem)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">How can we help?</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {feedbackSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-green-400 font-medium">Thank you for your feedback!</p>
                  <p className="text-slate-400 text-sm mt-1">We'll get back to you soon.</p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {helpOptions.map((option, index) => (
                    <motion.button
                      key={index}
                      onClick={option.action}
                      className="w-full p-3 text-left rounded-lg bg-slate-700/50 hover:bg-slate-700 
                               transition-colors group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-xl group-hover:scale-110 transition-transform">
                          {option.icon}
                        </span>
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{option.title}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{option.description}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Quick Stats */}
              <div className="mt-4 pt-4 border-t border-slate-600">
                <div className="text-xs text-slate-400 text-center">
                  <p>💡 Tip: Use keyboard shortcuts for faster gameplay</p>
                  <p className="mt-1">Press <kbd className="bg-slate-700 px-1 rounded">Ctrl+K</kbd> to search</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Help Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 
                   text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg 
                   transition-all duration-200 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          rotate: isOpen ? 45 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? (
          <span className="text-xl">✕</span>
        ) : (
          <span className="text-xl group-hover:scale-110 transition-transform">❓</span>
        )}
      </motion.button>

      {/* Notification Badge */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full 
                       w-5 h-5 flex items-center justify-center"
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              !
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
