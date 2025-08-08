import { motion } from 'framer-motion';
import { FC, useMemo } from 'react';
import { staggerContainer, backgroundOrbVariants, backgroundParticleVariants, createFadeVariants } from './AnimationEffects';
import { ANIMATION_CONFIG } from './AnimationConfig';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  theme?: 'blue' | 'purple' | 'green' | 'rainbow';
}

export const AnimatedBackground: FC<AnimatedBackgroundProps> = ({ 
  children, 
  intensity = 'medium',
  theme = 'blue' 
}) => {
  // Dynamic configuration based on props
  const config = useMemo(() => {
    const baseConfig = {
      low: { particles: 3, orbSize: 600, animationSpeed: 0.5 },
      medium: { particles: 6, orbSize: 800, animationSpeed: 1 },
      high: { particles: 12, orbSize: 1000, animationSpeed: 1.5 },
    };

    const themeColors = {
      blue: {
        primary: 'from-blue-400/30 to-purple-500/30',
        secondary: 'from-emerald-400/25 to-cyan-500/25',
        tertiary: 'from-indigo-400/20 to-blue-400/20',
      },
      purple: {
        primary: 'from-purple-400/30 to-pink-500/30',
        secondary: 'from-violet-400/25 to-purple-500/25',
        tertiary: 'from-fuchsia-400/20 to-pink-400/20',
      },
      green: {
        primary: 'from-green-400/30 to-emerald-500/30',
        secondary: 'from-teal-400/25 to-green-500/25',
        tertiary: 'from-lime-400/20 to-green-400/20',
      },
      rainbow: {
        primary: 'from-red-400/30 to-yellow-500/30',
        secondary: 'from-green-400/25 to-blue-500/25',
        tertiary: 'from-purple-400/20 to-pink-400/20',
      },
    };

    return {
      ...baseConfig[intensity],
      colors: themeColors[theme],
    };
  }, [intensity, theme]);

  const backgroundVariants = createFadeVariants('up', 0, 2);

  return (
    <motion.div 
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"
      variants={backgroundVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Primary gradient orb */}
      <motion.div
        className={`absolute top-0 left-0 rounded-full bg-gradient-to-r ${config.colors.primary} blur-3xl`}
        style={{ 
          width: `${config.orbSize}px`, 
          height: `${config.orbSize}px` 
        }}
        variants={backgroundOrbVariants}
        animate={{
          x: [0, 300, -200, 0],
          y: [0, -200, 150, 0],
          scale: [1, 1.5, 0.7, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: ANIMATION_CONFIG.DURATION.BACKGROUND / config.animationSpeed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary gradient orb */}
      <motion.div
        className={`absolute top-1/4 right-0 rounded-full bg-gradient-to-l ${config.colors.secondary} blur-3xl`}
        style={{ 
          width: `${config.orbSize * 0.875}px`, 
          height: `${config.orbSize * 0.875}px` 
        }}
        variants={backgroundOrbVariants}
        animate={{
          x: [0, -250, 100, 0],
          y: [0, 200, -100, 0],
          scale: [1, 0.8, 1.4, 1],
          rotate: [0, -90, 180, 0],
        }}
        transition={{
          duration: (ANIMATION_CONFIG.DURATION.BACKGROUND - 2) / config.animationSpeed,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      {/* Third gradient orb */}
      <motion.div
        className={`absolute bottom-0 left-1/3 rounded-full bg-gradient-to-r ${config.colors.tertiary} blur-3xl`}
        style={{ 
          width: `${config.orbSize * 0.75}px`, 
          height: `${config.orbSize * 0.75}px` 
        }}
        variants={backgroundOrbVariants}
        animate={{
          x: [0, 150, -150, 0],
          y: [0, -100, 200, 0],
          scale: [1, 1.2, 0.9, 1],
          rotate: [0, 90, 270, 0],
        }}
        transition={{
          duration: (ANIMATION_CONFIG.DURATION.BACKGROUND + 2) / config.animationSpeed,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* Dynamic floating particles */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {Array.from({ length: config.particles }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            variants={backgroundParticleVariants}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: (3 + Math.random() * 2) / config.animationSpeed,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/30" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default AnimatedBackground;