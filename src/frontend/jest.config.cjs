/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  moduleFileExtensions: ['vue', 'js', 'jsx', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|sass|scss)$': 'identity-obj-proxy'
  },
  testMatch: ['**/tests/**/*.spec.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(vuetify|@vue|vue-router)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
