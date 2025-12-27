module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.spec.js', '**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.spec.js',
    '!src/**/*.test.js',
    '!src/**/*.fixed.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  moduleNameMapper: {
    '^inquirer$': '<rootDir>/src/__mocks__/inquirer.js'
  }
};
