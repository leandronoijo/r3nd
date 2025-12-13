<template>
  <v-card data-test-id="greeting-card">
    <v-progress-linear
      v-if="loading"
      data-test-id="greeting-loading"
      indeterminate
      color="primary"
    />
    
    <v-card-title>Greeting</v-card-title>
    
    <v-card-text>
      <v-alert
        v-if="error"
        data-test-id="greeting-error"
        type="error"
        class="mb-4"
      >
        {{ error }}
      </v-alert>

      <div v-if="greeting" data-test-id="greeting-text" class="text-h5 mb-4">
        {{ greeting }}
      </div>

      <div v-if="fact">
        <div class="text-subtitle-1 mb-2">Random Fact:</div>
        <p data-test-id="greeting-fact-text" class="mb-2">
          {{ fact.text }}
        </p>
        <div class="text-caption">
          <strong>Language:</strong> {{ fact.language }} |
          <strong>Source:</strong> {{ fact.source }}
        </div>
        <a
          :href="fact.permalink"
          target="_blank"
          rel="noopener noreferrer"
          data-test-id="greeting-fact-link"
        >
          View original fact
        </a>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Fact {
  text: string;
  language: string;
  source: string;
  permalink: string;
}

defineProps<{
  greeting: string | null;
  fact: Fact | null;
  loading: boolean;
  error: string | null;
}>();
</script>

<style scoped>
.text-h5 {
  font-weight: 500;
}
</style>
