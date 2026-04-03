export default {
	content: [
		'./index.html',
		'./src/**/*.{js,ts,jsx,tsx}',
	],
	prefix: '',
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				success: {
					DEFAULT: 'hsl(var(--color-success-500))',
					100: 'hsl(var(--color-success-100))',
					300: 'hsl(var(--color-success-300))',
					500: 'hsl(var(--color-success-500))',
					700: 'hsl(var(--color-success-700))',
				},
				warning: {
					DEFAULT: 'hsl(var(--color-warning-500))',
					100: 'hsl(var(--color-warning-100))',
					300: 'hsl(var(--color-warning-300))',
					500: 'hsl(var(--color-warning-500))',
					700: 'hsl(var(--color-warning-700))',
				},
				error: {
					DEFAULT: 'hsl(var(--color-error-500))',
					100: 'hsl(var(--color-error-100))',
					300: 'hsl(var(--color-error-300))',
					500: 'hsl(var(--color-error-500))',
					700: 'hsl(var(--color-error-700))',
				},
				neutral: {
					DEFAULT: 'hsl(var(--color-neutral-500))',
					100: 'hsl(var(--color-neutral-100))',
					300: 'hsl(var(--color-neutral-300))',
					500: 'hsl(var(--color-neutral-500))',
					700: 'hsl(var(--color-neutral-700))',
				},
				glass: {
					light: 'var(--glass-light)',
					medium: 'var(--glass-medium)',
					border: 'var(--glass-border)',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
			fontFamily: {
				sans: ['var(--font-family-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				mono: ['var(--font-family-mono)', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};
