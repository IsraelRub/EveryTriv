import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ACCESSIBILITY_CONFIG,
  ANIMATION_CONFIG,
  PERFORMANCE_CONFIG,
} from '../../../constants/ui/animation.constants';

/**
 * Custom Animations Hook
 * Provides optimized animation utilities with performance monitoring
 *
 * @module useCustomAnimations
 * @description Hook for custom animations with performance optimization and accessibility support
 */
export function useCustomAnimations() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Optimized animation loop
  const createAnimationLoop = useCallback(
    (
      callback: (timestamp: number) => void,
      options: {
        fps?: number;
        enabled?: boolean;
      } = {}
    ) => {
      const { fps = PERFORMANCE_CONFIG.FPS.TARGET, enabled = true } = options;
      const interval = 1000 / fps;

      if (!enabled || isReducedMotion) {
        return () => {
          // No-op function when animations are disabled
        };
      }

      const animate = (timestamp: number) => {
        if (timestamp - lastUpdateRef.current >= interval) {
          callback(timestamp);
          lastUpdateRef.current = timestamp;
        }
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    },
    [isReducedMotion]
  );

  // Stagger animation utility
  const createStaggerAnimation = useCallback(
    (
      items: unknown[],
      baseDelay: number = ANIMATION_CONFIG.STAGGER.NORMAL,
      options: {
        direction?: 'forward' | 'reverse' | 'center';
        easing?: string;
      } = {}
    ) => {
      const { direction = 'forward', easing = 'ease-out' } = options;

      return items.map((_, index) => {
        let delay: number;

        switch (direction) {
          case 'reverse': {
            delay = (items.length - 1 - index) * baseDelay;
            break;
          }
          case 'center': {
            const centerIndex = Math.floor(items.length / 2);
            delay = Math.abs(index - centerIndex) * baseDelay;
            break;
          }
          default: {
            delay = index * baseDelay;
          }
        }

        return {
          delay,
          easing,
          index,
        };
      });
    },
    []
  );

  // Parallax effect utility
  const createParallaxEffect = useCallback(
    (
      speed: number = 0.5,
      options: {
        enabled?: boolean;
        threshold?: number;
      } = {}
    ) => {
      const { enabled = true } = options;

      if (!enabled || isReducedMotion) {
        return { x: 0, y: 0 };
      }

      const [offset, setOffset] = useState({ x: 0, y: 0 });

      useEffect(() => {
        const handleScroll = () => {
          const scrolled = window.pageYOffset;
          const rate = scrolled * speed;
          setOffset({ x: rate * 0.5, y: rate });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
      }, [speed]);

      return offset;
    },
    [isReducedMotion]
  );

  // Intersection Observer utility for scroll-triggered animations
  const useIntersectionAnimation = useCallback(
    (
      options: {
        threshold?: number;
        rootMargin?: string;
        triggerOnce?: boolean;
      } = {}
    ) => {
      const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
      const [isVisible, setIsVisible] = useState(false);
      const [hasTriggered, setHasTriggered] = useState(false);
      const elementRef = useRef<HTMLElement>(null);

      useEffect(() => {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
              setIsVisible(true);
              if (triggerOnce) setHasTriggered(true);
            } else if (!triggerOnce) {
              setIsVisible(false);
            }
          },
          { threshold, rootMargin }
        );

        if (elementRef.current) {
          observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
      }, [threshold, rootMargin, triggerOnce, hasTriggered]);

      return { elementRef, isVisible };
    },
    []
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsAnimating(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Memoized return values
  const returnValue = useMemo(
    () => ({
      // State
      isReducedMotion,
      isAnimating,

      // Utilities
      createAnimationLoop,
      createStaggerAnimation,
      createParallaxEffect,
      useIntersectionAnimation,

      // Cleanup
      cleanup,

      // Configuration
      config: {
        performance: PERFORMANCE_CONFIG,
        animation: ANIMATION_CONFIG,
        accessibility: ACCESSIBILITY_CONFIG,
      },
    }),
    [
      isReducedMotion,
      isAnimating,
      createAnimationLoop,
      createStaggerAnimation,
      createParallaxEffect,
      useIntersectionAnimation,
      cleanup,
    ]
  );

  return returnValue;
}
