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
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const reactPlugin = require('eslint-plugin-react');



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
		},
	},
	plugins: {
		'@typescript-eslint': tseslint,
		'import': importPlugin,
		'simple-import-sort': simpleImportSort,
	},
	rules: {
		// TypeScript rules
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error',
			{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
		],
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-non-null-assertion': 'warn',

		// Import rules
		'import/order': 'off',
		'import/no-duplicates': 'error',
		'import/no-unresolved': 'off',
		'import/named': 'off',
		'import/namespace': 'off',
		'import/default': 'off',
		'import/no-named-as-default-member': 'off',

		// Simple import sort
		'simple-import-sort/imports': 'error',
		'simple-import-sort/exports': 'error',
	},
	settings: {
		'import/resolver': {
			typescript: {
				alwaysTryTypes: true,
				project: './tsconfig.json',
			},
		},
	},
};

const reactConfig = {
	...baseConfig,
	languageOptions: {
		...baseConfig.languageOptions,
		globals: {
			...baseConfig.languageOptions.globals,
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
		...baseConfig.plugins,
		'react': reactPlugin,
	},
	settings: {
		...baseConfig.settings,
		react: { version: 'detect' },
		'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
		'import/resolver': {
			typescript: {
				alwaysTryTypes: true,
				project: './client/tsconfig.json',
				paths: {
					'@/*': ['./client/src/*'],
					'src/*': ['./client/src/*'],
					'@components/*': ['./client/src/components/*'],
					'@hooks/*': ['./client/src/hooks/*'],
					'@services/*': ['./client/src/services/*'],
					'@types/*': ['./client/src/types/*'],
					'@utils/*': ['./client/src/utils/*'],
					'@constants/*': ['./client/src/constants/*'],
					'@redux/*': ['./client/src/redux/*'],
					'@views/*': ['./client/src/views/*'],
					'@shared': ['./shared'],
					'@shared/*': ['./shared/*']
				},
			},
		},
	},
	rules: {
		...baseConfig.rules,
		// React specific rules
		'react/prop-types': 'off',
		'react/no-unescaped-entities': 'off',
		'react/jsx-uses-react': 'warn',
		'@typescript-eslint/no-explicit-any': 'off', // Client allows any
		// Disable redeclare rule for client
		'no-redeclare': 'off',
	},
};

const testConfig = {
	...baseConfig,
	languageOptions: {
		...baseConfig.languageOptions,
		globals: {
			...baseConfig.languageOptions.globals,
			// Jest globals
			jest: 'readonly',
			describe: 'readonly',
			it: 'readonly',
			test: 'readonly',
			expect: 'readonly',
			beforeEach: 'readonly',
			afterEach: 'readonly',
			beforeAll: 'readonly',
			afterAll: 'readonly',
		},
	},
	rules: {
		...baseConfig.rules,
		// Disable any check for test files
		'@typescript-eslint/no-explicit-any': 'off',
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
		],
	},
	
	// Base recommended config
	js.configs.recommended,
	
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
					project: './server/tsconfig.json',
					paths: {
						'@modules/*': ['./server/src/modules/*'],
						'@infrastructure/*': ['./server/src/infrastructure/*'],
						'@shared': ['./shared'],
						'@shared/*': ['./shared/*'],
						'@shared/modules': ['./shared/modules'],
						'@shared/types': ['./shared/types'],
						'@shared/entities': ['./shared/entities'],
						'@shared/constants': ['./shared/constants'],
						'@internal/*': ['./server/src/internal/*'],
						'@internal/constants': ['./server/src/internal/constants'],
						'@internal/types': ['./server/src/internal/types'],
						'@internal/controllers': ['./server/src/internal/controllers'],
						'@internal/entities': ['./server/src/internal/entities'],
						'@internal/modules': ['./server/src/internal/modules'],
						'@internal/middleware': ['./server/src/internal/middleware'],
						'@features/*': ['./server/src/features/*'],
						'@common': ['./server/src/common'],
						'@common/*': ['./server/src/common/*'],
						'src/*': ['./server/src/*'],
						'src/internal/*': ['./server/src/internal/*'],
						'src/modules/*': ['./server/src/modules/*']
					},
				},
			},
		},
	},

	// Client configuration
	{
		files: ['client/**/*.{ts,tsx,js,jsx}'],
		...reactConfig,
		languageOptions: {
			...reactConfig.languageOptions,
			parser: tsparser,
		},
	},

	// Shared configuration
	{
		files: ['shared/**/*.{ts,js}'],
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
					project: './shared/tsconfig.json',
					paths: {
						'@shared/*': ['./shared/*'],
						'@shared': ['./shared'],
					},
				},
			},
		},
	},

	// Test configuration
	{
		files: ['**/*.spec.{ts,js}', '**/*.test.{ts,js}', '**/test/**/*.{ts,js}'],
		...testConfig,
		languageOptions: {
			...testConfig.languageOptions,
			parser: tsparser,
		},
		rules: {
			...testConfig.rules,
			// Ensure any is allowed in test files
			'@typescript-eslint/no-explicit-any': 'off',
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
];
