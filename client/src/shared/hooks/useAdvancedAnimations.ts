import { useEffect, useRef, useState, useCallback } from 'react';
import { useAnimation } from 'framer-motion';

/**
 * Hook for triggering animations on scroll
 */
export const useScrollAnimation = (threshold: number = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

/**
 * Hook for advanced score animations with multiple triggers
 */
export const useAdvancedScoreAnimations = (score: number, total: number) => {
  const [effects, setEffects] = useState({
    confetti: false,
    pulse: false,
    glow: false,
    shake: false,
  });
  
  const prevScore = useRef(score);
  const prevTotal = useRef(total);
  const controls = useAnimation();

  const triggerEffect = useCallback((effectType: keyof typeof effects, duration: number = 2000) => {
    setEffects(prev => ({ ...prev, [effectType]: true }));
    setTimeout(() => {
      setEffects(prev => ({ ...prev, [effectType]: false }));
    }, duration);
  }, []);

  useEffect(() => {
    if (prevTotal.current !== total && score > prevScore.current) {
      const scoreIncrease = score - prevScore.current;
      
      // Perfect score
      if (total > 0 && score === total) {
        triggerEffect('confetti', 4000);
        triggerEffect('glow', 3000);
      }
      // High score milestone
      else if (score > 0 && score % 10 === 0) {
        triggerEffect('confetti', 3000);
        triggerEffect('pulse', 2000);
      }
      // Good streak
      else if (scoreIncrease >= 3) {
        triggerEffect('pulse', 1500);
      }
      // Any correct answer
      else if (scoreIncrease > 0) {
        triggerEffect('pulse', 1000);
      }
      
      // Animate score counter
      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 }
      });
    }
    
    // Wrong answer
    else if (prevTotal.current !== total && score === prevScore.current) {
      triggerEffect('shake', 500);
    }

    prevScore.current = score;
    prevTotal.current = total;
  }, [score, total, triggerEffect, controls]);

  return { effects, controls };
};

/**
 * Hook for managing multiple sequential animations
 */
export const useSequentialAnimations = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const playSequence = useCallback(async (steps: (() => Promise<void>)[]) => {
    setIsPlaying(true);
    setCurrentStep(0);
    
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await steps[i]();
    }
    
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  return { currentStep, isPlaying, playSequence };
};

/**
 * Hook for particle system management
 */
export const useParticleSystem = (maxParticles: number = 100) => {
  const [particles, setParticles] = useState<Array<{
    id: string;
    x: number;
    y: number;
    color: string;
    size: number;
    life: number;
  }>>([]);

  const addParticle = useCallback((x: number, y: number, options?: {
    color?: string;
    size?: number;
    life?: number;
  }) => {
    const newParticle = {
      id: Math.random().toString(36),
      x,
      y,
      color: options?.color || '#ffffff',
      size: options?.size || 2,
      life: options?.life || 3000,
    };

    setParticles(prev => {
      const updated = [...prev, newParticle];
      return updated.slice(-maxParticles); // Keep only latest particles
    });

    // Auto-remove particle after its lifetime
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, newParticle.life);
  }, [maxParticles]);

  const clearParticles = useCallback(() => {
    setParticles([]);
  }, []);

  return { particles, addParticle, clearParticles };
};
