module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'vue'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'preserve',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  globals: {
    'import.meta': {
      env: {
        VITE_API_BASE_URL: undefined,
      },
    },
  },
};
