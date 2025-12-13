import { defineStore } from 'pinia';
import { ref } from 'vue';

interface Fact {
  text: string;
  language: string;
  source: string;
  permalink: string;
}

export const useGreetingStore = defineStore('greeting', () => {
  const greeting = ref<string | null>(null);
  const fact = ref<Fact | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const getApiBaseUrl = (): string => {
    // Runtime injection takes precedence (server.js sets this)
    const runtimeVar = ((globalThis as any).__VITE_API_BASE_URL__) || undefined;
    // Fallback to default
    return runtimeVar ?? '/api';
  };

  async function fetchGreeting() {
    loading.value = true;
    error.value = null;

    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/greetings`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but received ${contentType}`);
      }

      const data = await response.json();
      greeting.value = data.greeting;
      fact.value = data.fact;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch greeting';
      console.error('Error fetching greeting:', err);
    } finally {
      loading.value = false;
    }
  }

  return {
    greeting,
    fact,
    loading,
    error,
    fetchGreeting,
  };
});
