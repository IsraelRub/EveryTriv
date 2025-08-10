import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { gameHistoryService } from '../../shared/services';
import { GameHistoryEntry } from '../../shared/types';
import { Button } from '../../shared/components/ui';
import { cn } from '../../shared/utils/cn';

export default function GameHistory() {
  const { isAuthenticated } = useSelector((state: RootState) => state.user);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadGameHistory = async (pageNum: number = 0) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const history = await gameHistoryService.getUserGameHistory(20, pageNum * 20);
      
      if (pageNum === 0) {
        setGameHistory(history);
      } else {
        setGameHistory(prev => [...prev, ...history]);
      }
      
      setHasMore(history.length === 20);
    } catch (error) {
      setError('Failed to load game history');
      console.error('Error loading game history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGameHistory();
  }, [isAuthenticated]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadGameHistory(nextPage);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGameModeIcon = (mode: string) => {
    switch (mode) {
      case 'time-limited': return '⏱️';
      case 'question-limited': return '📋';
      case 'unlimited': return '🔄';
      default: return '🎮';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-pink-700">
        <div className="glass-morphism p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
          <p className="text-slate-300 mb-6">Please sign in to view your game history.</p>
          <Button variant="primary">Sign In with Google</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-pink-700 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism p-6 rounded-lg"
        >
          <h1 className="text-3xl font-bold text-white mb-6">Game History</h1>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {loading && gameHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              <p className="text-white mt-4">Loading game history...</p>
            </div>
          ) : gameHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-300 text-lg mb-4">No games played yet</p>
              <p className="text-slate-400 mb-6">Start playing to see your game history here!</p>
              <Button variant="primary">Start Your First Game</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {gameHistory.map((game) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getGameModeIcon(game.gameMode)}</span>
                        <div>
                          <h3 className="text-white font-semibold">
                            {game.topic || 'Mixed Topics'}
                          </h3>
                          <p className="text-slate-400 text-sm">
                            {formatDate(game.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold text-lg">
                          {game.score} points
                        </div>
                        <div className="text-slate-400 text-sm">
                          💰 {game.creditsUsed} credits
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Difficulty:</span>
                        <div className={cn("font-medium", getDifficultyColor(game.difficulty))}>
                          {game.difficulty}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Questions:</span>
                        <div className="text-white font-medium">
                          {game.correctAnswers}/{game.totalQuestions}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Accuracy:</span>
                        <div className="text-white font-medium">
                          {((game.correctAnswers / game.totalQuestions) * 100).toFixed(1)}%
                        </div>
                      </div>
                      {game.timeSpent && (
                        <div>
                          <span className="text-slate-400">Time:</span>
                          <div className="text-white font-medium">
                            {Math.floor(game.timeSpent / 60)}:{(game.timeSpent % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-6">
                  <Button
                    variant="ghost"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="text-slate-300 hover:text-white"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading...
                      </div>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
