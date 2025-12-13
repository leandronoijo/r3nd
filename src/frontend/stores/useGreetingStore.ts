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

  async function fetchGreeting() {
    loading.value = true;
    error.value = null;

    try {
      const apiBaseRuntime = ((globalThis as any).__VITE_API_BASE_URL__) || undefined;
      const apiBaseBuild = (import.meta.env.VITE_API_BASE_URL) || undefined;
      const apiBase = apiBaseRuntime ?? apiBaseBuild ?? '/api';

      const response = await fetch(`${apiBase}/greetings`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`);
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
