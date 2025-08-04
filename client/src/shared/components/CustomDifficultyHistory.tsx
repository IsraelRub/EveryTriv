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
      // טעינה מ-localStorage
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
    <AnimatePresence>
      <motion.div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-dark text-white rounded-3 p-4 mx-3"
          style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              🕒 Custom Difficulty History
            </h5>
            <button
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-white-50">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-4">
              <div className="mb-3" style={{ fontSize: '3rem' }}>📝</div>
              <h6>No Custom Difficulties Yet</h6>
              <p className="text-white-50">
                Your custom difficulty levels will appear here for quick reuse.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <small className="text-white-50">
                  Click on any item to reuse it
                </small>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleClearHistory}
                  title="Clear all history"
                >
                  🗑️ Clear All
                </button>
              </div>

              <div className="d-flex flex-column gap-2">
                {history.map((item, index) => (
                  <motion.div
                    key={`${item.topic}-${item.difficulty}-${item.timestamp}`}
                    className="card bg-secondary bg-opacity-25 border-0"
                    style={{ cursor: 'pointer' }}
                    whileHover={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      scale: 1.02
                    }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelect(item)}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span>{getDifficultyIcon(item.difficulty)}</span>
                            <span className="fw-bold text-info">
                              {item.topic}
                            </span>
                          </div>
                          <div className="text-white-75">
                            {displayDifficulty(item.difficulty, 60)}
                          </div>
                        </div>
                        <small className="text-white-50">
                          {formatTimestamp(item.timestamp)}
                        </small>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-3 text-center">
                <small className="text-white-50">
                  💡 Showing last {history.length} custom difficulty levels
                </small>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}