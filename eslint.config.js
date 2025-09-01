/**
 * EveryTriv ESLint Configuration
 * קונפיגורציה מאוחדת עבור client, server ו-shared
 *
 * @description קובץ ESLint מאוחד המחליף את הקובצים הנפרדים
 * @used_by כל קבצי TypeScript/JavaScript בפרויקט
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
			KeyboardEvent: 'readonly',
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
