/**
 * EveryTriv ESLint Configuration
 * Unified configuration for client, server and shared
 *
 * @description Unified ESLint configuration file replacing separate files
 * @used_by All TypeScript/JavaScript files in the project
 */

const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const reactPlugin = require('eslint-plugin-react');
const prettier = require('eslint-config-prettier');



const baseConfig = {
	languageOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		globals: {
			// Node.js globals
			process: 'readonly',
			Buffer: 'readonly',
			__dirname: 'readonly',
			__filename: 'readonly',
			global: 'readonly',
			console: 'readonly',
			module: 'readonly',
			require: 'readonly',
			exports: 'readonly',
			// Timer functions
			setTimeout: 'readonly',
			clearTimeout: 'readonly',
			setInterval: 'readonly',
			clearInterval: 'readonly',
			// NodeJS types
			NodeJS: 'readonly',
			// Common globals
			key: 'readonly',
			// Node.js 18+ fetch API
			fetch: 'readonly',
			Response: 'readonly',
			Request: 'readonly',
		},
	},
	plugins: {
		'@typescript-eslint': tseslint,
		'import': importPlugin,
	},
	rules: {
		// TypeScript rules
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error',
			{ 
				argsIgnorePattern: '^_', 
				varsIgnorePattern: '^_',
				ignoreRestSiblings: true,
				caughtErrors: 'all',
				destructuredArrayIgnorePattern: '^_'
			},
		],
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-non-null-assertion': 'error',
		'no-unused-expressions': 'off',
		'@typescript-eslint/no-unused-expressions': 'error',
		'no-useless-constructor': 'off',
		'@typescript-eslint/no-useless-constructor': 'error',

		// JavaScript best practices
		'no-console': 'error',
		'prefer-const': 'error',
		'no-var': 'error',
		'eqeqeq': ['error', 'always', { null: 'ignore' }],
		'curly': ['error', 'multi-line'],
		'no-duplicate-imports': 'error',

		// Import rules (import/order removed - handled by Prettier)
		'import/no-duplicates': 'error',
		'import/no-unresolved': 'error',
		'import/named': 'error',
		'import/namespace': 'error',
		'import/default': 'error',
		'import/no-named-as-default-member': 'error',
	},
    settings: {
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
                project: '../../tsconfig.json',
            },
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
};

