import type { ComponentType, FC } from 'react';

import {
	// Navigation & UI
	AlertTriangle,
	ArrowRight,
	BarChart,
	BookOpen,
	Box,
	Brain,
	Calendar,
	Check,
	CheckCircle,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Circle,
	Clock,
	Copyright,
	Copy,
	Database,
	Dot,
	Dumbbell,
	Eye,
	EyeOff,
	Info,
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
	LucideProps,
	Mail,
	MapPin,
	Medal,
	MessageCircle,
	MessageSquare,
	Music,
	Palette,
	PartyPopper,
	Phone,
	Play,
	RefreshCw,
	Send,
	Server,
	Share,
	Star,
	Target,
	TrendingDown,
	TrendingUp,
	Timer,
	Trophy,
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
	XCircle,
	Lightbulb,
} from 'lucide-react';

import { DifficultyLevel } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';

import { ComponentSize } from '../constants';
import { IconColor, IconProps } from '../types';

// Icon mapping - only including icons that are actually used
const iconMap: Record<string, ComponentType<LucideProps>> = {
	// Navigation & UI
	close: X,
	x: X,
	xcircle: XCircle,
	check: Check,
	home: Home,
	chevronleft: ChevronLeft,
	chevronright: ChevronRight,
	chevronup: ChevronUp,
	chevrondown: ChevronDown,
	arrowright: ArrowRight,
	'arrow-right': ArrowRight, // Add missing arrow-right mapping

	// Game & Trivia
	gamepad: Gamepad2,
	trophy: Trophy,
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
	lightbulb: Lightbulb,
	warning: AlertTriangle,
	info: Info,

	// Actions & Controls
	trash: Trash,
	copy: Copy,
	share: Share,
	volume: Volume2,
	volumex: VolumeX,
	refreshcw: RefreshCw,
	multiply: X,
	dot: Dot,
	bullet: Dot,

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
	partypopper: PartyPopper,
	celebrate: PartyPopper,

	// Additional Icons
	infinity: Infinity,
	brain: Brain,
	atom: Star, // Using Star instead of Atom
	palette: Palette,
	server: Server,
	box: Box,
	database: Database,
	copyright: Copyright,
	trendingup: TrendingUp,
	trendingdown: TrendingDown,
	dumbbell: Dumbbell,
};

// Main Icon component
export const Icon: FC<IconProps> = ({
	name,
	size = ComponentSize.MD,
	color = 'inherit',
	animation = 'none',
	className = '',
	onClick,
	style,
}) => {
	const IconComponent = iconMap[name.toLowerCase()];

	if (!IconComponent) {
		logger.userWarn('Icon not found in icon library', { name });
		return null;
	}

	const iconSize = sizeMap[size];
	const iconColor = colorMap[color] ?? 'currentColor';
	const animationClass =
		typeof animation === 'string' ? animationStyles[animation] || '' : animationStyles[animation.type] || '';

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
const sizeMap: Record<ComponentSize, number> = {
	[ComponentSize.XS]: 12,
	[ComponentSize.SM]: 16,
	[ComponentSize.MD]: 20,
	[ComponentSize.LG]: 24,
	[ComponentSize.XL]: 32,
	[ComponentSize.XXL]: 48,
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
	inherit: 'currentColor',
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
