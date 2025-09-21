/**
 * Animation Types
 * @module AnimationTypes
 * @description Animation-related types and interfaces
 */

export interface AnimationOptions {
  enableParticles?: boolean;
  enableScoreAnimations?: boolean;
  particleLimit?: number;
  performance?: {
    throttleMs?: number;
    hardwareAcceleration?: boolean;
  };
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  created_at: number;
  velocity: { x: number; y: number };
  rotation: number;
  scale: number;
}

export interface Orb {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  phase: number;
  speed: number;
}

export interface AnimatedBackgroundProps {
  options?: AnimationOptions;
  className?: string;
  enabled?: boolean;
  performanceContext?: PerformanceContextType;
  children?: React.ReactNode;
  intensity?: string;
  theme?: string;
  particles?: boolean;
  orbs?: boolean;
  gradient?: boolean;
  interactive?: boolean;
  particlesCount?: number;
  animationSpeed?: number;
  enableParticles?: boolean;
  enableGradients?: boolean;
  enableFloating?: boolean;
}

export interface AnimatedContainerProps {
  animationType?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounceIn';
  delay?: number;
  duration?: number;
  className?: string;
  children: React.ReactNode;
}

export interface PulseEffectProps {
  intensity?: number;
  duration?: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
  speed?: number;
}

export interface PerformanceContextType {
  state: PerformanceState;
  startOperation: (id: string) => void;
  completeOperation: (id: string) => void;
  errorOperation: (id: string, error: string) => void;
  clearOperation: (id: string) => void;
  clearAllOperations: () => void;
  updateSettings: (settings: PerformanceSettingsUpdate) => void;
  isOperationSlow: (id: string) => boolean;
  getOperationMetrics: (id: string) => PerformanceOperation | undefined;
}

export interface PerformanceState {
  operations: Map<string, PerformanceOperation>;
  metrics: PerformanceMetrics;
  settings: PerformanceSettings;
}

export interface PerformanceOperation {
  startTime: number;
  duration: number | null;
  status: 'pending' | 'completed' | 'error';
  error?: string;
}

export interface PerformanceMetrics {
  totalOperations: number;
  averageDuration: number;
  slowOperations: string[];
}

export interface PerformanceSettings {
  slowThreshold: number;
  enableProfiling: boolean;
  maxOperations: number;
}

export interface PerformanceSettingsUpdate {
  slowThreshold?: number;
  enableProfiling?: boolean;
  maxOperations?: number;
}

export interface PerformanceAction {
  type:
    | 'START_OPERATION'
    | 'COMPLETE_OPERATION'
    | 'ERROR_OPERATION'
    | 'CLEAR_OPERATION'
    | 'CLEAR_ALL_OPERATIONS'
    | 'UPDATE_SETTINGS';
  payload: Record<string, unknown>;
}

export interface ParticleOptions {
  count?: number;
  size?: number;
  color?: string;
  colors?: string[];
  speed?: number;
  life?: { min: number; max: number };
  spread?: number;
  velocity?: { x: { min: number; max: number }; y: { min: number; max: number } };
  opacity?: number;
  rotation?: number;
  scale?: number;
}

// Score Animation State
export interface ScoreAnimationState {
  isRunning: boolean;
  progress: number;
  duration: number;
  startTime: number;
  endTime: number;
  value: number;
  targetValue: number;
  startValue: number;
  targetScore?: number;
  startScore?: number;
  particles?: Particle[];
}

// Icon Animation
export interface IconAnimation {
  type: 'bounce' | 'pulse' | 'rotate' | 'shake' | 'none';
  duration?: number;
  delay?: number;
  iterationCount?: number | 'infinite';
}
