import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { displayDifficulty, getDifficultyIcon } from '../utils/customDifficulty.utils';

interface CustomDifficultyHistoryProps {
  isVisible: boolean;
  onSelect: (topic: string, difficulty: string) => void;
  onClose: () => void;
}

interface HistoryItem {
  topic: string;
  difficulty: string;
  timestamp: number;
}

export default function CustomDifficultyHistory({ 
  isVisible, 
  onSelect, 
  onClose 
}: CustomDifficultyHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadHistory();
    }
  }, [isVisible]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const recentItems = apiService.getRecentCustomDifficulties(20);
      setHistory(recentItems);
    } catch (error) {
      console.error('Failed to load custom difficulty history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleSelect = (item: HistoryItem) => {
    onSelect(item.topic, item.difficulty);
    onClose();
  };

  const handleClearHistory = () => {
    apiService.clearCustomDifficulties();
    setHistory([]);
  };

  if (!isVisible) return null;

  return (
    <Modal
      open={isVisible}
      onClose={onClose}
      isGlassy
      size="lg"
      className="flex items-center justify-center"
    >
      <div className="p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            🕒 Custom Difficulty History
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            ✕
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-white/60">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📝</div>
            <h4 className="text-lg font-medium mb-2">No Custom Difficulties Yet</h4>
            <p className="text-white/60">
              Your custom difficulty levels will appear here for quick reuse.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-white/60">
                Click on any item to reuse it
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearHistory}
                isGlassy
              >
                🗑️ Clear All
              </Button>
            </div>

            <div className="space-y-2">
              {history.map((item, index) => (
                <motion.div
                  key={`${item.topic}-${item.difficulty}-${item.timestamp}`}
                  className="glass-morphism rounded-lg p-4 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getDifficultyIcon(item.difficulty)}</span>
                        <span className="font-medium text-primary-400">
                          {item.topic}
                        </span>
                      </div>
                      <div className="text-white/75">
                        {displayDifficulty(item.difficulty, 60)}
                      </div>
                    </div>
                    <span className="text-sm text-white/50">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <span className="text-sm text-white/60">
                💡 Showing last {history.length} custom difficulty levels
              </span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}