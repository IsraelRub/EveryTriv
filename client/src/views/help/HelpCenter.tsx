import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function HelpCenter() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const helpSections = [
    {
      icon: '🎮',
      title: 'Getting Started',
      description: 'Learn the basics of EveryTriv',
      items: [
        'How to create an account',
        'Your first trivia game',
        'Understanding the interface',
        'Setting up your profile'
      ]
    },
    {
      icon: '🎯',
      title: 'Game Modes',
      description: 'Explore different ways to play',
      items: [
        'Unlimited Mode - Play without limits',
        'Time Limited - Race against the clock',
        'Question Limited - Set number of questions',
        'Custom Challenges - Create your own rules'
      ]
    },
    {
      icon: '⚙️',
      title: 'Custom Difficulty',
      description: 'Master our AI-powered difficulty system',
      items: [
        'How to create custom difficulties',
        'Best practices for descriptions',
        'Examples of effective prompts',
        'Troubleshooting difficulty issues'
      ]
    },
    {
      icon: '🏆',
      title: 'Scoring & Leaderboards',
      description: 'Understand how points and rankings work',
      items: [
        'Scoring system explanation',
        'How leaderboards are calculated',
        'Achievement badges',
        'Sharing your scores'
      ]
    }
  ];

  const faqs = [
    {
      question: "How does the custom difficulty feature work?",
      answer: "Our AI analyzes your custom difficulty description to generate questions at the appropriate level. Be specific with terms like 'university level biology' or 'elementary math concepts' for best results."
    },
    {
      question: "Can I play offline?",
      answer: "EveryTriv requires an internet connection to generate fresh questions and sync your progress. However, recent questions may be cached for a brief period."
    },
    {
      question: "How are leaderboard rankings calculated?",
      answer: "Rankings are based on a combination of accuracy percentage, total questions answered, and difficulty levels attempted. Recent performance is weighted more heavily."
    },
    {
      question: "Is my data private and secure?",
      answer: "Yes! We use Google OAuth for secure authentication and encrypt all data in transit. We only collect necessary information to provide the gaming experience."
    },
    {
      question: "Can I suggest new topics or features?",
      answer: "Absolutely! Use the feedback button or contact us at feedback@everytrivia.com. We love hearing from our community."
    },
    {
      question: "How do I delete my account?",
      answer: "You can request account deletion by contacting support@everytrivia.com. We'll process your request within 48 hours and permanently remove your data."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 pt-20">
      <motion.div
        className="w-full max-w-6xl mx-auto space-y-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-white mb-4 gradient-text"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Help Center
          </motion.h1>
          <motion.p 
            className="text-xl text-slate-300"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Everything you need to know about EveryTriv
          </motion.p>
        </div>

        {/* Quick Links */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {helpSections.map((section, index) => (
            <motion.div
              key={index}
              className="glass-morphism rounded-lg p-6 hover:bg-white/10 transition-all duration-200 cursor-pointer"
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-4xl mb-4">{section.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{section.title}</h3>
              <p className="text-slate-300 text-sm mb-4">{section.description}</p>
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-slate-400 text-xs flex items-center">
                    <span className="mr-2">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="glass-morphism rounded-lg p-8"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                className="border border-slate-600 rounded-lg overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left bg-slate-800/50 hover:bg-slate-700/50 
                           transition-colors flex justify-between items-center"
                >
                  <span className="text-white font-medium">{faq.question}</span>
                  <motion.span
                    animate={{ rotate: openFaq === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-400"
                  >
                    ▼
                  </motion.span>
                </button>
                
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === index ? 'auto' : 0,
                    opacity: openFaq === index ? 1 : 0
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 py-4 bg-slate-800/20">
                    <p className="text-slate-300">{faq.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          className="glass-morphism rounded-lg p-8 text-center"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
          <p className="text-slate-300 mb-6">
            Our support team is here to help you get the most out of EveryTriv
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/30 p-4 rounded-lg">
              <div className="text-2xl mb-2">📧</div>
              <h3 className="font-semibold text-white mb-1">Email Support</h3>
              <p className="text-slate-400 text-sm">support@everytrivia.com</p>
            </div>
            
            <div className="bg-slate-800/30 p-4 rounded-lg">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-white mb-1">Live Chat</h3>
              <p className="text-slate-400 text-sm">Available 9AM-5PM PST</p>
            </div>
            
            <div className="bg-slate-800/30 p-4 rounded-lg">
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-semibold text-white mb-1">Documentation</h3>
              <p className="text-slate-400 text-sm">Detailed guides & tutorials</p>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 
                     text-white rounded-lg transition-colors"
          >
            <span>🏠</span>
            <span>Back to Home</span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
