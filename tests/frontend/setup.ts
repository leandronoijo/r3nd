// Mock import.meta for Jest environment
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_BASE_URL: '/api',
      },
    },
  },
  writable: true,
  configurable: true,
});
