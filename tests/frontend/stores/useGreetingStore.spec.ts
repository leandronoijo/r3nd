import { setActivePinia, createPinia } from 'pinia';
import { useGreetingStore } from '../../../src/frontend/src/stores/useGreetingStore';

describe('useGreetingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should initialize with default state', () => {
    const store = useGreetingStore();

    expect(store.greeting).toBeNull();
    expect(store.fact).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  describe('fetchGreeting', () => {
    it('should fetch greeting successfully', async () => {
      const mockResponse = {
        greeting: 'Hello from R3ND',
        fact: {
          text: 'Test fact',
          language: 'en',
          source: 'test.com',
          permalink: 'https://test.com/fact',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        json: async () => mockResponse,
      });

      const store = useGreetingStore();
      await store.fetchGreeting();

      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.greeting).toBe('Hello from R3ND');
      expect(store.fact).toEqual(mockResponse.fact);
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      const store = useGreetingStore();
      await store.fetchGreeting();

      expect(store.loading).toBe(false);
      expect(store.error).toBe('HTTP error! status: Not Found');
      expect(store.greeting).toBeNull();
      expect(store.fact).toBeNull();
    });

    it('should handle non-JSON responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        headers: {
          get: () => 'text/html',
        },
      });

      const store = useGreetingStore();
      await store.fetchGreeting();

      expect(store.loading).toBe(false);
      expect(store.error).toBe('Expected JSON but received text/html');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const store = useGreetingStore();
      await store.fetchGreeting();

      expect(store.loading).toBe(false);
      expect(store.error).toBe('Network error');
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue(promise);

      const store = useGreetingStore();
      const fetchPromise = store.fetchGreeting();

      expect(store.loading).toBe(true);

      resolvePromise!({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ greeting: 'Test', fact: null }),
      });

      await fetchPromise;
      expect(store.loading).toBe(false);
    });
  });
});
