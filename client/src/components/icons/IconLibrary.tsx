import { DifficultyLevel } from '@shared';
import type { LucideProps } from 'lucide-react';
import {
  // Navigation & UI
  AlertTriangle,
  ArrowRight,
  BarChart,
  BookOpen,
  Box,
  Brain,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Copy,
  Database,
  Eye,
  EyeOff,
  Facebook,
  FileText,
  Flame,
  Gamepad2,
  Globe,
  Heart,
  History,
  Home,
  Infinity,
  Instagram,
  LinkedinIcon,
  List,
  Mail,
  MapPin,
  Medal,
  MessageCircle,
  MessageSquare,
  Music,
  Palette,
  Phone,
  Play,
  RefreshCw,
  Send,
  Server,
  Share,
  Star,
  Target,
  Timer,
  Trash,
  Twitter,
  User,
  Volume2,
  VolumeX,
  Wrench,
  // Navigation & UI
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import { ComponentType, FC } from 'react';

import { IconColor, IconProps, IconSize } from '../../types';
// import { IconAnimation } from '../../types/ui/animations.types';

// Icon mapping - only including icons that are actually used
const iconMap: Record<string, ComponentType<LucideProps>> = {
  // Navigation & UI
  close: X,
  home: Home,
  chevronleft: ChevronLeft,
  chevronright: ChevronRight,
  chevronup: ChevronUp,
  chevrondown: ChevronDown,
  arrowright: ArrowRight,
  'arrow-right': ArrowRight, // Add missing arrow-right mapping

  // Game & Trivia
  gamepad: Gamepad2,
  trophy: Star, // Using Star instead of Trophy
  medal: Medal,
  star: Star,
  target: Target,
  zap: Zap,
  clock: Clock,
  timer: Timer,
  play: Play,
  history: History,

  // Categories & Topics
  book: BookOpen,
  globe: Globe,

  // Difficulty Levels
  [DifficultyLevel.EASY]: Circle,
  [DifficultyLevel.MEDIUM]: Circle,
  [DifficultyLevel.HARD]: Circle,
  [DifficultyLevel.CUSTOM]: Circle,

  // Status & Feedback
  checkcircle: CheckCircle,
  alerttriangle: AlertTriangle,
  lightbulb: Star, // Using Star instead of Lightbulb

  // Actions & Controls
  trash: Trash,
  copy: Copy,
  share: Share,
  volume: Volume2,
  volumex: VolumeX,
  refreshcw: RefreshCw,

  // Data & Analytics
  barchart: BarChart,
  filetext: FileText,
  list: List,

  // Communication
  mail: Mail,

  // Social & Media
  linkedin: LinkedinIcon,
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  messagesquare: MessageSquare,
  messagecircle: MessageCircle,
  send: Send,

  // Tools & Utilities
  wrench: Wrench,

  // User & Profile
  user: User,
  calendar: Calendar,
  eye: Eye,
  eyeoff: EyeOff,
  phone: Phone,
  mappin: MapPin,
  music: Music,
  heart: Heart,

  // Achievement Icons
  flame: Flame,

  // Additional Icons
  infinity: Infinity,
  brain: Brain,
  atom: Star, // Using Star instead of Atom
  palette: Palette,
  server: Server,
  box: Box,
  database: Database,
};

// Main Icon component
export const Icon: FC<IconProps> = ({
  name,
  size = 'md',
  color = 'inherit',
  animation = 'none',
  className = '',
  onClick,
  style,
}) => {
  const IconComponent = iconMap[name.toLowerCase()];

  if (!IconComponent) {
    import('@shared').then(({ clientLogger }) => {
      clientLogger.userWarn('Icon not found in icon library', { name });
    });
    return null;
  }

  const iconSize = sizeMap[size];
  const iconColor = colorMap[color as IconColor] || 'currentColor';
  const animationClass =
    typeof animation === 'string'
      ? animationStyles[animation] || ''
      : animationStyles[animation.type] || '';

  return (
    <IconComponent
      size={iconSize}
      color={iconColor}
      className={`${animationClass} ${className}`.trim()}
      onClick={onClick}
      style={style}
    />
  );
};

// Size mapping
const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// Color mapping
const colorMap: Record<IconColor, string> = {
  primary: '#3b82f6',
  secondary: '#64748b',
  accent: '#d946ef',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  muted: '#94a3b8',
  white: '#ffffff',
  black: '#000000',
};

// Animation styles
const animationStyles: Record<string, string> = {
  none: '',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  shake: 'animate-shake',
  wiggle: 'animate-wiggle',
  float: 'animate-float',
  glow: 'animate-glow',
};

/**
 * Get icon component for difficulty level
 * @param difficulty - The difficulty level
 * @returns The icon component for the difficulty level
 */
export const getDifficultyIconComponent = (
  difficulty: DifficultyLevel
): ComponentType<LucideProps> => {
  return iconMap[difficulty] || Circle;
};
