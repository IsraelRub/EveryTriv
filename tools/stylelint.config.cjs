/**
 * Stylelint configuration for client CSS (Tailwind-compatible).
 * @see https://stylelint.io/user-guide/configure/
 */

/** @type {import('stylelint').Config} */
module.exports = {
	extends: ['stylelint-config-standard'],
	ignoreFiles: ['**/node_modules/**', '**/dist/**'],
	rules: {
		'at-rule-no-unknown': [
			true,
			{
				ignoreAtRules: [
					'apply',
					'config',
					'layer',
					'responsive',
					'screen',
					'tailwind',
					'theme',
					'variants',
				],
			},
		],
		'function-no-unknown': [
			true,
			{
				ignoreFunctions: ['theme'],
			},
		],
	},
};
