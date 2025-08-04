import { type CSSProperties } from 'react';

export const themeColors = {
  primary: {
    main: 'rgb(102, 126, 234)',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    hover: 'rgb(82, 106, 214)',
  },
  secondary: {
    main: 'rgb(240, 147, 251)',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    hover: 'rgb(220, 127, 231)',
  },
  accent: {
    main: 'rgb(79, 172, 254)',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    hover: 'rgb(59, 152, 234)',
  },
  background: {
    main: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
    paper: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
  },
};

export const glassEffect: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
};

export const animations = {
  float: 'float 3s ease-in-out infinite',
  fadeIn: 'fade-in 0.7s cubic-bezier(0.4,0,0.2,1) both',
};

export const shadows = {
  glow: '0 0 50px rgba(102, 126, 234, 0.3)',
  subtle: '0 2px 10px rgba(0, 0, 0, 0.1)',
  medium: '0 4px 20px rgba(0, 0, 0, 0.15)',
};

export const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
};