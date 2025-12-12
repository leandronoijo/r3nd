import { setActivePinia, createPinia } from 'pinia';
import { useGreetingStore } from '../../../src/frontend/src/stores/useGreetingStore';

global.fetch = jest.fn();

describe('useGreetingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    jest.clearAllMocks();
  });

  it('should initialize with null values', () => {
    const store = useGreetingStore();
    
    expect(store.greeting).toBeNull();
    expect(store.fact).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should fetch greeting successfully', async () => {
    const mockData = {
      greeting: 'Hello from R3ND',
      fact: {
        text: 'Test fact',
        language: 'en',
        source: 'test',
        permalink: 'http://test.com'
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData
    });

    const store = useGreetingStore();
    await store.fetchGreeting();

    expect(store.greeting).toBe('Hello from R3ND');
    expect(store.fact).toEqual(mockData.fact);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    });

    const store = useGreetingStore();
    
    await expect(store.fetchGreeting()).rejects.toThrow();
    expect(store.error).toBeTruthy();
    expect(store.loading).toBe(false);
  });

  it('should handle network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const store = useGreetingStore();
    
    await expect(store.fetchGreeting()).rejects.toThrow();
    expect(store.error).toBe('Network error');
    expect(store.loading).toBe(false);
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
      json: async () => ({ greeting: 'Hi', fact: null })
    });

    await fetchPromise;
    expect(store.loading).toBe(false);
  });
});
