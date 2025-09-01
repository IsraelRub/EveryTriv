module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.(t|j)s$': 'ts-jest',
	},
	collectCoverageFrom: [
		'**/*.(t|j)s',
		'!**/*.d.ts',
		'!**/node_modules/**',
		'!**/coverage/**',
		'!**/dist/**',
		'!**/test/**',
		'!**/__tests__/**',
	],
	coverageDirectory: '../coverage',
	testEnvironment: 'node',
	moduleNameMapping: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
	testTimeout: 10000,
};
