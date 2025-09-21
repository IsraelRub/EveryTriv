import { clientLogger,DifficultyLevel, GameMode  } from '@shared';
import { motion } from 'framer-motion';
import {
  createContext,
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createStaggerContainer,
  fadeInRight,
  fadeInUp,
  hoverScale,
  scaleIn,
} from '../../components/animations';
import { Game, TriviaForm } from '../../components/game';
import { GameMode as GameModeComponent } from '../../components/gameMode';
import { DifficultyDisplay, ErrorBanner, HomeTitle } from '../../components/home';
import { Icon } from '../../components/icons';
import { SocialShare } from '../../components/layout';
import { Leaderboard } from '../../components/leaderboard';
import { CustomDifficultyHistory, ScoringSystem } from '../../components/stats';
import { FavoriteTopics } from '../../components/user';
import { APP_DESCRIPTION, CLIENT_STORAGE_KEYS,POPULAR_TOPICS  } from '../../constants';
import { DEFAULT_GAME_STATE, GAME_STATE_UPDATES } from '../../constants';
import { AudioKey } from '../../constants/audio/audio.constants';
import { useUserProfile } from '../../hooks/api';
import {
  useSaveHistory,
  useTriviaQuestionMutation,
  useValidateCustomDifficulty,
} from '../../hooks/api/useTrivia';
import { useAppDispatch, useAppSelector } from '../../hooks/layers/utils';
import { usePrevious, useValueChange } from '../../hooks/layers/utils/usePrevious';
import {
  selectCurrentDifficulty,
  selectCurrentGameMode,
  selectCurrentTopic,
} from '../../redux/selectors';
import { resetGame } from '../../redux/slices/gameSlice';
import { audioService,storageService  } from '../../services';
import { GameState, getOrCreateClientUserId, QuestionCountOption } from '../../types';
import type { GameConfig, GameSessionData } from '../../types/game/config.types';
import { isCustomDifficulty } from '../../utils';

/**
 * Game Context for sharing game state between components
 * 
 * Provides game state management and handlers to child components
 * in the trivia game interface.
 */
const GameContext = createContext<{
  gameState: GameState;
  updateGameState: (updates: Partial<GameState> | ((prev: GameState) => GameState)) => void;
  handleAnswer: (i: number) => Promise<void>;
  loadNextQuestion: () => Promise<void>;
  handleGameEnd: () => void;
} | null>(null);

/**
 * Custom hook to use game context
 * 
 * Provides access to the game context with proper error handling.
 * Must be used within a GameProvider component.
 * 
 * @returns Game context with state and handlers
 * @throws Error if used outside of GameProvider
 */
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

/**
 * Home View Component
 * 
 * Main trivia game interface that provides game state management,
 * user preferences, and game mode selection. Handles game flow,
 * scoring, and analytics tracking.
 * 
 * @returns JSX element containing the home view interface
 */
