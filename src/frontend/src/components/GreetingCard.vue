<template>
  <v-card data-test-id="greeting-card">
    <v-card-title>Greeting</v-card-title>
    <v-card-text>
      <v-progress-linear 
        v-if="loading"
        data-test-id="greeting-loading"
        indeterminate
        color="primary"
      />
      
      <v-alert
        v-if="error"
        data-test-id="greeting-error"
        type="error"
        class="mt-2"
      >
        {{ error }}
      </v-alert>

      <div v-if="!loading && !error">
        <p 
          v-if="greeting"
          data-test-id="greeting-text"
          class="text-h6 mb-4"
        >
          {{ greeting }}
        </p>

        <v-divider v-if="fact" class="my-4" />

        <div v-if="fact">
          <p 
            data-test-id="greeting-fact-text"
            class="mb-2"
          >
            {{ fact.text }}
          </p>
          <p class="text-caption text-medium-emphasis">
            Source: {{ fact.source }} ({{ fact.language }})
          </p>
          <a 
            :href="fact.permalink"
            data-test-id="greeting-fact-link"
            target="_blank"
            class="text-decoration-none"
          >
            View fact
          </a>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
export interface GreetingFact {
  text: string;
  language: string;
  source: string;
  permalink: string;
}

defineProps<{
  greeting: string | null;
  fact: GreetingFact | null;
  loading: boolean;
  error: string | null;
}>();
</script>

<style scoped>
.v-card {
  max-width: 800px;
  margin: 0 auto;
}
</style>
