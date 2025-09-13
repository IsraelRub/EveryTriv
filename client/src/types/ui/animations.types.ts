/**
 * Animation Types
 * @module AnimationTypes
 * @description Animation-related types and interfaces
 */

// Animation types
export interface AnimationOptions {
  /** Enable particle effects */
  enableParticles?: boolean;
  /** Enable score animations */
  enableScoreAnimations?: boolean;
  /** Maximum number of particles */
  particleLimit?: number;
  /** Animation performance settings */
  performance?: {
    /** Throttle animation updates */
    throttleMs?: number;
    /** Enable hardware acceleration */
    hardwareAcceleration?: boolean;
  };
}

export interface Particle {
  /** Unique particle identifier */
  id: number;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** X velocity */
  vx: number;
  /** Y velocity */
  vy: number;
  /** Particle size */
  size: number;
  /** Particle color */
  color: string;
  /** Particle opacity */
  opacity: number;
  /** Particle life */
  life: number;
  /** Maximum particle life */
  maxLife: number;
  /** Created at timestamp */
  created_at: number;
  /** Velocity object */
  velocity: { x: number; y: number };
  /** Particle rotation */
  rotation: number;
  /** Particle scale */
  scale: number;
}

export interface Orb {
  /** Unique orb identifier */
  id: number;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Orb size */
  size: number;
  /** Orb color */
  color: string;
  /** Orb opacity */
  opacity: number;
  /** Orb animation phase */
  phase: number;
  /** Orb animation speed */
  speed: number;
}

// Animation Props
export interface AnimatedBackgroundProps {
  /** Animation options */
  options?: AnimationOptions;
  /** Additional CSS classes */
  className?: string;
  /** Whether animation is enabled */
  enabled?: boolean;
  /** Animation performance context */
  performanceContext?: PerformanceContextType;
  /** Child components */
  children?: React.ReactNode;
  /** Animation intensity */
  intensity?: string;
  /** Animation theme */
  theme?: string;
  /** Enable particles */
  particles?: boolean;
  /** Enable orbs */
  orbs?: boolean;
  /** Enable gradient */
  gradient?: boolean;
  /** Enable interactive */
  interactive?: boolean;
  /** Particles count */
  particlesCount?: number;
  /** Animation speed */
  animationSpeed?: number;
  /** Enable particles */
  enableParticles?: boolean;
  /** Enable gradients */
  enableGradients?: boolean;
  /** Enable floating */
  enableFloating?: boolean;
}

export interface AnimatedContainerProps {
  /** Animation type */
  animationType?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounceIn';
  /** Animation delay */
  delay?: number;
  /** Animation duration */
  duration?: number;
  /** Additional CSS classes */
  className?: string;
  /** Child components */
  children: React.ReactNode;
}

export interface PulseEffectProps {
  /** Pulse intensity */
  intensity?: number;
  /** Pulse duration */
  duration?: number;
  /** Pulse color */
  color?: string;
  /** Additional CSS classes */
  className?: string;
  /** Child components */
  children?: React.ReactNode;
  /** Pulse speed */
  speed?: number;
}

// Performance Context
export interface PerformanceContextType {
  /** Performance state */
  state: PerformanceState;
  /** Start operation */
  startOperation: (id: string) => void;
  /** Complete operation */
  completeOperation: (id: string) => void;
  /** Error operation */
  errorOperation: (id: string, error: string) => void;
  /** Clear operation */
  clearOperation: (id: string) => void;
  /** Clear all operations */
  clearAllOperations: () => void;
  /** Update settings */
  updateSettings: (settings: PerformanceSettingsUpdate) => void;
  /** Check if operation is slow */
  isOperationSlow: (id: string) => boolean;
  /** Get operation metrics */
  getOperationMetrics: (id: string) => PerformanceOperation | undefined;
}

export interface PerformanceState {
  /** Operations map */
  operations: Map<string, PerformanceOperation>;
  /** Performance metrics */
  metrics: PerformanceMetrics;
  /** Performance settings */
  settings: PerformanceSettings;
}

export interface PerformanceOperation {
  /** Start time */
  startTime: number;
  /** Duration */
  duration: number | null;
  /** Status */
  status: 'pending' | 'completed' | 'error';
  /** Error message */
  error?: string;
}

export interface PerformanceMetrics {
  /** Total operations */
  totalOperations: number;
  /** Average duration */
  averageDuration: number;
  /** Slow operations */
  slowOperations: string[];
}

export interface PerformanceSettings {
  /** Slow threshold */
  slowThreshold: number;
  /** Enable profiling */
  enableProfiling: boolean;
  /** Max operations */
  maxOperations: number;
}

export interface PerformanceSettingsUpdate {
  /** Slow threshold */
  slowThreshold?: number;
  /** Enable profiling */
  enableProfiling?: boolean;
  /** Max operations */
  maxOperations?: number;
}

export interface PerformanceAction {
  /** Action type */
  type:
    | 'START_OPERATION'
    | 'COMPLETE_OPERATION'
    | 'ERROR_OPERATION'
    | 'CLEAR_OPERATION'
    | 'CLEAR_ALL_OPERATIONS'
    | 'UPDATE_SETTINGS';
  /** Action payload */
  payload: Record<string, unknown>;
}

// Particle Options
export interface ParticleOptions {
  /** Particle count */
  count?: number;
  /** Particle size */
  size?: number;
  /** Particle color */
  color?: string;
  /** Particle colors array */
  colors?: string[];
  /** Particle speed */
  speed?: number;
  /** Particle life */
  life?: { min: number; max: number };
  /** Particle spread */
  spread?: number;
  /** Particle velocity */
  velocity?: { x: { min: number; max: number }; y: { min: number; max: number } };
  /** Particle opacity */
  opacity?: number;
  /** Particle rotation */
  rotation?: number;
  /** Particle scale */
  scale?: number;
}

// Score Animation State
export interface ScoreAnimationState {
  /** Is animation running */
  isRunning: boolean;
  /** Animation progress */
  progress: number;
  /** Animation duration */
  duration: number;
  /** Animation start time */
  startTime: number;
  /** Animation end time */
  endTime: number;
  /** Animation value */
  value: number;
  /** Animation target value */
  targetValue: number;
  /** Animation start value */
  startValue: number;
  /** Target score */
  targetScore?: number;
  /** Start score */
  startScore?: number;
  /** Particles array */
  particles?: Particle[];
}

// Icon Animation
export interface IconAnimation {
  /** Animation type */
  type: 'bounce' | 'pulse' | 'rotate' | 'shake' | 'none';
  /** Animation duration */
  duration?: number;
  /** Animation delay */
  delay?: number;
  /** Animation iteration count */
  iterationCount?: number | 'infinite';
}
