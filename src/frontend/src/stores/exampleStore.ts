import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface ExampleItem {
  id: string;
  name: string;
  description: string;
}

export const useExampleStore = defineStore('example', () => {
  const items = ref<ExampleItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const itemCount = computed(() => items.value.length);

  async function fetchItems() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch('/api/examples');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      items.value = await response.json();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function addItem(item: Omit<ExampleItem, 'id'>) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch('/api/examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newItem = await response.json();
      items.value.push(newItem);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    items,
    loading,
    error,
    itemCount,
    fetchItems,
    addItem
  };
});
