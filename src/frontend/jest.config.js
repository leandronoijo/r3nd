module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '.',
  roots: ['../../tests/frontend'],
  testMatch: ['**/*.spec.ts'],
  setupFilesAfterEnv: ['../../tests/frontend/setup.ts'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: './tsconfig.jest.json',
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'vue'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^vuetify$': '<rootDir>/../../tests/__mocks__/vuetify.ts',
    '^vuetify/(.*)$': '<rootDir>/../../tests/__mocks__/vuetify.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
  collectCoverageFrom: [
    'src/**/*.{ts,vue}',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
};

