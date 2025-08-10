import { motion, AnimatePresence } from 'framer-motion';
import { getCustomDifficultySuggestions } from '../../utils/customDifficulty.utils';

interface CustomDifficultySuggestionsProps {
  topic?: string;
  onSuggestionClick: (suggestion: string) => void;
  isVisible: boolean;
  currentText: string;
}

export default function CustomDifficultySuggestions({
  topic,
  onSuggestionClick,
  isVisible,
  currentText
}: CustomDifficultySuggestionsProps) {
  if (!isVisible) return null;

  const suggestions = getCustomDifficultySuggestions(topic);
  
  // סינון הצעות שלא זהות לטקסט הנוכחי
  const filteredSuggestions = suggestions.filter(suggestion => 
    suggestion.toLowerCase() !== currentText.toLowerCase().trim()
  );

  const quickSuggestions = [
    'beginner level',
    'intermediate level', 
    'advanced level',
    'expert level'
  ];

  return (
    <AnimatePresence>
      <motion.div
        className='mt-2 p-3 bg-gray-900 bg-opacity-75 rounded border border-gray-600'
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className='mb-2'>
          <small className='text-white font-semibold'>💡 Quick suggestions:</small>
          <div className='flex flex-wrap gap-1 mt-1'>
            {quickSuggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion}
                type='button'
                className='border border-white text-white hover:bg-white hover:text-gray-900 text-sm px-3 py-1 rounded transition-colors'
                onClick={() => onSuggestionClick(suggestion)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>

        {topic && filteredSuggestions.length > 0 && (
          <div className='mb-2'>
            <small className='text-white font-semibold'>
              🎯 For "{topic}":
            </small>
            <div className='flex flex-wrap gap-1 mt-1'>
              {filteredSuggestions.slice(0, 6).map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  type='button'
                  className='border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white text-sm px-3 py-1 rounded transition-colors'
                  onClick={() => onSuggestionClick(suggestion)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 4) * 0.1 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div>
          <small className='text-white opacity-75'>
             Examples: "university level quantum physics", "elementary school math", 
            "professional chef techniques", "beginner yoga poses"
          </small>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}