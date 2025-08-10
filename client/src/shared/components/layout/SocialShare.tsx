import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialShareProps {
  score: number;
  total: number;
  topic?: string;
  difficulty?: string;
  className?: string;
}

export default function SocialShare({ 
  score, 
  total, 
  topic = 'Trivia', 
  difficulty = 'medium',
  className = '' 
}: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const scoreText = `Just scored ${score}/${total} (${percentage}%) on ${topic} ${difficulty} difficulty in EveryTriv! 🧠✨`;
  
  const shareUrl = `${window.location.origin}?challenge=${encodeURIComponent(topic)}&difficulty=${difficulty}`;

  const socialPlatforms = [
    {
      name: 'Twitter',
      icon: '🐦',
      color: 'bg-blue-400 hover:bg-blue-500',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(scoreText)}&url=${encodeURIComponent(shareUrl)}&hashtags=EveryTriv,Trivia,Quiz`
    },
    {
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(scoreText)}`
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(scoreText)}`
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(`${scoreText} ${shareUrl}`)}`
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: 'bg-blue-500 hover:bg-blue-600',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(scoreText)}`
    }
  ];

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${scoreText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Don't show if no game played
  if (total === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Share Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 
                   hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-medium 
                   shadow-lg transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>📤</span>
        <span>Share Score</span>
      </motion.button>

      {/* Share Options Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Share Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 right-0 bg-slate-800/95 backdrop-blur-lg 
                         border border-slate-600 rounded-xl shadow-2xl p-6 w-80 z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Share Your Achievement!</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Score Summary */}
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 mb-4 
                            border border-blue-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {score}/{total}
                  </div>
                  <div className="text-lg text-blue-300 mb-2">{percentage}% Correct</div>
                  <div className="text-sm text-slate-300">
                    {topic} • {difficulty} difficulty
                  </div>
                </div>
              </div>

              {/* Social Platforms */}
              <div className="space-y-2 mb-4">
                <p className="text-sm text-slate-400 mb-3">Share on:</p>
                <div className="grid grid-cols-2 gap-2">
                  {socialPlatforms.map((platform) => (
                    <motion.button
                      key={platform.name}
                      onClick={() => handleShare(platform.url)}
                      className={`${platform.color} text-white p-3 rounded-lg flex items-center 
                                 justify-center space-x-2 text-sm font-medium transition-colors`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-lg">{platform.icon}</span>
                      <span>{platform.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Copy Link */}
              <motion.button
                onClick={handleCopyLink}
                className="w-full p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg 
                         flex items-center justify-center space-x-2 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{copied ? '✅' : '📋'}</span>
                <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </motion.button>

              {/* Challenge Friends */}
              <div className="mt-4 pt-4 border-t border-slate-600">
                <p className="text-xs text-slate-400 text-center">
                  💪 Challenge your friends to beat your score!
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
