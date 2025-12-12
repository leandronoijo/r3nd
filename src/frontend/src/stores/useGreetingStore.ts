import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface GreetingFact {
  text: string;
  language: string;
  source: string;
  permalink: string;
}

export const useGreetingStore = defineStore('greeting', () => {
  const greeting = ref<string | null>(null);
  const fact = ref<GreetingFact | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchGreeting() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch('/api/greetings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      greeting.value = data.greeting;
      fact.value = data.fact;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch greeting';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    greeting,
    fact,
    loading,
    error,
    fetchGreeting
  };
});
