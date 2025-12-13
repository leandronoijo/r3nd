import { setActivePinia, createPinia } from 'pinia';
import { useGreetingStore } from '../../../src/frontend/stores/useGreetingStore';

describe('useGreetingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with null values', () => {
    const store = useGreetingStore();
    expect(store.greeting).toBeNull();
    expect(store.fact).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should fetch greeting successfully', async () => {
    const mockResponse = {
      greeting: 'Hello from R3ND',
      fact: {
        text: 'Test fact',
        language: 'en',
        source: 'test',
        permalink: 'http://test.com',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    });

    const store = useGreetingStore();
    await store.fetchGreeting();

    expect(store.greeting).toBe('Hello from R3ND');
    expect(store.fact).toEqual(mockResponse.fact);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should handle HTTP errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const store = useGreetingStore();
    await store.fetchGreeting();

    expect(store.greeting).toBeNull();
    expect(store.fact).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toContain('HTTP 500');
  });

  it('should handle non-JSON responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
    });

    const store = useGreetingStore();
    await store.fetchGreeting();

    expect(store.error).toContain('Expected JSON');
    expect(store.loading).toBe(false);
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const store = useGreetingStore();
    await store.fetchGreeting();

    expect(store.error).toContain('Network error');
    expect(store.loading).toBe(false);
  });
});