const reactConfig = {
	languageOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		globals: {
			// Node.js globals
			process: 'readonly',
			Buffer: 'readonly',
			__dirname: 'readonly',
			__filename: 'readonly',
			global: 'readonly',
			console: 'readonly',
			module: 'readonly',
			require: 'readonly',
			exports: 'readonly',
			// Timer functions
			setTimeout: 'readonly',
			clearTimeout: 'readonly',
			setInterval: 'readonly',
			clearInterval: 'readonly',
			// NodeJS types
			NodeJS: 'readonly',
			// Common globals
			key: 'readonly',
			// Node.js 18+ fetch API
			fetch: 'readonly',
			Response: 'readonly',
			Request: 'readonly',
			// Browser globals
			window: 'readonly',
			document: 'readonly',
			navigator: 'readonly',
			location: 'readonly',
			history: 'readonly',
			localStorage: 'readonly',
			sessionStorage: 'readonly',
			// React globals
			React: 'readonly',
			// DOM APIs
			HTMLInputElement: 'readonly',
			HTMLTextAreaElement: 'readonly',
			HTMLSelectElement: 'readonly',
			HTMLButtonElement: 'readonly',
			HTMLDivElement: 'readonly',
			HTMLHeadingElement: 'readonly',
			HTMLAudioElement: 'readonly',
			HTMLFormElement: 'readonly',
			SVGSVGElement: 'readonly',
			KeyboardEvent: 'readonly',
			confirm: 'readonly',
			// Web APIs
			Audio: 'readonly',
			AudioContext: 'readonly',
			performance: 'readonly',
			requestAnimationFrame: 'readonly',
			cancelAnimationFrame: 'readonly',
			AbortController: 'readonly',
			StorageEvent: 'readonly',
			Response: 'readonly',
			RequestInit: 'readonly',
			fetch: 'readonly',
			URLSearchParams: 'readonly',
			Blob: 'readonly',
			File: 'readonly',
			Buffer: 'readonly',
			Window: 'readonly',
			MouseEvent: 'readonly',
			btoa: 'readonly',
			URL: 'readonly',
			MediaQueryListEvent: 'readonly',
			HTMLElement: 'readonly',
			IntersectionObserver: 'readonly',
		},
		parserOptions: {
			ecmaFeatures: { jsx: true },
		},
	},
	plugins: {
		'@typescript-eslint': tseslint,
		'import': importPlugin,
		'react': reactPlugin,
	},
	settings: {
		react: { version: 'detect' },
		'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
		'import/resolver': {
			typescript: {
				alwaysTryTypes: true,
				project: '../../client/tsconfig.json',
				paths: {
					'@/*': ['../../client/src/*'],
					'src/*': ['../../client/src/*'],
					'@services/*': ['../../client/src/services/*'],
					'@types/*': ['../../client/src/types/*'],
					'@utils/*': ['../../client/src/utils/*'],
					'@constants/*': ['../../client/src/constants/*'],
					'@redux/*': ['../../client/src/redux/*'],
					'@shared': ['../../shared'],
					'@shared/*': ['../../shared/*'],
					'@shared/constants': ['../../shared/constants'],
					'@shared/constants/*': ['../../shared/constants/*'],
					'@shared/services': ['../../shared/services'],
					'@shared/services/*': ['../../shared/services/*'],
					'@shared/types': ['../../shared/types'],
					'@shared/types/*': ['../../shared/types/*'],
					'@shared/utils': ['../../shared/utils'],
					'@shared/utils/*': ['../../shared/utils/*'],
					'@shared/validation': ['../../shared/validation'],
					'@shared/validation/*': ['../../shared/validation/*']
				},
			},
			node: {
				extensions: ['.js', '.jsx', '.ts', '.tsx'],
				moduleDirectory: ['node_modules', 'src/'],
			},
		},
	},
	rules: {
		// TypeScript rules
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error',
			{ 
				argsIgnorePattern: '^_', 
				varsIgnorePattern: '^_',
				ignoreRestSiblings: true,
				caughtErrors: 'all',
				destructuredArrayIgnorePattern: '^_'
			},
		],
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-non-null-assertion': 'error',
		'no-unused-expressions': 'off',
		'@typescript-eslint/no-unused-expressions': 'error',
		'no-useless-constructor': 'off',
		'@typescript-eslint/no-useless-constructor': 'error',

		// JavaScript best practices
		'no-console': 'error',
		'prefer-const': 'error',
		'no-var': 'error',
		'eqeqeq': ['error', 'always', { null: 'ignore' }],
		'curly': ['error', 'multi-line'],
		'no-duplicate-imports': 'error',

		// Import rules (import/order removed - handled by Prettier)
		'import/no-duplicates': 'error',
		'import/no-unresolved': 'error',
		'import/named': 'error',
		'import/namespace': 'error',
		'import/default': 'error',
		'import/no-named-as-default-member': 'error',
		// React specific rules
		'react/prop-types': 'off',
		'react/no-unescaped-entities': ['error', {
			'forbid': ['>', '}']
		}],
		'react/jsx-uses-react': 'error',
		// Disable redeclare rule for client
		'no-redeclare': 'off',
	},
};


