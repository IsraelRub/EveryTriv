import { clientLogger,formatRelativeTime, formatTopic  } from '@shared';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { storageService } from '../../services';
import { CustomDifficultyHistoryProps, HistoryItem } from '../../types';
import { getDifficultyDisplayText, getDifficultyIcon } from '../../utils/customDifficulty.utils';
import { createStaggerContainer,fadeInLeft, hoverScale } from '../animations';
import { Icon } from '../icons';
import { Button, Modal } from '../ui';

export default function CustomDifficultyHistory({
  isVisible,
  onSelect,
  onClose,
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
      const recentItems = await storageService.getRecentCustomDifficulties();
      // Convert string array to HistoryItem array
      const historyItems: HistoryItem[] = recentItems.map(item => {
        const [topic, difficulty] = item.split(':');
        return {
          topic: topic || '',
          difficulty: difficulty || '',
          score: 0,
          date: new Date().toISOString(),
          timestamp: Date.now(),
        };
      });
      setHistory(historyItems);
    } catch (error) {
      clientLogger.storageError('Failed to load custom difficulty history', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Use shared formatting utility instead of local function
  const formatTimestamp = (timestamp: number) => {
    return formatRelativeTime(timestamp);
  };

  const handleSelect = (item: HistoryItem) => {
    onSelect?.(item.topic, item.difficulty);
    onClose?.();
  };

  const handleClearHistory = () => {
    storageService.clearCustomDifficulties();
    setHistory([]);
  };

  if (!isVisible) return null;

  return (
    <Modal
      open={isVisible}
      onClose={
        onClose ||
        (() => {
          // Default no-op close handler
        })
      }
      isGlassy
      size='lg'
      className='flex items-center justify-center'
    >
      <div className='p-6 w-full max-w-2xl'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-xl font-semibold'>
            <Icon name='clock' size='lg' className='mr-2' /> Custom Difficulty History
          </h3>
          <Button variant='ghost' size='sm' onClick={onClose} className='p-1'>
            <Icon name='x' size='sm' />
          </Button>
        </div>

        {loading ? (
          <div className='text-center py-8'>
            <div className='animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto' />
            <p className='mt-4 text-white/60'>Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className='text-center py-8'>
            <div className='text-6xl mb-4'>
              <Icon name='filetext' size='xl' />
            </div>
            <h4 className='text-lg font-medium mb-2'>No Custom Difficulties Yet</h4>
            <p className='text-white/60'>
              Your custom difficulty levels will appear here for quick reuse.
            </p>
          </div>
        ) : (
          <>
            <div className='flex justify-between items-center mb-4'>
              <span className='text-sm text-white/60'>Click on any item to reuse it</span>
              <Button variant='secondary' size='sm' onClick={handleClearHistory} isGlassy>
                <Icon name='trash' size='sm' className='mr-1' /> Clear All
              </Button>
            </div>

            <motion.div
              variants={createStaggerContainer(0.05)}
              initial='hidden'
              animate='visible'
              className='space-y-2'
            >
              {history.map((item, index) => (
                <motion.div
                  key={`${item.topic}-${item.difficulty}-${item.timestamp}`}
                  variants={fadeInLeft}
                  initial='hidden'
                  animate='visible'
                  transition={{ delay: index * 0.05 }}
                >
                  <motion.div variants={hoverScale} initial='normal' whileHover='hover'>
                    <div
                      className='glass rounded-lg p-4 cursor-pointer'
                      onClick={() => handleSelect(item)}
                    >
                      <div className='flex justify-between items-start'>
                        <div>
                          <div className='flex items-center gap-2 mb-1'>
                            <Icon name={getDifficultyIcon(item.difficulty)} size='sm' />
                            <span className='font-medium text-primary-400'>
                              {formatTopic(item.topic)}
                            </span>
                          </div>
                          <div className='text-white/75'>
                            {getDifficultyDisplayText(item.difficulty)}
                          </div>
                        </div>
                        <span className='text-sm text-white/50'>
                          {formatTimestamp(item.timestamp || 0)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>

            <div className='mt-4 text-center'>
              <span className='text-sm text-white/60'>
                <Icon name='lightbulb' size='sm' className='mr-1' /> Showing last {history.length}{' '}
                custom difficulty levels
              </span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