export default function HomeView() {
  const dispatch = useAppDispatch();
  const gameMode = useAppSelector(selectCurrentGameMode);
  const currentTopic = useAppSelector(selectCurrentTopic);
  const currentDifficulty = useAppSelector(selectCurrentDifficulty);

  const { data: userProfile } = useUserProfile();

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState(DifficultyLevel.MEDIUM);

  useEffect(() => {
    if (userProfile?.preferences?.game) {
      const gamePrefs = userProfile.preferences.game;

      if (gamePrefs.defaultDifficulty) {
        setDifficulty(gamePrefs.defaultDifficulty as DifficultyLevel);
      }

      if (gamePrefs.defaultTopic) {
        setTopic(gamePrefs.defaultTopic);
      }
    }
  }, [userProfile]);

  const gameModeConfig = useMemo(() => {
    const getDefaultQuestionCount = (gameMode: GameMode): QuestionCountOption => {
      const count = (() => {
        switch (gameMode) {
          case GameMode.QUESTION_LIMITED:
            return 10;
          case GameMode.TIME_LIMITED:
            return 999;
          case GameMode.UNLIMITED:
            return 999;
          default:
            return 10;
        }
      })();

      return {
        value: count,
        label: count === 999 ? 'Unlimited Questions' : `${count} Questions`,
      };
    };

    return {
      questionCount: getDefaultQuestionCount(gameMode),
      timeLimit: gameMode === GameMode.TIME_LIMITED ? 60 : 0,
      questionLimit: gameMode === GameMode.QUESTION_LIMITED ? 10 : 999,
      timeRemaining: gameMode === GameMode.TIME_LIMITED ? 60 : 0,
    };
  }, [gameMode]);

  const [questionCount, setQuestionCount] = useState<QuestionCountOption>(
    () => gameModeConfig.questionCount
  );
  const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [userId, setUserId] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [showGameModeSelector, setShowGameModeSelector] = useState(false);

  const previousScore = usePrevious(gameState.score);
  const scoreChange = useValueChange(gameState.score);

  const addParticleBurst = (x: number, y: number, type: string) => {
    clientLogger.logUserActivity('particleBurst', `x: ${x}, y: ${y}, type: ${type}`);
  };

  const triviaMutation = useTriviaQuestionMutation();
  const saveHistoryMutation = useSaveHistory();
  const validateCustomDifficulty = useValidateCustomDifficulty();

  const isFormValid = topic.trim().length > 0 && difficulty.trim().length > 0;
  const validationErrors: string[] = [];
  const isValidating = false;

  const setHookGameMode = (config: GameConfig) => {
    clientLogger.logUserActivity('gameModeChanged', JSON.stringify(config));
  };

  const updateSessionData = (data: GameSessionData) => {
    clientLogger.logUserActivity('sessionUpdated', JSON.stringify(data));
  };

  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      gameMode: {
        mode: gameMode,
        timer: {
          isRunning: false,
          startTime: null,
          timeElapsed: 0,
        },
        questionCount: gameModeConfig.questionCount.value,
        isGameOver: false,
        timeLimit: gameModeConfig.timeLimit,
        questionLimit: gameModeConfig.questionLimit,
        timeRemaining: gameModeConfig.timeRemaining,
      },
    }));

    if (currentTopic) setTopic(currentTopic);
    if (currentDifficulty) setDifficulty(currentDifficulty as DifficultyLevel);

    setQuestionCount(gameModeConfig.questionCount);
  }, [gameMode, currentTopic, currentDifficulty, gameModeConfig]);

  useEffect(() => {
    const loadUserId = async () => {
      const id = await getOrCreateClientUserId();
      setUserId(id);
    };
    loadUserId();
  }, []);

  useEffect(() => {
    clientLogger.navigationPage('home');
    return () => {
      clientLogger.navigationPage('home-exit');
    };
  }, []);

  useEffect(() => {
    const handleScoreChange = async () => {
      if (scoreChange.hasChanged && previousScore !== undefined) {
        clientLogger.game('Score changed', {
          previousScore,
          newScore: gameState.score,
          change: (gameState.score || 0) - previousScore,
        });

        audioService.playAchievementSound(
          gameState.score || 0,
          gameState.total || 0,
          previousScore
        );

        await storageService.set(CLIENT_STORAGE_KEYS.SCORE_HISTORY, {
          score: gameState.score,
          topic,
          difficulty,
          timestamp: Date.now(),
        });

        if ((gameState.score || 0) > previousScore) {
          audioService.play(AudioKey.POINT_EARNED);
        } else if ((gameState.score || 0) < previousScore) {
          audioService.play(AudioKey.ERROR);
        }
      }
    };
    handleScoreChange();
  }, [scoreChange.hasChanged, previousScore, gameState.score, topic, difficulty]);

  const updateGameState = useCallback(
    (updates: Partial<GameState> | ((prev: GameState) => GameState)) => {
      if (typeof updates === 'function') {
        setGameState(updates);
      } else {
        setGameState(prev => ({ ...prev, ...updates }));
      }
    },
    []
  );

  const removeFavorite = useCallback(
    (i: number) => {
      updateGameState(prev => ({
        ...prev,
        favorites: (prev.favorites || []).filter((_, index) => index !== i),
      }));
    },
    [updateGameState]
  );

  const selectFavorite = useCallback((favorite: { topic: string; difficulty: string }) => {
    setTopic(favorite.topic);
    setDifficulty(favorite.difficulty as DifficultyLevel);
  }, []);

  const selectFromHistory = useCallback((historyTopic: string, historyDifficulty: string) => {
    setTopic(historyTopic);
    setDifficulty(historyDifficulty as DifficultyLevel);
  }, []);

  const updateStats = useCallback(
    (topic: string, difficulty: string, isCorrect: boolean, currentStats?: GameState['stats']) => {
      const stats = currentStats || gameState.stats;
      const statsDifficulty = isCustomDifficulty(difficulty) ? 'custom' : difficulty;

      return {
        topicsPlayed: {
          ...(stats?.topicsPlayed || {}),
          [topic]: ((stats?.topicsPlayed || {})[topic] || 0) + 1,
        },
        successRateByDifficulty: {
          ...(stats?.successRateByDifficulty || {}),
          [statsDifficulty]: {
            correct:
              ((stats?.successRateByDifficulty || {})[statsDifficulty]?.correct || 0) +
              (isCorrect ? 1 : 0),
            total: ((stats?.successRateByDifficulty || {})[statsDifficulty]?.total || 0) + 1,
          },
        },
      };
    },
    [gameState.stats]
  );

  const handleAnswer = useCallback(
    async (i: number) => {
      if (gameState.selected !== null || !gameState.trivia) return;
      const isCorrect = gameState.trivia.answers[i].isCorrect;
      const newStats = updateStats(
        gameState.trivia.topic,
        gameState.trivia.difficulty,
        isCorrect,
        gameState.stats
      );

      if (isCorrect) {
        addParticleBurst(0, 0, 'correct-answer');
        audioService.play(AudioKey.CORRECT_ANSWER);
      } else {
        audioService.play(AudioKey.WRONG_ANSWER);
      }

      updateGameState({
        selected: i,
        total: (gameState.total || 0) + 1,
        score: (gameState.score || 0) + (isCorrect ? 1 : 0),
        stats: {
          currentScore: (gameState.score || 0) + (isCorrect ? 1 : 0),
          maxScore: gameState.total || 0,
          successRate:
            (((gameState.score || 0) + (isCorrect ? 1 : 0)) / ((gameState.total || 0) + 1)) * 100,
          averageTimePerQuestion: 0,
          correctStreak: isCorrect ? (gameState.stats?.correctStreak || 0) + 1 : 0,
          maxStreak: Math.max(
            gameState.stats?.maxStreak || 0,
            isCorrect ? (gameState.stats?.correctStreak || 0) + 1 : 0
          ),
          questionsAnswered: (gameState.stats?.questionsAnswered || 0) + 1,
          correctAnswers: (gameState.stats?.correctAnswers || 0) + (isCorrect ? 1 : 0),
          score: (gameState.score || 0) + (isCorrect ? 1 : 0),
          totalGames: gameState.stats?.totalGames || 0,
          ...newStats,
        },
      });

      await saveHistoryMutation.mutateAsync({
        userId,
        score: (gameState.score || 0) + (isCorrect ? 1 : 0),
        totalQuestions: 1,
        correctAnswers: isCorrect ? 1 : 0,
        difficulty: gameState.trivia.difficulty,
        topic: gameState.trivia.topic,
        gameMode: 'single',
        timeSpent: gameState.gameMode?.timer?.timeElapsed || 0,
        creditsUsed: 1,
        questionsData: [
          {
            question: gameState.trivia.question,
            userAnswer: gameState.trivia.answers[i]?.text || '',
            correctAnswer:
              gameState.trivia.answers[gameState.trivia.correctAnswerIndex]?.text || '',
            isCorrect,
            timeSpent: gameState.gameMode?.timer?.timeElapsed || 0,
          },
        ],
      });

      updateSessionData({
        sessionId: '',
        startTime: new Date(),
        stats: {
          currentScore: (gameState.score || 0) + (isCorrect ? 1 : 0),
          maxScore: gameState.total || 0,
          successRate:
            (((gameState.score || 0) + (isCorrect ? 1 : 0)) / ((gameState.total || 0) + 1)) * 100,
          averageTimePerQuestion: 1000,
          correctStreak: isCorrect ? (gameState.stats?.correctStreak || 0) + 1 : 0,
          maxStreak: Math.max(
            gameState.stats?.maxStreak || 0,
            isCorrect ? (gameState.stats?.correctStreak || 0) + 1 : 0
          ),
          questionsAnswered: (gameState.stats?.questionsAnswered || 0) + 1,
          correctAnswers: (gameState.stats?.correctAnswers || 0) + (isCorrect ? 1 : 0),
          score: (gameState.score || 0) + (isCorrect ? 1 : 0),
          totalGames: gameState.stats?.totalGames || 0,
        },
        lastGameMode: gameState.gameMode?.mode || null,
        sessionCount: 1,
        lastScore: (gameState.score || 0) + (isCorrect ? 1 : 0),
        lastTimeElapsed: gameState.gameMode?.timer?.timeElapsed || 0,
      });

      if (
        gameState.gameMode?.mode === 'time-limited' ||
        gameState.gameMode?.mode === 'question-limited'
      ) {
        if (gameState.gameMode?.timeLimit && gameState.gameMode?.timeLimit <= 10) {
          audioService.play(AudioKey.TIME_WARNING);
        }
        if (gameState.gameMode?.timeLimit && gameState.gameMode?.timeLimit <= 3) {
          audioService.play(AudioKey.COUNTDOWN);
        }
        if (
          gameState.gameMode?.timeLimit &&
          gameState.gameMode?.timeLimit % 30 === 0 &&
          gameState.gameMode?.timeLimit > 0
        ) {
          audioService.play(AudioKey.BEEP);
        }
      } else {
        setTimeout(() => {
          setIsGameActive(false);
        }, GAME_STATE_UPDATES.ANIMATION_DELAYS.ANSWER_FEEDBACK);
      }
    },
    [
      gameState,
      userId,
      updateStats,
      updateGameState,
      saveHistoryMutation,
      updateSessionData,
      addParticleBurst,
      audioService,
    ]
  );

  const handleGameModeSelect = (config: {
    mode: GameMode;
    timeLimit?: number;
    questionLimit?: number;
  }) => {
    audioService.play(AudioKey.BUTTON_CLICK);
    setHookGameMode({
      mode: gameMode,
      topic: topic,
      difficulty: difficulty,
      timeLimit: config.timeLimit,
      questionLimit: config.questionLimit,
      settings: {
        showTimer: true,
        showProgress: true,
        allowBackNavigation: false,
      },
    });

    updateGameState({
      gameMode: {
        ...gameState.gameMode,
        mode: gameState.gameMode?.mode || GameMode.UNLIMITED,
        isGameOver: gameState.gameMode?.isGameOver || false,
        timeLimit: config.timeLimit,
        questionLimit: config.questionLimit,
        timer: {
          isRunning: false,
          startTime: null,
          timeElapsed: 0,
        },
      },
    });
    audioService.play(AudioKey.MENU_CLOSE);
    audioService.play(AudioKey.MENU_MUSIC);
    setShowGameModeSelector(false);
    handleSubmitWithMode();
  };

  const handleSubmitWithMode = async () => {
    updateGameState({ error: '', loading: true });
    try {
      if (!isFormValid) {
        throw new Error(validationErrors.join(', '));
      }

      if (isCustomDifficulty(difficulty)) {
        await validateCustomDifficulty(`${topic} ${difficulty}`);
      }

      const response = await triviaMutation.mutateAsync({
        topic,
        difficulty,
        question_count: questionCount.value,
        userId: userId,
      });

      updateGameState({
        trivia: response,
        loading: false,
        selected: null,
        gameMode: {
          ...gameState.gameMode,
          mode: gameState.gameMode?.mode || GameMode.UNLIMITED,
          isGameOver: gameState.gameMode?.isGameOver || false,
          timer: {
            ...gameState.gameMode?.timer,
            isRunning: true,
            startTime: gameState.gameMode?.timer?.startTime || Date.now(),
            timeElapsed: gameState.gameMode?.timer?.timeElapsed || 0,
          },
        },
      });
      setIsGameActive(true);
      audioService.play(AudioKey.GAME_START);
      audioService.play(AudioKey.GAME_MUSIC);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      updateGameState({
        error: errorMessage,
        loading: false,
      });
      setIsGameActive(false);
      audioService.play(AudioKey.ERROR);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    audioService.play(AudioKey.BUTTON_CLICK);

    clientLogger.gameForm('Trivia form submitted', {
      topic: topic.substring(0, 50) + (topic.length > 50 ? '...' : ''),
      difficulty,
      questionCount,
      isGameActive,
      formValid: isFormValid,
      timestamp: new Date().toISOString(),
    });

    if (!isGameActive) {
      clientLogger.gameGamepad('Game mode selector opened', {
        reason: 'new_game_start',
      });
      audioService.play(AudioKey.MENU_OPEN);
      setShowGameModeSelector(true);
      return;
    }

    await handleSubmitWithMode();
  };

  const handleGameEnd = useCallback(() => {
    audioService.play(AudioKey.GAME_END);
    updateGameState({
      gameMode: {
        ...gameState.gameMode,
        mode: gameState.gameMode?.mode || GameMode.UNLIMITED,
        isGameOver: gameState.gameMode?.isGameOver || false,
        timer: {
          ...gameState.gameMode?.timer,
          isRunning: false,
          startTime: gameState.gameMode?.timer?.startTime || null,
          timeElapsed: gameState.gameMode?.timer?.timeElapsed || 0,
        },
      },
    });
    setIsGameActive(false);
    dispatch(resetGame());
  }, [gameState.gameMode, updateGameState, dispatch, audioService]);

  const startNewGame = useCallback(() => {
    audioService.play(AudioKey.GAME_START);
    setShowGameModeSelector(true);
  }, [audioService]);

  const loadNextQuestion = useCallback(async () => {
    if (gameState.gameMode?.isGameOver) return;
    updateGameState({ loading: true });
    try {
      const response = await triviaMutation.mutateAsync({
        topic,
        difficulty,
        question_count: questionCount.value,
        userId: userId,
      });
      updateGameState({
        trivia: response,
        loading: false,
        selected: null,
        gameMode: {
          ...gameState.gameMode,
          mode: gameState.gameMode?.mode || GameMode.UNLIMITED,
          isGameOver: gameState.gameMode?.isGameOver || false,
          timer: gameState.gameMode?.timer || { isRunning: false, startTime: null, timeElapsed: 0 },
          questionLimit:
            gameState.gameMode?.mode === 'question-limited'
              ? (gameState.gameMode?.questionLimit || 0) - 1
              : gameState.gameMode?.questionLimit,
        },
      });
    } catch (err: unknown) {
      updateGameState({
        error: err instanceof Error ? err.message : 'An error occurred',
        loading: false,
      });
    }
  }, [topic, difficulty, userId, gameState.gameMode, updateGameState, triviaMutation]);

  const gameContextValue = {
    gameState,
    updateGameState,
    handleAnswer,
    loadNextQuestion,
    handleGameEnd,
  };

  return (
    <GameContext.Provider value={gameContextValue}>
      <div className='min-h-screen flex flex-col items-center justify-center p-4 pt-20'>
        {/* Main Content Container */}
        <motion.div
          variants={scaleIn}
          initial='hidden'
          animate='visible'
          exit='exit'
          className='w-full max-w-4xl glass-morphism rounded-lg p-6 mx-auto'
          transition={{ delay: 0.8 }}
        >
          {/* Title Section */}
          <HomeTitle title='EveryTriv' className='text-center mb-8' />

          {/* App Description */}
          <motion.p
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            exit='exit'
            transition={{ delay: 0.4 }}
            className='text-center mb-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed'
          >
            {APP_DESCRIPTION}
          </motion.p>

          {/* Current Difficulty Display */}
          <DifficultyDisplay
            className='text-center mb-6'
            topic={topic}
            difficulty={difficulty}
            onDifficultyChange={(difficulty: string) =>
              setDifficulty(difficulty as DifficultyLevel)
            }
            onShowHistory={() => setShowHistory(true)}
          />

          {/* Trivia Form */}
          <motion.div
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            exit='exit'
            transition={{ delay: 0.6 }}
          >
            <TriviaForm
              topic={topic}
              difficulty={difficulty}
              questionCount={questionCount.value}
              loading={gameState.loading || isValidating}
              onTopicChange={setTopic}
              onDifficultyChange={(difficulty: string) =>
                setDifficulty(difficulty as DifficultyLevel)
              }
              onQuestionCountChange={(count: number) =>
                setQuestionCount({ value: count, label: `${count} Questions` })
              }
              onSubmit={handleSubmit}
              showGameModeSelector={showGameModeSelector}
              onGameModeSelectorClose={() => setShowGameModeSelector(false)}
              onChange={(value: string) => setTopic(value)}
              values={{ topic, difficulty, questionCount: String(questionCount) }}
            />
          </motion.div>

          {/* Popular Topics Suggestions */}
          {!topic && (
            <motion.div
              variants={fadeInUp}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ delay: 0.7 }}
              className='mt-4'
            >
              <div className='space-y-3'>
                <h3 className='text-sm font-medium text-white/80 text-center'>Popular Topics</h3>
                <div className='flex flex-wrap justify-center gap-2'>
                  {POPULAR_TOPICS.slice(0, 8).map((suggestedTopic: string, index: number) => (
                    <motion.button
                      key={suggestedTopic}
                      variants={hoverScale}
                      initial='hidden'
                      animate='visible'
                      exit='exit'
                      custom={index * 0.05}
                      onClick={() => {
                        setTopic(suggestedTopic);
                        audioService.play(AudioKey.BUTTON_CLICK);
                      }}
                      className='px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white/90 hover:text-white transition-all duration-200 backdrop-blur-sm'
                    >
                      {suggestedTopic}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Favorite Topics */}
          <motion.div
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            exit='exit'
            transition={{ delay: 0.8 }}
          >
            <FavoriteTopics
              favorites={gameState.favorites || []}
              onRemove={removeFavorite}
              onSelect={selectFavorite}
            />
          </motion.div>

          {/* Error Display */}
          <ErrorBanner message={gameState.error || ''} />

          {/* Game Mode Button */}
          {!gameState.loading && !gameState.trivia && (
            <motion.div
              variants={fadeInUp}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ delay: 1 }}
              className='mt-6'
            >
              <motion.button
                variants={hoverScale}
                initial='hidden'
                animate='visible'
                exit='exit'
                onClick={() => {
                  audioService.play(AudioKey.BUTTON_CLICK);
                  startNewGame();
                }}
                className='w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200'
              >
                <Icon name='gamepad' size='lg' className='mr-2' />
                Start Game with Options
              </motion.button>
            </motion.div>
          )}

          {/* Active Game */}
          {gameState.trivia && (
            <motion.div
              variants={scaleIn}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ delay: 0.5 }}
            >
              <Game
                config={
                  gameState.config || {
                    topic: '',
                    difficulty: DifficultyLevel.EASY,
                    mode: GameMode.QUESTION_LIMITED,
                  }
                }
                state={gameState}
                onStateChange={updateGameState}
                onGameComplete={handleGameEnd}
                onError={(error: string) => updateGameState({ error })}
                trivia={gameState.trivia}
                selected={gameState.selected}
                score={gameState.score}
                onAnswer={handleAnswer}
                onNewQuestion={loadNextQuestion}
                gameMode={gameState.gameMode}
                onGameEnd={handleGameEnd}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Scoring and Leaderboard Section */}
        <motion.div
          variants={createStaggerContainer(1.2)}
          initial='hidden'
          animate='visible'
          exit='exit'
          className='w-full max-w-4xl mt-8 space-y-6'
        >
          {/* Score Change Indicator */}
          {scoreChange.hasChanged && (
            <motion.div
              variants={fadeInUp}
              initial='hidden'
              animate='visible'
              exit='exit'
              transition={{ delay: 0.1 }}
            >
              <div className='text-center'>
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    (scoreChange.current || 0) > (scoreChange.previous || 0)
                      ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                      : 'bg-red-500/20 text-red-300 border border-red-400/30'
                  }`}
                >
                  <Icon
                    name={
                      (scoreChange.current || 0) > (scoreChange.previous || 0)
                        ? 'trending-up'
                        : 'trending-down'
                    }
                    size='sm'
                    className='mr-2'
                  />
                  Score{' '}
                  {(scoreChange.current || 0) > (scoreChange.previous || 0)
                    ? 'increased'
                    : 'decreased'}{' '}
                  by {Math.abs((scoreChange.current || 0) - (scoreChange.previous || 0))}
                </div>
              </div>
            </motion.div>
          )}

          <div className='flex flex-col lg:flex-row lg:items-start lg:space-x-6 space-y-6 lg:space-y-0'>
            <motion.div
              variants={fadeInRight}
              initial='hidden'
              animate='visible'
              exit='exit'
              className='flex-1'
            >
              <ScoringSystem
                currentScore={gameState.score || 0}
                maxScore={gameState.total || 0}
                successRate={gameState.stats?.successRate || 0}
                currentStreak={gameState.stats?.correctStreak || 0}
                maxStreak={gameState.stats?.maxStreak || 0}
                stats={gameState.stats}
                score={gameState.score}
                total={gameState.total}
                topicsPlayed={Object.keys(gameState.stats?.topicsPlayed || {})}
                difficultyStats={gameState.stats?.successRateByDifficulty}
                currentQuestionMetadata={gameState.trivia?.metadata}
              />
            </motion.div>

            {/* Social Share Component */}
            {(gameState.total || 0) > 0 && (
              <motion.div
                variants={fadeInRight}
                initial='hidden'
                animate='visible'
                exit='exit'
                className='lg:w-auto w-full'
              >
                <SocialShare
                  score={gameState.score}
                  total={gameState.total}
                  topic={topic}
                  difficulty={difficulty}
                  className='w-full lg:w-auto'
                />
              </motion.div>
            )}
          </div>

          <Leaderboard userId={userId} />
        </motion.div>

        {/* Modals */}
        <CustomDifficultyHistory
          isVisible={showHistory}
          onSelect={selectFromHistory}
          onClose={() => setShowHistory(false)}
        />
        <GameModeComponent
          isVisible={showGameModeSelector}
          onSelectMode={handleGameModeSelect}
          onModeSelect={(mode: string) => clientLogger.game('Game mode selected', { mode })}
          onCancel={() => setShowGameModeSelector(false)}
        />
      </div>
    </GameContext.Provider>
  );
}