module.exports = [
	// Ignore patterns
	{
		ignores: [
			'dist/',
			'build/',
			'node_modules/',
			'*.config.js',
			'*.config.ts',
			'**/dist/**',
			'**/build/**',
			'**/node_modules/**',
			'**/dist-temp/**',
			'**/logs/**',
			'scripts/documentation/**/*.cjs',
			'server/src/main.ts',
		],
	},
	// Server configuration
	{
		files: ['server/**/*.{ts,js}'],
		...baseConfig,
		languageOptions: {
			...baseConfig.languageOptions,
			parser: tsparser,
		},
		settings: {
			...baseConfig.settings,
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: 'server/tsconfig.json',
				},
				node: {
					extensions: ['.js', '.jsx', '.ts', '.tsx'],
				},
			},
		},
	},

	// Client configuration
	{
		files: ['client/**/*.{ts,tsx,js,jsx}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				// Node.js globals
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				global: 'readonly',
				console: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly',
				// Timer functions
				setTimeout: 'readonly',
				clearTimeout: 'readonly',
				setInterval: 'readonly',
				clearInterval: 'readonly',
				// NodeJS types
				NodeJS: 'readonly',
				// Common globals
				key: 'readonly',
				// Node.js 18+ fetch API
				fetch: 'readonly',
				Response: 'readonly',
				Request: 'readonly',
				// Browser globals
				window: 'readonly',
				document: 'readonly',
				navigator: 'readonly',
				location: 'readonly',
				history: 'readonly',
				localStorage: 'readonly',
				sessionStorage: 'readonly',
				// React globals
				React: 'readonly',
				// DOM APIs
				HTMLInputElement: 'readonly',
				HTMLTextAreaElement: 'readonly',
				HTMLSelectElement: 'readonly',
				HTMLButtonElement: 'readonly',
				HTMLDivElement: 'readonly',
				HTMLHeadingElement: 'readonly',
				HTMLAudioElement: 'readonly',
				HTMLFormElement: 'readonly',
				SVGSVGElement: 'readonly',
				KeyboardEvent: 'readonly',
				confirm: 'readonly',
				// Web APIs
				Audio: 'readonly',
				AudioContext: 'readonly',
				performance: 'readonly',
				requestAnimationFrame: 'readonly',
				cancelAnimationFrame: 'readonly',
				AbortController: 'readonly',
				StorageEvent: 'readonly',
				RequestInit: 'readonly',
				URLSearchParams: 'readonly',
				Blob: 'readonly',
				File: 'readonly',
				Window: 'readonly',
				MouseEvent: 'readonly',
				btoa: 'readonly',
				URL: 'readonly',
				MediaQueryListEvent: 'readonly',
				HTMLElement: 'readonly',
				IntersectionObserver: 'readonly',
			},
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
			parser: tsparser,
		},
		plugins: {
			'@typescript-eslint': tseslint,
			'import': importPlugin,
			'react': reactPlugin,
		},
		settings: {
			react: { version: 'detect' },
			'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: 'client/tsconfig.json',
				},
				node: {
					extensions: ['.js', '.jsx', '.ts', '.tsx'],
					moduleDirectory: ['node_modules', 'src/'],
				},
			},
		},
		rules: {
			// TypeScript rules
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ 
					argsIgnorePattern: '^_', 
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
					caughtErrors: 'all',
					destructuredArrayIgnorePattern: '^_'
				},
			],
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-non-null-assertion': 'error',
			'no-unused-expressions': 'off',
			'@typescript-eslint/no-unused-expressions': 'error',
			'no-useless-constructor': 'off',
			'@typescript-eslint/no-useless-constructor': 'error',

			// JavaScript best practices
			'no-console': 'error',
			'prefer-const': 'error',
			'no-var': 'error',
			'eqeqeq': ['error', 'always', { null: 'ignore' }],
			'curly': ['error', 'multi-line'],
			'no-duplicate-imports': 'error',

			// Import rules (import/order removed - handled by Prettier)
			'import/no-duplicates': 'error',
			'import/no-unresolved': 'error',
			'import/named': 'error',
			'import/namespace': 'error',
			'import/default': 'error',
			'import/no-named-as-default-member': 'error',
			// React specific rules
			'react/prop-types': 'off',
			'react/no-unescaped-entities': ['error', {
				'forbid': ['>', '}']
			}],
			'react/jsx-uses-react': 'error',
			// Disable redeclare rule for client
			'no-redeclare': 'off',
		},
	},

	// Shared configuration
	{
		files: ['shared/**/*.{ts,js}'],
		...baseConfig,
		languageOptions: {
			...baseConfig.languageOptions,
			parser: tsparser,
			globals: {
				...baseConfig.languageOptions.globals,
				File: 'readonly',
				Buffer: 'readonly',
			},
		},
		settings: {
			...baseConfig.settings,
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: 'shared/tsconfig.json',
				},
				node: {
					extensions: ['.js', '.jsx', '.ts', '.tsx'],
				},
			},
		},
	},

	// Root level files
	{
		files: ['*.{ts,js}'],
		...baseConfig,
		languageOptions: {
			...baseConfig.languageOptions,
			parser: tsparser,
		},
	},

	// Allow console in specific files
	{
		files: [
			'server/src/migrations/**/*.ts',
			'shared/services/logging/**/*.ts',
			'client/src/components/error/**/*.tsx',
			'client/src/components/ui/ErrorBoundary.tsx',
		],
		rules: {
			'no-console': 'off',
		},
	},

	// Prettier config - must be last to override conflicting rules
	prettier
];
